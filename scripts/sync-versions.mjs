import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { currentVersion, readJson, ROOT } from './lib/versions.mjs';

const version = currentVersion();

const rootPath = join(ROOT, 'package.json');
const root = readJson(rootPath);
root.version = version;
writeFileSync(rootPath, `${JSON.stringify(root, null, 2)}\n`);

const VERSION_STRINGS = [
  ['packages/browser/src/browser-sdk.ts', /(name: 'watchdog\.browser', version: ')[^']+(')/],
  ['packages/node/src/node-sdk.ts', /(name: 'watchdog\.node', version: ')[^']+(')/],
  ['packages/react-native/src/native-sdk.ts', /(name: 'watchdog\.react-native', version: ')[^']+(')/],
  ['packages/python/src/watchdog_sdk/_version.py', /(__version__ = ")[^"]+(")/],
  ['packages/cli/src/run.ts', /(const CLI_VERSION = ')[^']+(')/],
];

for (const [file, pattern] of VERSION_STRINGS) {
  const path = join(ROOT, file);
  const source = readFileSync(path, 'utf8');
  if (!pattern.test(source)) {
    console.error(`Could not find the version string in ${file}`);
    process.exit(1);
  }
  writeFileSync(path, source.replace(pattern, `$1${version}$2`));
}

if (process.env.SKIP_INSTALL !== '1') {
  execFileSync('bun', ['install', '--lockfile-only'], { cwd: ROOT, stdio: 'inherit' });
}
console.log(`Synced version ${version} to the root package and the SDK version strings.`);
