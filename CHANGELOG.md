# Change Log

All notable changes to the "Flutter Ninja" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Planned

- Richer app-shell generation options
- Stronger app-specific module selection
- More advanced iOS and Android config templates
- Settings UI for default modules and dependencies

## [1.0.0] - 2026-09-28

### Added

- **Flutter Ninja: Configure Project** command, available from the Command Palette and the Explorer folder context menu.
- Four independently selectable setup options:
  - **Clean Architecture** — generates the full folder layout and barrel files with short start-here placeholders, no implementation code.
  - **Starter Core Blueprints** — fills the architecture with a working app shell, go_router routing, Riverpod state management, a Dio-based API client, local preferences, and example home/settings screens.
  - **Android Build Configuration** — generates `android/key.properties`, patches `android/app/build.gradle.kts` for release signing with a safe debug fallback, and updates `.gitignore` to keep signing files out of version control.
  - **iOS Build Configuration** — sets the bundle identifier and display name in `Info.plist`, adds standard permission-string placeholders, and generates `ExportOptions.plist` and `Release.xcconfig` for App Store delivery.
- New-project support: runs `flutter create` with the entered package name, organization, and description when no `pubspec.yaml` is found.
- Existing-project support: reads the project name from `pubspec.yaml` and never renames it; offers to update the description.
- Keep/replace choice when generated files already exist: **keep** adds only missing files, **replace** moves `lib/src` to the Trash (recoverable) and overwrites generated files.
- Project validation and warnings before generation, plus a summary report (created / replaced / skipped / patched / warnings) after each run.
- `android/key.properties` and existing signing files are never overwritten, even in replace mode.
- "Copy keytool command" action for generating a release keystore.
- Support for untrusted (not-yet-trusted) workspaces, so the command is available even in brand-new folders.
- Generated `NINJA_SETUP.md` checklist left in every new project as a pre-release review guide.

### Notes

- Only Kotlin DSL (`build.gradle.kts`) Android projects are auto-patched for signing; Groovy (`build.gradle`) projects receive a warning instead.
- Package/bundle identity is only set automatically for brand-new projects; renaming an existing project's identifiers is left to the developer.
