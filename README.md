# Flutter Ninja

Flutter Ninja is an open-source VS Code extension that helps developers scaffold a clean, production-ready Flutter app shell in minutes.

It is designed for teams and solo builders who want a strong starting point for standard Flutter apps without starting from a blank project each time. Choose any combination of four focused setup options: architecture, starter blueprints, Android build configuration, and iOS build configuration.

## Why this project exists

Starting a Flutter project from scratch often means repeating the same setup work:

- creating folder conventions
- wiring providers and app state
- adding route and shell structure
- setting up app constants, theme, and utilities
- preparing Android and iOS build configuration
- keeping the project clean and ready for real feature work

Flutter Ninja automates that baseline to save time and reduce mistakes.

## Four setup options

Every option is independently selectable, so Flutter Ninja can create only the foundation you need or compose the full project setup in one pass:

- **Clean Architecture** creates the complete folder layout and barrel files with short start-here placeholders, leaving implementation decisions to you.
- **Starter Core Blueprints** fills that architecture with the app shell, routing, state management, services, screens, and starter dependencies.
- **Android Build Configuration** prepares Gradle release signing, protected key properties, and a debug fallback while leaving existing credentials untouched.
- **iOS Build Configuration** prepares bundle identity, release configuration, export options, and editable permission placeholders for App Store delivery.

## What the generator creates

The extension produces a standard Flutter app shell with:

- `lib/` app structure and clean folder conventions
- app shell and provider architecture when Starter Core Blueprints is selected
- app constants, theme, helpers, and utilities
- user preferences handling
- placeholder home and settings feature structure
- service folders for API and notifications
- Android signing support for release builds
- iOS publishing config for App Store-ready setup
- a generated safety/setup guide for the new project

The generated structure is intentionally focused on standard app needs rather than highly custom database-heavy or domain-specific logic.

## Safe usage guidance

This extension is designed to help, but it should still be used carefully.

### Before running the generator

- confirm you are targeting the correct project folder
- review whether the target project is brand new or already contains app code
- for architecture or starter generation, choose whether to keep matching files and add only missing files, or replace generated files
- replace mode moves the existing `lib/src/` folder to Trash; matching generated files such as `lib/main.dart` are also replaced, while unrelated `lib/` files remain
- Android and iOS build setup each require confirmation and update only the selected platform's generated build settings
- review conflicts before continuing

### Protection built into the extension

The generator includes safeguards such as:

- project validation before generation
- separate overwrite confirmations for architecture and platform build setup
- conflict detection for generated files
- no overwrite of existing Android signing files
- warnings for risky project states
- summary reporting after generation

### iOS and Android publishing setup

The extension creates a standard release-ready baseline, but users should still review the generated output before shipping:

- update the real Apple Team ID for iOS signing
- confirm the iOS bundle ID is correct
- review permission descriptions in `ios/Runner/Info.plist`
- update any placeholder strings that are app-specific
- confirm Android signing values before release builds
- keep app-specific permissions limited to what the app actually needs

The generated output is meant to reduce setup friction, not replace final release review.

## Requirements

- VS Code
- Flutter SDK installed and available on your PATH
- access to a target folder or Flutter project root

## Installation

1. open this project in VS Code
2. run `npm install`
3. press `F5` to launch the extension in a development host window
4. open a real folder or Flutter project
5. run the command: `Flutter Ninja: Configure Project`

## Local development

From the repo root:

- `npm install`
- `npm run check-types`
- `npm run lint`
- `npm run compile`

To test the extension live:

- press `F5`
- in the new Extension Development Host window, open a project
- run the command from the Command Palette

## Packaging before release

Before publishing to VS Code Marketplace:

- run the validation commands above
- test the extension on a fresh Flutter project
- test it on an existing project in keep mode and replace mode
- confirm both Android and iOS configuration outputs look correct
- create a local VSIX package for final validation

Example:

- `npx @vscode/vsce package`

## Contributing

We welcome contributions from the community.

### How to contribute

1. fork the repository
2. create a feature branch from `development`
3. make your changes with clear commit history
4. keep changes focused and well-documented
5. open a pull request targeting `development`

### Pull request workflow

All pull requests should be opened against the `development` branch.

The team will review and approve PRs there. Once approved, changes can be merged into the release branch or production flow as part of the normal release process.

Please keep PRs:

- focused on one issue or feature
- readable and well-scoped
- tested locally before submission
- clear about what changed and why

### Branch strategy

Recommended flow:

- `development` for active work and review
- `production` for fully approved release-ready changes
- feature branches for isolated work

## Code of conduct

This project is open source and community-driven. Please be respectful, constructive, and collaborative in issue discussions, pull requests, and code review comments.

## Roadmap

Planned focus areas include:

- richer app-shell generation options
- stronger app-specific module selection
- more advanced iOS and Android config templates
- better onboarding docs and examples
- community PR review and release quality checks

## License

This project is open source. Developers are encouraged to contribute through a pull request

## Support

If you find a bug, want a feature, or have a question, open an issue or submit a pull request against `development`.

## Acknowledgements

Thanks to everyone contributing to cleaner Flutter tooling and better startup workflows for app teams.
