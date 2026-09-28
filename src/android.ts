import * as fs from 'fs/promises';
import * as path from 'path';

export const KEYTOOL_COMMAND =
  '  keytool -genkey -v -keystore android/app/upload-keystore.jks -storetype PKCS12 \
  -keyalg RSA -keysize 2048 -validity 10000 -alias upload';

const KEY_PROPERTIES =
`storePassword=CHANGE_ME
keyPassword=CHANGE_ME
keyAlias=upload
storeFile=upload-keystore.jks
# Put your keystore in android/app.
`;


const LOADER_BLOCK = `val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystorePropertiesFile.inputStream().use { keystoreProperties.load(it) }
}

`;

const SIGNING_BLOCK = (indent: string) =>
  [
    'signingConfigs {',
    '    create("release") {',
    '        if (keystorePropertiesFile.exists()) {',
    '            keyAlias = keystoreProperties["keyAlias"] as String',
    '            keyPassword = keystoreProperties["keyPassword"] as String',
    '            storeFile = keystoreProperties["storeFile"]?.let { file(it as String) }',
    '            storePassword = keystoreProperties["storePassword"] as String',
    '        }',
    '    }',
    '}',
    '',
    '',
  ]
    .map((line, i) => (i === 0 ? line : line ? indent + line : line))
    .join('\n') + indent;

const RELEASE_SIGNING =
  'signingConfig = if (keystorePropertiesFile.exists()) signingConfigs.getByName("release") else signingConfigs.getByName("debug")';

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export interface SigningResult {
  created: string[];
  patched: string[];
  skipped: string[];
  warnings: string[];
}


export async function applyAndroidSigning(root: string): Promise<SigningResult> {
  const res: SigningResult = { created: [], patched: [], skipped: [], warnings: [] };
  const androidDir = path.join(root, 'android');

  if (!(await exists(androidDir))) {
    res.warnings.push('No android/ folder found, skipped signing setup.');
    return res;
  }

  const keyProps = path.join(androidDir, 'key.properties');
  if (await exists(keyProps)) {
    res.skipped.push('android/key.properties (already exists, left untouched)');
  } else {
    await fs.writeFile(keyProps, KEY_PROPERTIES, 'utf8');
    res.created.push('android/key.properties');
  }

  await patchGitignore(root, res);

  const kts = path.join(androidDir, 'app', 'build.gradle.kts');
  const groovy = path.join(androidDir, 'app', 'build.gradle');

  if (!(await exists(kts))) {
    if (await exists(groovy)) {
      res.warnings.push(
        'android/app/build.gradle (Groovy) detected. Only Kotlin DSL (build.gradle.kts) is auto-patched; add the signing block manually.'
      );
    } else {
      res.warnings.push('android/app/build.gradle.kts not found, skipped Gradle patch.');
    }
    return res;
  }

  let src = await fs.readFile(kts, 'utf8');
  if (src.includes('keystoreProperties')) {
    res.skipped.push('android/app/build.gradle.kts (signing already configured)');
    return res;
  }

  const original = src;

  const imports: string[] = [];
  if (!src.includes('import java.util.Properties')) {imports.push('import java.util.Properties');}
  if (imports.length) {src = imports.join('\n') + '\n\n' + src;}

  const androidBlock = /^android\s*\{/m;
  if (!androidBlock.test(src)) {
    res.warnings.push('Could not find the android { } block in build.gradle.kts. Left unchanged.');
    return res;
  }
  src = src.replace(androidBlock, (m) => LOADER_BLOCK + m);

  const buildTypes = /^([ \t]*)buildTypes\s*\{/m;
  if (!buildTypes.test(src)) {
    res.warnings.push('Could not find buildTypes { } in build.gradle.kts. Left unchanged.');
    return res;
  }
  src = src.replace(buildTypes, (m, indent: string) => indent + SIGNING_BLOCK(indent) + m.slice(indent.length));

  const debugSigning = /signingConfig\s*=\s*signingConfigs\.getByName\("debug"\)/;
  if (debugSigning.test(src)) {
    src = src.replace(debugSigning, RELEASE_SIGNING);
  } else {
    src = src.replace(/(\brelease\s*\{)/, `$1\n ${RELEASE_SIGNING}`);
  }

  if (src !== original) {
    await fs.writeFile(kts, src, 'utf8');
    res.patched.push('android/app/build.gradle.kts');
  }
  return res;
}

async function patchGitignore(root: string, res: SigningResult): Promise<void> {
  const file = path.join(root, '.gitignore');
  const wanted = ['android/key.properties', '*.jks', '*.keystore'];
  let current = '';
  if (await exists(file)) {current = await fs.readFile(file, 'utf8');}
  const lines = new Set(current.split(/\r?\n/).map((l) => l.trim()));
  const missing = wanted.filter((w) => !lines.has(w) && !lines.has('key.properties') );
  const toAdd = missing.filter((w) => w !== 'android/key.properties' || !lines.has('**/key.properties'));
  if (toAdd.length === 0) {return;}
  const block = (current && !current.endsWith('\n') ? '\n' : '') + '\n# Android signing (added by Flutter Ninja)\n' + toAdd.join('\n') + '\n';
  await fs.writeFile(file, current + block, 'utf8');
  res.patched.push('.gitignore');
}
