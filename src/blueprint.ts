export interface Ctx {
  projectName: string;
  className: string;
  displayName: string;
  description: string;
}

export const FOLDERS: string[] = [
  "assets/docs",
  "assets/fonts",
  "assets/icons",
  "assets/images",
  "lib/src/core/app",
  "lib/src/core/constants",
  "lib/src/core/theme",
  "lib/src/core/utilities",
  "lib/src/data/local",
  "lib/src/data/repos",
  "lib/src/model/data_models",
  "lib/src/model/ui_models",
  "lib/src/presentation/features/home",
  "lib/src/presentation/features/home/widgets",
  "lib/src/presentation/features/setting",
  "lib/src/presentation/features/setting/widgets",
  "lib/src/presentation/screens",
  "lib/src/presentation/widgets",
  "lib/src/providers/app",
  "lib/src/services/api",
  "lib/src/services/navigation",
  "lib/src/services/notifications",
];

export const FILES: Record<string, string> = {
  "lib/main.dart": `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'src/core/app/app_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: AppShell()));
}
`,

  "test/widget_test.dart": `import 'package:flutter_test/flutter_test.dart';

// import 'package:{{projectName}}/main.dart';

void main() {
  testWidgets('Counter increments smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    // await tester.pumpWidget(const MyApp());

    // Verify that our counter starts at 0.
    expect(find.text('0'), findsOneWidget);
    expect(find.text('1'), findsNothing);

    // Tap the '+' icon and trigger a frame.
  });
}
`,

  "NINJA_SETUP.md": `# Flutter Ninja setup note

> Review this file before you start customizing the app.

This project was scaffolded with Flutter Ninja.

## Included by default

- app shell, core constants, theme, and utilities
- user preferences and app state provider
- splash/home/settings structure
- API and notifications service folders
- placeholder widgets and starter screens
- Android signing support and iOS release setup

## Important safety notes

Before using this project in a production workflow, review the following:

1. Confirm the app name, bundle ID, and display name are correct.
2. Check \`android/key.properties\` and fill in the real signing values before release builds.
3. Check \`ios/Flutter/Release.xcconfig\` and replace \`CHANGE_ME_TEAM_ID\` with your Apple Developer team ID.
4. Review \`ios/Runner/Info.plist\` and update permission strings so they match your app needs.
5. Review \`ios/Runner/ExportOptions.plist\` before App Store export.
6. Replace placeholder content in the generated screens and services with your real app logic.
7. Keep only the permissions and features your app truly needs.

## What is intentionally excluded

This starter is intentionally focused on a standard app shell and does not include heavy database logic or deeply custom domain features.

Ignored on purpose:
- med database files
- domain-heavy repository logic
- unnecessary model-heavy modules
- feature screens outside the home/settings shell

## Safe next steps

1. Update the generated app metadata and package identity.
2. Replace placeholder screens with real user flows.
3. Add real API integration only when required.
4. Review the generated code before you commit or publish.
5. Remove this note after your final project review.

## Contribution and release process

This project is open source and contributions are welcome.

- open PRs against the \`development\` branch
- maintainers review and approve PRs there
- approved changes can then move into the release flow and production branch

Please keep changes focused, tested, and well-documented.
`,

  "lib/src/core/core_index.dart": `export 'package:{{projectName}}/src/core/app/app_shell.dart';
export 'package:{{projectName}}/src/core/constants/app_assets.dart';
export 'package:{{projectName}}/src/core/constants/app_constants.dart';
export 'package:{{projectName}}/src/core/constants/app_strings.dart';
export 'package:{{projectName}}/src/core/theme/color.dart';
export 'package:{{projectName}}/src/core/theme/theme.dart';
export 'package:{{projectName}}/src/core/theme/typography.dart';
export 'package:{{projectName}}/src/core/utilities/app_helpers.dart';
export 'package:{{projectName}}/src/core/utilities/app_logger.dart';
export 'package:{{projectName}}/src/core/utilities/app_validators.dart';
`,

  "lib/src/core/app/app_shell.dart": `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:{{projectName}}/src/core/core_index.dart';
import 'package:{{projectName}}/src/providers/providers_index.dart';
import 'package:{{projectName}}/src/services/services_index.dart';

class AppShell extends ConsumerWidget {
  const AppShell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(appThemeModeProvider);

    return MaterialApp.router(
      title: AppStrings.appName,
      debugShowCheckedModeBanner: false,
      themeMode: themeMode,
      theme: ThemeData.light(),
      darkTheme: ThemeData.dark(),
      routerConfig: router,
    );
  }
}
`,

  "lib/src/core/constants/app_assets.dart": `abstract class AppAssets {
  AppAssets._();

  static const String appIcon = 'assets/images/appIcon.png';
  static const String appStoreIcon = 'assets/icons/appstore.svg';
  static const String playStoreIcon = 'assets/icons/playstore.svg';
}
`,

  "lib/src/core/constants/app_constants.dart": `import 'package:flutter/material.dart';

class AppConstants {
  AppConstants._();

  static const String appName = '{{displayName}}';
  static const String appDescription = '{{description}}';

  static const Color defaultAccentColor = Color(0xFF4F46E5);
  static const List<Color> accentColors = [
    defaultAccentColor,
    Color(0xFFF59E0B),
    Color(0xFF14B8A6),
    Color(0xFFEC4899),
    Color(0xFF0EA5E9),
    Color(0xFF8B5CF6),
  ];
}
`,

  "lib/src/core/constants/app_strings.dart": `abstract class AppStrings {
  AppStrings._();

  static const String appName = '{{displayName}}';
  static const String appSlogan = 'Keep the important moments in view.';
  static const String appDescription = '{{description}}';
}
`,

  "lib/src/core/theme/color.dart": `import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color indigo = Color(0xFF4F46E5);
  static const Color teal = Color(0xFF14B8A6);
  static const Color amber = Color(0xFFF59E0B);
  static const Color rose = Color(0xFFEC4899);
  static const Color violet = Color(0xFF8B5CF6);
  static const Color sky = Color(0xFF0EA5E9);

  static const Color lightBackground = Color(0xFFFAFAFC);
  static const Color darkBackground = Color(0xFF0F172A);
  static const Color lightText = Color(0xFFF8FAFC);
  static const Color darkText = Color(0xFF1E293B);
  static const Color mutedText = Color(0xFF94A3B8);
}
`,

  "lib/src/core/theme/theme.dart": `import 'package:flutter/material.dart';

class AppTheme {
  AppTheme._();

  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF4F46E5)),
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.fromSeed(
      seedColor: const Color(0xFF4F46E5),
      brightness: Brightness.dark,
    ),
  );
}
`,

  "lib/src/core/theme/typography.dart": `import 'package:flutter/material.dart';

class AppTypography {
  AppTypography._();

  static const TextStyle headline = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w700,
  );

  static const TextStyle body = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w400,
  );
}
`,

  "lib/src/core/utilities/app_helpers.dart": `import 'package:flutter/material.dart';

class AppHelpers {
  AppHelpers._();

  static String pluralize(String value, {int count = 1}) {
    if (count == 1) return value;
    return value.endsWith('s') ? '\${value}es' : '\${value}s';
  }
}
`,

  "lib/src/core/utilities/app_logger.dart": `class AppLogger {
  AppLogger._();

  static void debug(String message) => print('[DEBUG] $message');
  static void info(String message) => print('[INFO] $message');
  static void warning(String message) => print('[WARN] $message');
  static void error(String message, [Object? error]) => print('[ERROR] $message \${error ?? ''}');
}
`,

  "lib/src/core/utilities/app_validators.dart": `class AppValidators {
  AppValidators._();

  static String? required(String? value, {String label = 'Field'}) {
    if (value == null || value.trim().isEmpty) {
      return '$label is required.';
    }
    return null;
  }
}
`,

  "lib/src/data/data_index.dart": `export 'package:{{projectName}}/src/data/local/user_preferences.dart';
`,

  "lib/src/data/local/user_preferences.dart": `import 'package:shared_preferences/shared_preferences.dart';

class UserPreferences {
  static const _keyThemeMode = 'theme_mode';
  static const _keyAccentColor = 'accent_color';
  static const _keyUsername = 'username';

  final SharedPreferences prefs;

  const UserPreferences(this.prefs);

  String get username => prefs.getString(_keyUsername) ?? '';
  Future<void> setUsername(String value) => prefs.setString(_keyUsername, value);

  String get themeMode => prefs.getString(_keyThemeMode) ?? 'system';
  Future<void> setThemeMode(String value) => prefs.setString(_keyThemeMode, value);

  String get accentColor => prefs.getString(_keyAccentColor) ?? 'indigo';
  Future<void> setAccentColor(String value) => prefs.setString(_keyAccentColor, value);
}
`,

  "lib/src/providers/providers_index.dart": `export 'package:{{projectName}}/src/providers/app/app_provider.dart';
`,

  "lib/src/providers/app/app_provider.dart": `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/core_index.dart';
import '../../data/data_index.dart';

class AppState {
  const AppState({
    this.username = '',
    this.themeMode = ThemeMode.system,
    this.accentColor = AppConstants.defaultAccentColor,
  });

  final String username;
  final ThemeMode themeMode;
  final Color accentColor;

  AppState copyWith({
    String? username,
    ThemeMode? themeMode,
    Color? accentColor,
  }) {
    return AppState(
      username: username ?? this.username,
      themeMode: themeMode ?? this.themeMode,
      accentColor: accentColor ?? this.accentColor,
    );
  }
}

final appProvider = StateNotifierProvider<AppController, AppState>((ref) => AppController());
final appThemeModeProvider = Provider<ThemeMode>((ref) => ref.watch(appProvider).themeMode);
final appUsernameProvider = Provider<String>((ref) => ref.watch(appProvider).username);

class AppController extends StateNotifier<AppState> {
  AppController() : super(const AppState()) {
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    final userPrefs = UserPreferences(prefs);

    state = state.copyWith(
      username: userPrefs.username,
      themeMode: _themeModeFromString(userPrefs.themeMode),
      accentColor: _accentColorFromName(userPrefs.accentColor),
    );
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    final prefs = await SharedPreferences.getInstance();
    await UserPreferences(prefs).setThemeMode(_themeModeToString(mode));
    state = state.copyWith(themeMode: mode);
  }

  Future<void> setUsername(String value) async {
    final prefs = await SharedPreferences.getInstance();
    await UserPreferences(prefs).setUsername(value);
    state = state.copyWith(username: value);
  }

  ThemeMode _themeModeFromString(String value) {
    switch (value) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  String _themeModeToString(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.light:
        return 'light';
      case ThemeMode.dark:
        return 'dark';
      default:
        return 'system';
    }
  }

  Color _accentColorFromName(String value) {
    final match = AppConstants.accentColors.firstWhere(
      (color) => color.value.toRadixString(16) == value.replaceAll('#', ''),
      orElse: () => AppConstants.defaultAccentColor,
    );
    return match;
  }
}
`,

  "lib/src/services/services_index.dart": `export 'package:{{projectName}}/src/services/api/api_client.dart';
export 'package:{{projectName}}/src/services/navigation/app_routes.dart';
export 'package:{{projectName}}/src/services/navigation/router.dart';
export 'package:{{projectName}}/src/services/notifications/notification_service.dart';
`,

  "lib/src/services/api/api_client.dart": `class ApiClient {
  ApiClient();

  Future<String> fetchHealth() async {
    return 'ok';
  }
}
`,

  "lib/src/services/navigation/app_routes.dart": `class AppRoutes {
  AppRoutes._();

  static const String splash = '/';
  static const String home = '/home';
  static const String settings = '/settings';
}
`,

  "lib/src/services/navigation/router.dart": `import 'package:go_router/go_router.dart';
import 'package:{{projectName}}/src/presentation/presentation_index.dart';
import 'package:{{projectName}}/src/services/services_index.dart';

final GoRouter router = GoRouter(
  initialLocation: AppRoutes.splash,
  routes: [
    GoRoute(
      path: AppRoutes.splash,
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: AppRoutes.home,
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: AppRoutes.settings,
      builder: (context, state) => const SettingsScreen(),
    ),
  ],
);
`,

  "lib/src/services/notifications/notification_service.dart": `import 'package:flutter/material.dart';

class NotificationService {
  NotificationService._();

  static Future<void> showSnackBar(BuildContext context, String message) async {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }
}
`,

  "lib/src/presentation/presentation_index.dart": `export 'package:{{projectName}}/src/presentation/features/home/home_screen.dart';
export 'package:{{projectName}}/src/presentation/features/setting/settings_screen.dart';
export 'package:{{projectName}}/src/presentation/screens/splash_screen.dart';
export 'package:{{projectName}}/src/presentation/widgets/coming_soon.dart';
`,

  "lib/src/presentation/screens/splash_screen.dart": `import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:{{projectName}}/src/core/core_index.dart';
import 'package:{{projectName}}/src/services/services_index.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (!mounted) return;
      context.go(AppRoutes.home);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.apps, size: 72, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 20),
            Text(AppStrings.appName, style: AppTypography.headline),
            const SizedBox(height: 8),
            Text(AppStrings.appSlogan, style: AppTypography.body),
          ],
        ),
      ),
    );
  }
}
`,

  "lib/src/presentation/widgets/coming_soon.dart": `import 'package:flutter/material.dart';

class ComingSoonCard extends StatelessWidget {
  const ComingSoonCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Text(
          'Coming soon',
          style: Theme.of(context).textTheme.titleMedium,
        ),
      ),
    );
  }
}
`,

  "lib/src/presentation/features/home/home_screen.dart": `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:{{projectName}}/src/core/core_index.dart';
import 'package:{{projectName}}/src/providers/providers_index.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    final currentTheme = ref.watch(appThemeModeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Current mode: \${currentTheme.name}',
              style: AppTypography.body,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () {
                final nextTheme = currentTheme == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
                ref.read(appProvider.notifier).setThemeMode(nextTheme);
              },
              icon: const Icon(Icons.toggle_on),
              label: Text(
                currentTheme == ThemeMode.dark ? 'Switch to light' : 'Switch to dark',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
`,

  "lib/src/presentation/features/setting/settings_screen.dart": `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:{{projectName}}/src/core/core_index.dart';
import 'package:{{projectName}}/src/providers/providers_index.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  @override
  Widget build(BuildContext context) {
    final currentTheme = ref.watch(appThemeModeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Theme: \${currentTheme.name}',
              style: AppTypography.body,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () {
                final nextTheme = currentTheme == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
                ref.read(appProvider.notifier).setThemeMode(nextTheme);
              },
              icon: const Icon(Icons.brightness_6),
              label: Text(
                currentTheme == ThemeMode.dark ? 'Use light mode' : 'Use dark mode',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
`,

  "lib/src/presentation/features/home/widgets/home_action_card.dart": `import 'package:flutter/material.dart';

class HomeActionCard extends StatelessWidget {
  const HomeActionCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Text('Home action card', style: Theme.of(context).textTheme.titleMedium),
      ),
    );
  }
}
`,

  "lib/src/presentation/features/setting/widgets/setting_row.dart": `import 'package:flutter/material.dart';

class SettingRow extends StatelessWidget {
  const SettingRow({super.key});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: const Icon(Icons.settings),
      title: const Text('Setting row'),
      onTap: () {},
    );
  }
}
`,
};

export function architecturePlaceholder(file: string): string {
  if (file.endsWith(".md")) {
    return `# ${file}\n\nStart building here.\n`;
  }

  return `// Flutter Ninja architecture scaffold: ${file}\n// Start building here.\n`;
}

export const DEPENDENCIES = [
  "flutter_riverpod",
  "go_router",
  "shared_preferences",
];

export function render(template: string, ctx: Ctx): string {
  return template
    .replace(/\{\{projectName\}\}/g, ctx.projectName)
    .replace(/\{\{className\}\}/g, ctx.className)
    .replace(/\{\{displayName\}\}/g, ctx.displayName)
    .replace(/\{\{description\}\}/g, ctx.description);
}
