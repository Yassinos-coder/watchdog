import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const tag = process.env.GITHUB_REF_NAME ?? process.argv[2];
const version = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;

if (!tag) {
  console.error('Pass the release tag as an argument or set GITHUB_REF_NAME.');
  process.exit(1);
}
if (tag !== `v${version}`) {
  console.error(`Tag ${tag} does not match the package version v${version}. Bump the versions or retag.`);
  process.exit(1);
}
console.log(`Release ${tag} matches the package version.`);
