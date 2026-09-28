import * as fs from 'fs/promises';
import * as path from 'path';

export interface IosSigningResult {
  created: string[];
  patched: string[];
  skipped: string[];
  warnings: string[];
}

const IOS_EXPORT_OPTIONS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store</string>
  <key>signingStyle</key>
  <string>manual</string>
  <key>teamID</key>
  <string>CHANGE_ME_TEAM_ID</string>
  <key>stripSwiftSymbols</key>
  <true/>
  <key>compileBitcode</key>
  <false/>
  <key>destination</key>
  <string>export</string>
</dict>
</plist>
`;

const IOS_RELEASE_CONFIG = `
# Flutter Ninja iOS publishing defaults
# Replace CHANGE_ME_TEAM_ID and the bundle ID if needed.
PRODUCT_BUNDLE_IDENTIFIER = CHANGE_ME_BUNDLE_ID
DEVELOPMENT_TEAM = CHANGE_ME_TEAM_ID
CODE_SIGN_STYLE = Automatic
FLUTTER_BUILD_NAME = 1.0.0
FLUTTER_BUILD_NUMBER = 1
`;

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function makeInfoPlist(appName: string, bundleId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>$(DEVELOPMENT_LANGUAGE)</string>
  <key>CFBundleDisplayName</key>
  <string>${xmlEscape(appName)}</string>
  <key>CFBundleExecutable</key>
  <string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key>
  <string>${xmlEscape(bundleId)}</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>${xmlEscape(appName)}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSRequiresIPhoneOS</key>
  <true/>
  <key>UIApplicationSupportsIndirectInputEvents</key>
  <true/>
  <key>UILaunchStoryboardName</key>
  <string>LaunchScreen</string>
  <key>UISupportedInterfaceOrientations</key>
  <array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string>
  </array>
  <key>UISupportedInterfaceOrientations~ipad</key>
  <array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationPortraitUpsideDown</string>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string>
  </array>
  <key>NSAppTransportSecurity</key>
  <dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
  </dict>
  <key>NSCameraUsageDescription</key>
  <string>This app needs camera access for features that require it. Update this text as needed.</string>
  <key>NSMicrophoneUsageDescription</key>
  <string>This app needs microphone access for features that require it. Update this text as needed.</string>
  <key>NSPhotoLibraryUsageDescription</key>
  <string>This app needs photo library access for features that require it. Update this text as needed.</string>
  <key>NSLocationWhenInUseUsageDescription</key>
  <string>This app needs location access for features that require it. Update this text as needed.</string>
</dict>
</plist>
`;
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function applyIOSPublishing(root: string, bundleId: string, displayName: string): Promise<IosSigningResult> {
  const res: IosSigningResult = { created: [], patched: [], skipped: [], warnings: [] };
  const iosDir = path.join(root, 'ios');

  if (!(await exists(iosDir))) {
    res.warnings.push('No ios/ folder found, skipped iOS publishing setup.');
    return res;
  }

  const infoPlist = path.join(iosDir, 'Runner', 'Info.plist');
  if (await exists(infoPlist)) {
    let current = await fs.readFile(infoPlist, 'utf8');
    const original = current;

    if (!/CFBundleIdentifier<\/key>/.test(current)) {
      current = current.replace(/<\/dict>\s*<\/plist>/s, `  <key>CFBundleIdentifier</key>\n  <string>${xmlEscape(bundleId)}</string>\n</dict>\n</plist>`);
    } else {
      current = current.replace(/<key>CFBundleIdentifier<\/key>\s*<string>.*?<\/string>/s, `<key>CFBundleIdentifier</key>\n  <string>${xmlEscape(bundleId)}</string>`);
    }

    if (!/CFBundleDisplayName<\/key>/.test(current)) {
      current = current.replace(/<\/dict>\s*<\/plist>/s, `  <key>CFBundleDisplayName</key>\n  <string>${xmlEscape(displayName)}</string>\n</dict>\n</plist>`);
    } else {
      current = current.replace(/<key>CFBundleDisplayName<\/key>\s*<string>.*?<\/string>/s, `<key>CFBundleDisplayName</key>\n  <string>${xmlEscape(displayName)}</string>`);
    }

    const permissionKeys = [
      'NSCameraUsageDescription',
      'NSMicrophoneUsageDescription',
      'NSPhotoLibraryUsageDescription',
      'NSLocationWhenInUseUsageDescription',
    ];

    for (const key of permissionKeys) {
      if (!new RegExp(`<key>${key}</key>`).test(current)) {
        current = current.replace(/<\/dict>\s*<\/plist>/s, `  <key>${key}</key>\n  <string>This app needs ${key.replace(/^NS/, '').replace(/UsageDescription$/, '').replace(/([A-Z])/g, ' $1').trim().toLowerCase()} access for features that require it. Update this text as needed.</string>\n</dict>\n</plist>`);
      }
    }

    if (current !== original) {
      await fs.writeFile(infoPlist, current, 'utf8');
      res.patched.push('ios/Runner/Info.plist');
    }
  } else {
    await fs.mkdir(path.dirname(infoPlist), { recursive: true });
    await fs.writeFile(infoPlist, makeInfoPlist(displayName, bundleId), 'utf8');
    res.created.push('ios/Runner/Info.plist');
  }

  const exportOptions = path.join(iosDir, 'Runner', 'ExportOptions.plist');
  if (await exists(exportOptions)) {
    await fs.writeFile(exportOptions, IOS_EXPORT_OPTIONS, 'utf8');
    res.patched.push('ios/Runner/ExportOptions.plist');
  } else {
    await fs.mkdir(path.dirname(exportOptions), { recursive: true });
    await fs.writeFile(exportOptions, IOS_EXPORT_OPTIONS, 'utf8');
    res.created.push('ios/Runner/ExportOptions.plist');
  }

  const releaseConfig = path.join(iosDir, 'Flutter', 'Release.xcconfig');
  if (await exists(releaseConfig)) {
    let current = await fs.readFile(releaseConfig, 'utf8');
    const original = current;

    for (const [key, value] of [['PRODUCT_BUNDLE_IDENTIFIER', bundleId], ['DEVELOPMENT_TEAM', 'CHANGE_ME_TEAM_ID'], ['CODE_SIGN_STYLE', 'Automatic'], ['FLUTTER_BUILD_NAME', '1.0.0'], ['FLUTTER_BUILD_NUMBER', '1']]) {
      const regex = new RegExp(`${key}\s*=.*$`, 'm');
      if (regex.test(current)) {
        current = current.replace(regex, `${key} = ${value}`);
      } else {
        current += `\n${key} = ${value}\n`;
      }
    }

    if (current !== original) {
      await fs.writeFile(releaseConfig, current, 'utf8');
      res.patched.push('ios/Flutter/Release.xcconfig');
    }
  } else {
    const flutterDir = path.join(iosDir, 'Flutter');
    await fs.mkdir(flutterDir, { recursive: true });
    await fs.writeFile(releaseConfig, IOS_RELEASE_CONFIG.replace('CHANGE_ME_BUNDLE_ID', bundleId), 'utf8');
    res.created.push('ios/Flutter/Release.xcconfig');
  }

  return res;
}
