import { execFile } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";
import { applyAndroidSigning } from "./android";
import {
  architecturePlaceholder,
  Ctx,
  DEPENDENCIES,
  FILES,
  FOLDERS,
  render,
} from "./blueprint";
import { applyIOSPublishing } from "./ios";

export type Mode = "keep" | "replace";

export interface Modules {
  architecture: boolean;
  starter: boolean;
  android: boolean;
  ios: boolean;
}

export interface Report {
  created: string[];
  replaced: string[];
  skipped: string[];
  patched: string[];
  warnings: string[];
}

export function emptyReport(): Report {
  return { created: [], replaced: [], skipped: [], patched: [], warnings: [] };
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function run(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      { cwd, shell: process.platform === "win32" },
      (err, _out, stderr) => {
        if (err) {
          reject(new Error(stderr?.toString().trim() || err.message));
        } else {
          resolve();
        }
      },
    );
  });
}

// ---------- project info ----------

export interface PubspecInfo {
  name?: string;
  description?: string;
}

export async function readPubspec(
  root: string,
): Promise<PubspecInfo | undefined> {
  const file = path.join(root, "pubspec.yaml");
  if (!(await exists(file))) {
    return undefined;
  }
  const text = await fs.readFile(file, "utf8");
  const name = /^name:\s*([^\s#]+)/m.exec(text)?.[1];
  const raw = /^description:\s*(.*)$/m.exec(text)?.[1]?.trim();
  const description = raw ? raw.replace(/^['"]|['"]$/g, "") : undefined;
  return { name, description };
}

export async function updatePubspecDescription(
  root: string,
  description: string,
): Promise<boolean> {
  const file = path.join(root, "pubspec.yaml");
  const text = await fs.readFile(file, "utf8");
  const safe = JSON.stringify(description);
  const next = /^description:.*$/m.test(text)
    ? text.replace(/^description:.*$/m, "description: " + safe)
    : text.replace(/^(name:.*)$/m, "$1\ndescription: " + safe);
  if (next === text) {
    return false;
  }
  await fs.writeFile(file, next, "utf8");
  return true;
}

export async function flutterCreate(
  root: string,
  projectName: string,
  org: string,
  description: string,
): Promise<void> {
  await run(
    "flutter",
    [
      "create",
      "--project-name",
      projectName,
      "--org",
      org,
      "--description",
      description,
      ".",
    ],
    root,
  );
}

export async function addDependencies(root: string): Promise<void> {
  await run("flutter", ["pub", "add", ...DEPENDENCIES], root);
}

export function toPascal(snake: string): string {
  return snake
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");
}

export function toTitle(snake: string): string {
  return snake
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(" ");
}

export function dartEscape(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\$/g, "\\$")
    .replace(/\r?\n/g, " ");
}

// ---------- validation ----------

export interface GenerationValidationResult {
  ok: boolean;
  blockers: string[];
  warnings: string[];
}

export async function validateGenerationTarget(
  root: string,
  modules: Modules,
): Promise<GenerationValidationResult> {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!(await exists(root))) {
    blockers.push("Target folder does not exist.");
  }

  if (
    !modules.architecture &&
    !modules.starter &&
    !modules.android &&
    !modules.ios
  ) {
    blockers.push("Select at least one setup option before continuing.");
  }

  const hasPubspec = await exists(path.join(root, "pubspec.yaml"));
  const hasLib = await exists(path.join(root, "lib"));
  if (!hasPubspec && !hasLib && modules.architecture) {
    warnings.push(
      "No Flutter project detected yet. Flutter Ninja can create a fresh app shell, but the folder may not be a Flutter project yet.",
    );
  }

  return { ok: blockers.length === 0, blockers, warnings };
}

// ---------- conflicts ----------
export async function findConflicts(
  root: string,
  modules: Modules,
): Promise<string[]> {
  const found: string[] = [];
  if (modules.architecture || modules.starter) {
    if (await exists(path.join(root, "lib", "src"))) {
      found.push("lib/src/");
    }
    for (const rel of [...FOLDERS, ...Object.keys(FILES)]) {
      if (await exists(path.join(root, rel))) {
        found.push(rel);
      }
    }
  }
  if (
    modules.android &&
    (await exists(path.join(root, "android", "key.properties")))
  ) {
    found.push("android/key.properties");
  }
  return found;
}

// ---------- architecture ----------

export async function generateArchitecture(
  root: string,
  ctx: Ctx,
  mode: Mode,
  report: Report,
  includeStarterCode = false,
): Promise<void> {
  if (mode === "replace") {
    const src = path.join(root, "lib", "src");
    if (await exists(src)) {
      await vscode.workspace.fs.delete(vscode.Uri.file(src), {
        recursive: true,
        useTrash: true,
      });
      report.replaced.push("lib/src/ (moved to trash)");
    }
  }

  // Folders
  for (const folder of FOLDERS) {
    await fs.mkdir(path.join(root, folder), { recursive: true });
  }

  // Files
  for (const [rel, template] of Object.entries(FILES)) {
    if (rel === "test/widget_test.dart" && !includeStarterCode) {
      continue;
    }

    const target = path.join(root, rel);
    const already = await exists(target);

    if (already && mode === "keep") {
      if (
        includeStarterCode &&
        rel === "lib/src/providers/app/app_provider.dart"
      ) {
        const existingContent = await fs.readFile(target, "utf8");
        const usesLegacyNotifier = /\bStateNotifierProvider\b/.test(
          existingContent,
        );
        if (
          usesLegacyNotifier &&
          !existingContent.includes("package:flutter_riverpod/legacy.dart")
        ) {
          const riverpodImport =
            /^import\s+(['"])package:flutter_riverpod\/flutter_riverpod\.dart\1;$/m;
          const updatedContent = existingContent.replace(
            riverpodImport,
            "$&\nimport 'package:flutter_riverpod/legacy.dart';",
          );
          if (updatedContent !== existingContent) {
            await fs.writeFile(target, updatedContent, "utf8");
            report.patched.push(`${rel} (legacy Riverpod import)`);
          }
        }
      }

      report.skipped.push(rel);
      if (rel === "lib/main.dart") {
        report.warnings.push(
          "lib/main.dart was kept. To use the generated app, run {{className}}App() inside a ProviderScope from src/core/app/app.dart.".replace(
            "{{className}}",
            ctx.className,
          ),
        );
      }
      continue;
    }

    await fs.mkdir(path.dirname(target), { recursive: true });
    const content = includeStarterCode
      ? render(template, ctx)
      : architecturePlaceholder(rel);
    await fs.writeFile(target, content, "utf8");
    (already ? report.replaced : report.created).push(rel);
  }

  // Keep empty folders in git
  for (const folder of FOLDERS) {
    const hasFile = Object.keys(FILES).some((f) => f.startsWith(folder + "/"));
    const hasChildFolder = FOLDERS.some((f) => f.startsWith(folder + "/"));
    if (!hasFile && !hasChildFolder) {
      const keep = path.join(root, folder, ".gitkeep");
      if (!(await exists(keep))) {
        await fs.writeFile(keep, "", "utf8");
        report.created.push(folder + "/.gitkeep");
      }
    }
  }
}

export async function generateSigning(
  root: string,
  bundleId: string,
  displayName: string,
  report: Report,
): Promise<void> {
  await generateAndroid(root, report);
  await generateIOS(root, bundleId, displayName, report);
}

export async function generateAndroid(
  root: string,
  report: Report,
): Promise<void> {
  const result = await applyAndroidSigning(root);
  report.created.push(...result.created);
  report.patched.push(...result.patched);
  report.skipped.push(...result.skipped);
  report.warnings.push(...result.warnings);
}

export async function generateIOS(
  root: string,
  bundleId: string,
  displayName: string,
  report: Report,
): Promise<void> {
  const result = await applyIOSPublishing(root, bundleId, displayName);
  report.created.push(...result.created);
  report.patched.push(...result.patched);
  report.skipped.push(...result.skipped);
  report.warnings.push(...result.warnings);
}
