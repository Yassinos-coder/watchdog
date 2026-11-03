import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { currentVersion, readJson, ROOT, SCOPE, SDK_PACKAGES } from './lib/versions.mjs';

const DRY_RUN = process.env.DRY_RUN === '1';
const ENABLED = process.env.NPM_PUBLISH_ENABLED === 'true' || DRY_RUN;

const run = (command, args, options = {}) =>
  execFileSync(command, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...options });

const isPublished = (name, version) => {
  try {
    run('npm', ['view', `${name}@${version}`, 'version'], { stdio: ['ignore', 'pipe', 'pipe'] });
    return true;
  } catch {
    return false;
  }
};

const version = currentVersion();
const pending = SDK_PACKAGES.map((name) => `${SCOPE}${name}`).filter((name) => !isPublished(name, version));

if (pending.length === 0) {
  console.log(`Version ${version} is already on npm. Nothing to publish.`);
  process.exit(0);
}
if (!ENABLED) {
  console.log(
    `Version ${version} is not on npm yet, but publishing is switched off. ` +
      'Set the repository variable NPM_PUBLISH_ENABLED to "true" to publish automatically.',
  );
  process.exit(0);
}

console.log(`Publishing ${pending.join(', ')} at ${version}${DRY_RUN ? ' (dry run)' : ''}`);
const steps = [
  ['bun', ['run', 'build']],
  ['bun', ['run', 'test']],
  ['bun', ['run', 'verify:packages']],
];
for (const [command, args] of steps) {
  execFileSync(command, args, { cwd: ROOT, stdio: 'inherit' });
}

const packs = mkdtempSync(join(tmpdir(), 'watchdog-publish-'));
for (const name of SDK_PACKAGES) {
  const packageName = `${SCOPE}${name}`;
  if (!pending.includes(packageName)) {
    console.log(`${packageName}@${version} is already published, skipping`);
    continue;
  }
  const directory = join(ROOT, 'packages', name);
  execFileSync('bun', ['pm', 'pack', '--destination', packs], { cwd: directory, stdio: 'inherit' });
  const tarball = readdirSync(packs).find((file) => file.startsWith(`watchdog-sdk-${name}-`));
  const args = ['publish', join(packs, tarball), '--access', 'public', '--provenance'];
  if (DRY_RUN) {
    console.log(`[dry run] npm ${args.join(' ')}`);
    continue;
  }
  execFileSync('npm', args, { cwd: ROOT, stdio: 'inherit' });
  console.log(`New tag: ${packageName}@${version}`);
}

if (!DRY_RUN) {
  const tag = `v${version}`;
  try {
    run('git', ['tag', tag]);
    run('git', ['push', 'origin', tag]);
  } catch {
    console.log(`Tag ${tag} already exists, skipping`);
  }
  const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8');
  const section = new RegExp(`## \\[${version.replace(/\./g, '\\.')}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n## \\[|$)`).exec(changelog);
  const notes = section ? section[1].trim() : `Release ${tag}`;
  try {
    execFileSync('gh', ['release', 'create', tag, '--title', tag, '--notes', notes], { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.log(`GitHub release ${tag} already exists, skipping`);
  }
  console.log(`Published ${readJson(join(ROOT, 'package.json')).name} ${tag}`);
}
