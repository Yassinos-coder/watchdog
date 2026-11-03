import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

const ROOT = resolve(import.meta.dirname, '..');
const SCOPE = '@watchdog-sdk/';
const PACKAGES = ['core', 'browser', 'node', 'react', 'cli'];
const REQUIRED_FILES = ['package/package.json', 'package/README.md', 'package/LICENSE'];
const BLOCK = 512;

const rootVersion = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
const problems = [];

const run = (command, args, cwd) =>
  execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const cString = (buffer, start, end) => {
  const text = buffer.toString('utf8', start, end);
  const terminator = text.indexOf('\u0000');
  return terminator === -1 ? text : text.slice(0, terminator);
};

const readTarball = (path) => {
  const data = gunzipSync(readFileSync(path));
  const files = new Map();
  let offset = 0;
  while (offset + BLOCK <= data.length) {
    const name = cString(data, offset, offset + 100);
    if (!name) break;
    const size = parseInt(cString(data, offset + 124, offset + 136).trim() || '0', 8);
    const type = data.toString('utf8', offset + 156, offset + 157);
    if (type === '0' || type === '\u0000') {
      files.set(name, data.subarray(offset + BLOCK, offset + BLOCK + size));
    }
    offset += BLOCK + Math.ceil(size / BLOCK) * BLOCK;
  }
  return files;
};

for (const name of PACKAGES) {
  const dir = join(ROOT, 'packages', name);
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const label = pkg.name;

  if (pkg.name !== `${SCOPE}${name}`) problems.push(`${label}: name must be ${SCOPE}${name}`);
  if (pkg.private) problems.push(`${label}: must not be private`);
  if (pkg.version !== rootVersion) problems.push(`${label}: version ${pkg.version} does not match ${rootVersion}`);
  if (pkg.publishConfig?.access !== 'public') problems.push(`${label}: publishConfig.access must be public`);
  if (!existsSync(join(dir, 'dist'))) {
    problems.push(`${label}: dist is missing, run the build first`);
    continue;
  }

  const output = mkdtempSync(join(tmpdir(), 'watchdog-pack-'));
  try {
    run('bun', ['pm', 'pack', '--destination', output], dir);
    const tarball = join(output, readdirSync(output).find((file) => file.endsWith('.tgz')));
    const files = readTarball(tarball);
    const listing = [...files.keys()];

    for (const required of REQUIRED_FILES) {
      if (!listing.includes(required)) problems.push(`${label}: tarball is missing ${required}`);
    }
    if (!listing.some((entry) => entry.startsWith('package/dist/'))) {
      problems.push(`${label}: tarball has no dist files`);
    }
    if (listing.some((entry) => /\.(spec|test)\./.test(entry) || entry.includes('/src/'))) {
      problems.push(`${label}: tarball contains source or test files`);
    }

    const packed = JSON.parse(files.get('package/package.json').toString('utf8'));
    for (const section of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
      for (const [dependency, range] of Object.entries(packed[section] ?? {})) {
        if (String(range).startsWith('workspace:')) {
          problems.push(`${label}: ${dependency} is still "${range}" in the tarball`);
        }
      }
    }
    console.log(`${label}@${packed.version}: ${listing.length} files packed`);

    run('bunx', ['publint', '--strict', dir], ROOT);
    run('bunx', ['attw', '--pack', dir, '--profile', 'node16', '--ignore-rules', 'cjs-resolves-to-esm'], ROOT);
  } catch (error) {
    const detail = error.stdout?.toString() || error.stderr?.toString() || error.message;
    problems.push(`${label}: ${detail.trim().split('\n').slice(0, 14).join('\n    ')}`);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
}

if (problems.length > 0) {
  console.error(`\nPackage checks failed:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`\nAll ${PACKAGES.length} packages are ready to publish at ${rootVersion}.`);
