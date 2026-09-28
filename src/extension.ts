import * as vscode from "vscode";
import { KEYTOOL_COMMAND } from "./android";
import { Ctx } from "./blueprint";
import {
  addDependencies,
  dartEscape,
  emptyReport,
  findConflicts,
  flutterCreate,
  generateAndroid,
  generateArchitecture,
  generateIOS,
  Mode,
  Modules,
  readPubspec,
  Report,
  toPascal,
  toTitle,
  updatePubspecDescription,
  validateGenerationTarget,
} from "./generator";

const output = vscode.window.createOutputChannel("Flutter Ninja");

interface ProjectInfo {
  projectName: string;
  org: string;
  displayName: string;
  description: string;
  isNew: boolean;
  bundleId?: string;
}

interface ModuleQuickPickItem extends vscode.QuickPickItem {
  id: "architecture" | "starter" | "android" | "ios";
}

async function pickRoot(uri?: vscode.Uri): Promise<string | undefined> {
  // Right-clicked folder in the Explorer wins.
  if (uri) {
    const stat = await vscode.workspace.fs.stat(uri);
    if (stat.type & vscode.FileType.Directory) {
      return uri.fsPath;
    }
  }

  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage(
      "Flutter Ninja: open a folder first (File > Open Folder).",
    );
    return undefined;
  }

  if (folders.length === 1) {
    return folders[0].uri.fsPath;
  }

  const pick = await vscode.window.showWorkspaceFolderPick({
    placeHolder: "Which folder should Flutter Ninja generate into?",
  });

  return pick?.uri.fsPath;
}

async function selectModules(): Promise<Modules | undefined> {
  const items: ModuleQuickPickItem[] = [
    {
      label: "Clean Architecture",
      description: "Structure, folders, and barrel files only",
      detail:
        "Establishes a scalable Flutter layout with comment-only files ready for your code.",
      id: "architecture",
    },
    {
      label: "Starter Blueprints",
      description: "Requires Clean Architecture",
      detail:
        "Selecting this also selects Clean Architecture. Adds app shell, routing, state, services, and ready-to-run blueprints.",
      id: "starter",
    },
    {
      label: "Android Build Configuration",
      description: "Release signing and Gradle configuration",
      detail:
        "Prepares Android release signing, protected key properties, and a safe debug fallback.",
      id: "android",
    },
    {
      label: "iOS Build Configuration",
      description: "Bundle identity and App Store publishing defaults",
      detail:
        "Sets up iOS release configuration, export options, bundle identity, and permission placeholders.",
      id: "ios",
    },
  ];
  const architectureItem = items.find((item) => item.id === "architecture")!;
  const starterItem = items.find((item) => item.id === "starter")!;
  const picker = vscode.window.createQuickPick<ModuleQuickPickItem>();
  picker.items = items;
  picker.canSelectMany = true;
  picker.placeholder = "What should Flutter Ninja set up?";
  picker.title = "Flutter Ninja: project setup";
  picker.ignoreFocusOut = true;

  const previousSelection = new Set<string>();
  let updatingSelection = false;
  const selectedItems = await new Promise<
    readonly ModuleQuickPickItem[] | undefined
  >((resolve) => {
    picker.onDidChangeSelection((selection) => {
      if (updatingSelection) {
        return;
      }

      const selectedIds = new Set(selection.map((item) => item.id));
      const hadArchitecture = previousSelection.has(architectureItem.id);
      if (
        selectedIds.has(starterItem.id) &&
        !selectedIds.has(architectureItem.id)
      ) {
        selectedIds.add(architectureItem.id);
      } else if (
        hadArchitecture &&
        !selectedIds.has(architectureItem.id) &&
        selectedIds.has(starterItem.id)
      ) {
        selectedIds.delete(starterItem.id);
      }

      previousSelection.clear();
      for (const id of selectedIds) {
        previousSelection.add(id);
      }

      const normalizedSelection = items.filter((item) =>
        selectedIds.has(item.id),
      );
      if (normalizedSelection.length !== selection.length) {
        updatingSelection = true;
        picker.selectedItems = normalizedSelection;
        updatingSelection = false;
      }
    });
    picker.onDidAccept(() => finish(picker.selectedItems));
    picker.onDidHide(() => finish(undefined));

    let settled = false;
    function finish(selection: readonly ModuleQuickPickItem[] | undefined) {
      if (settled) {
        return;
      }
      settled = true;
      picker.dispose();
      resolve(selection);
    }

    picker.show();
  });

  if (!selectedItems || selectedItems.length === 0) {
    return undefined;
  }

  return {
    architecture: selectedItems.some(
      (i) => i.id === "architecture" || i.id === "starter",
    ),
    starter: selectedItems.some((i) => i.id === "starter"),
    android: selectedItems.some((i) => i.id === "android"),
    ios: selectedItems.some((i) => i.id === "ios"),
  };
}

async function collectProjectInfo(
  root: string,
  needsIos: boolean,
  needsArchitecture: boolean,
): Promise<ProjectInfo | undefined> {
  const pubspec = await readPubspec(root);
  const isNew = !pubspec?.name;
  let projectName =
    pubspec?.name ?? (needsIos || needsArchitecture ? "" : "my_app");
  let org = "com.example";

  if (isNew && (needsIos || needsArchitecture)) {
    const name = await vscode.window.showInputBox({
      title: "Flutter Ninja: project name",
      prompt: "Package name (lowercase, underscores)",
      placeHolder: "my_app",
      value: projectName || "my_app",
      validateInput: (v) =>
        /^[a-z][a-z0-9_]*$/.test(v)
          ? undefined
          : "Use lowercase letters, numbers, and underscores; start with a letter",
    });
    if (!name) {
      return undefined;
    }
    projectName = name;

    const o = await vscode.window.showInputBox({
      title: "Flutter Ninja: organization",
      prompt: "Reverse-domain organization used for Android/iOS app IDs",
      value: org,
      validateInput: (v) =>
        /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(v)
          ? undefined
          : "Example: com.macvoltex",
    });
    if (!o) {
      return undefined;
    }
    org = o;
  }

  let bundleId: string | undefined;
  if (needsIos) {
    bundleId = await vscode.window.showInputBox({
      title: "Flutter Ninja: iOS bundle ID",
      prompt: "Used for iOS release signing and App Store configuration",
      value: org
        ? `${org}.${projectName}`
        : `com.example.${projectName || "my_app"}`,
      validateInput: (v) =>
        /^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/.test(v)
          ? undefined
          : "Use a valid bundle identifier like com.company.app",
    });
    if (bundleId === undefined) {
      return undefined;
    }
  }

  let displayName = toTitle(projectName || "flutter_app");
  if (needsIos || needsArchitecture) {
    const enteredDisplayName = await vscode.window.showInputBox({
      title: "Flutter Ninja: app display name",
      prompt: "Shown in the app title bar and constants",
      value: displayName,
    });
    if (!enteredDisplayName) {
      return undefined;
    }
    displayName = enteredDisplayName;
  }

  const existingDescription =
    pubspec?.description &&
    !/^a new flutter project\.?$/i.test(pubspec.description)
      ? pubspec.description
      : "";

  let description = existingDescription;
  if (needsArchitecture) {
    const enteredDescription = await vscode.window.showInputBox({
      title: "Flutter Ninja: app description",
      prompt: "What does the app do?",
      value: existingDescription,
    });
    if (enteredDescription === undefined) {
      return undefined;
    }
    description = enteredDescription;
  }

  return { projectName, org, displayName, description, isNew, bundleId };
}

async function chooseOverwriteMode(
  root: string,
  modules: Modules,
): Promise<Mode | undefined> {
  const architectureScope = modules.starter
    ? "Clean Architecture folders and barrel files, plus the Starter Core app shell, routing, state, services, and blueprints"
    : "Clean Architecture folders and barrel files";
  const conflicts = await findConflicts(root, {
    ...modules,
    android: false,
    ios: false,
  });

  const choice = await vscode.window.showQuickPick(
    [
      {
        label: "Keep existing files and add missing architecture files",
        description: `Creates missing ${architectureScope} files and leaves matching files untouched.`,
        id: "keep",
      },
      {
        label: "Replace existing generated files",
        description: `Replaces lib/src and matching generated files for ${architectureScope}.`,
        id: "replace",
      },
    ],
    {
      title:
        conflicts.length > 0
          ? `Flutter Ninja: ${conflicts.length} generated path(s) already exist`
          : "Flutter Ninja: choose architecture file handling",
      placeHolder: "How should existing files be handled?",
      ignoreFocusOut: true,
    },
  );

  if (!choice) {
    return undefined;
  }

  if (choice.id === "replace") {
    const ok = await vscode.window.showWarningMessage(
      "Flutter Ninja will move the existing lib/src/ folder to the Trash, then recreate it. Matching generated files such as lib/main.dart and test/widget_test.dart will be replaced; other lib/ files will remain. Continue?",
      { modal: true },
      "Replace",
    );
    if (ok !== "Replace") {
      return undefined;
    }
  }

  return choice.id as Mode;
}

async function confirmPlatformBuild(modules: Modules): Promise<boolean> {
  if (!modules.android && !modules.ios) {
    return true;
  }

  const selectedFolders = [
    modules.android ? "android/" : undefined,
    modules.ios ? "ios/" : undefined,
  ].filter(Boolean);
  const effects = [
    modules.ios ? "Custom iOS native files will be preserved." : undefined,
    modules.android
      ? "Custom Android native files and existing Android signing credentials will be preserved."
      : undefined,
    modules.architecture || modules.starter
      ? `${modules.starter ? "Clean Architecture folders and barrel files, plus the Starter Core app shell, routing, state, services, and blueprints, will be generated" : "Clean Architecture folders and barrel files will be generated"}; existing generated files follow the separate keep/replace choice.`
      : undefined,
    modules.android
      ? "Android setup may also update the root .gitignore."
      : undefined,
  ].filter(Boolean);
  const answer = await vscode.window.showWarningMessage(
    `Flutter Ninja will write or refresh its generated build settings in ${selectedFolders.join(" and ")}. ${effects.join(" ")} Continue?`,
    { modal: true },
    "Continue",
  );

  return answer === "Continue";
}

async function generate(uri?: vscode.Uri): Promise<void> {
  const root = await pickRoot(uri);
  if (!root) {
    return;
  }

  const modules = await selectModules();
  if (!modules) {
    return;
  }

  const hasArchitecture = modules.architecture || modules.starter;
  const mode = hasArchitecture
    ? await chooseOverwriteMode(root, modules)
    : "keep";
  if (!mode) {
    return;
  }

  if (!(await confirmPlatformBuild(modules))) {
    return;
  }

  const validation = await validateGenerationTarget(root, modules);
  if (!validation.ok) {
    const details = validation.blockers.join("\n");
    vscode.window.showErrorMessage(
      `Flutter Ninja cannot continue:\n${details}`,
    );
    output.appendLine(`BLOCKED: ${details}`);
    return;
  }

  if (validation.warnings.length > 0) {
    const ok = await vscode.window.showWarningMessage(
      `Flutter Ninja detected important project state:\n${validation.warnings.join("\n")}`,
      "Continue",
      "Cancel",
    );
    if (ok !== "Continue") {
      return;
    }
  }

  const info = await collectProjectInfo(root, modules.ios, hasArchitecture);
  if (!info) {
    return;
  }

  const ctx: Ctx = {
    projectName: info.projectName,
    className: toPascal(info.projectName),
    displayName: dartEscape(info.displayName),
    description: dartEscape(info.description),
  };

  const report = emptyReport();

  const summary = [
    `Project: ${info.displayName}`,
    `Package: ${info.projectName}`,
    `Modules: ${
      Object.entries(modules)
        .filter(([, enabled]) => enabled)
        .map(([name]) => name)
        .join(", ") || "none"
    }`,
    `Overwrite: ${hasArchitecture ? mode : "not applicable"}`,
  ].join(" • ");

  vscode.window.showInformationMessage(
    `Flutter Ninja is ready to generate.\n${summary}`,
  );

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Flutter Ninja",
        cancellable: false,
      },
      async (progress) => {
        const existingPubspec = await readPubspec(root);

        if (info.isNew && hasArchitecture) {
          progress.report({ message: "Running flutter create..." });
          await flutterCreate(
            root,
            info.projectName,
            info.org,
            info.description,
          );
          report.created.push("Flutter project (flutter create)");
        } else if (
          hasArchitecture &&
          !info.isNew &&
          info.description &&
          info.description !== (existingPubspec?.description ?? "")
        ) {
          const updated = await updatePubspecDescription(
            root,
            info.description,
          );
          if (updated) {
            report.patched.push("pubspec.yaml (description)");
          }
        }

        if (modules.architecture || modules.starter) {
          progress.report({
            message: modules.starter
              ? "Generating starter blueprints..."
              : "Creating clean architecture...",
          });
          await generateArchitecture(root, ctx, mode, report, modules.starter);
        }

        if (modules.android) {
          progress.report({
            message: "Configuring Android build and signing...",
          });
          await generateAndroid(root, report);
        }

        if (modules.starter) {
          progress.report({ message: "Adding starter dependencies..." });
          try {
            await addDependencies(root);
            report.patched.push(
              "pubspec.yaml (flutter_riverpod, go_router, shared_preferences)",
            );
          } catch (e) {
            report.warnings.push(
              `Could not run flutter pub add: ${(e as Error).message}. Run it manually: flutter pub add flutter_riverpod go_router shared_preferences`,
            );
          }
        }

        if (modules.ios) {
          progress.report({
            message: "Configuring iOS build and publishing...",
          });
          await generateIOS(
            root,
            info.bundleId ?? `${info.org}.${info.projectName || "my_app"}`,
            info.displayName,
            report,
          );
        }
      },
    );
  } catch (e) {
    const msg = (e as Error).message;
    vscode.window.showErrorMessage(`Flutter Ninja failed: ${msg}`);
    output.appendLine(`ERROR: ${msg}`);
    output.show(true);
    return;
  }

  logReport(report);
  await finish(root, report, modules);
}

function logReport(r: Report): void {
  output.clear();
  const section = (title: string, list: string[]) => {
    if (list.length) {
      output.appendLine(`${title} (${list.length})`);
      list.forEach((i) => output.appendLine(`  ${i}`));
      output.appendLine("");
    }
  };

  section("Created", r.created);
  section("Replaced", r.replaced);
  section("Patched", r.patched);
  section("Skipped (already existed)", r.skipped);
  section("Warnings", r.warnings);
}

async function finish(
  root: string,
  r: Report,
  modules: Modules,
): Promise<void> {
  const summary = `Flutter Ninja: ${r.created.length} created, ${r.replaced.length} replaced, ${r.patched.length} patched, ${r.skipped.length} skipped.`;
  const buttons: string[] = ["Show details"];

  if (modules.android) {
    buttons.unshift("Copy keytool command");
  }

  const pick = r.warnings.length
    ? await vscode.window.showWarningMessage(
        `${summary} ${r.warnings.length} warning(s), see details.`,
        ...buttons,
      )
    : await vscode.window.showInformationMessage(summary, ...buttons);

  if (pick === "Copy keytool command") {
    await vscode.env.clipboard.writeText(KEYTOOL_COMMAND);
    vscode.window.showInformationMessage(
      "Keytool command copied. Run it in your project root, then set your passwords in android/key.properties.",
    );
  } else if (pick === "Show details") {
    output.show(true);
  }
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    output,
    vscode.commands.registerCommand(
      "flutter-ninja.generateArchitecture",
      (uri?: vscode.Uri) => generate(uri),
    ),
  );
}

export function deactivate() {}
