import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bumpVersion, currentVersion, highestBump, readChangesets, ROOT } from './lib/versions.mjs';

const changesets = readChangesets();
if (changesets.length === 0) {
  console.log('No changesets, nothing to add to the changelog.');
  process.exit(0);
}

const SECTIONS = [
  ['major', 'Changed'],
  ['minor', 'Added'],
  ['patch', 'Fixed'],
];

const version = bumpVersion(currentVersion(), highestBump(changesets));
const date = new Date().toISOString().slice(0, 10);

const body = SECTIONS.map(([bump, title]) => {
  const items = changesets.filter((changeset) => changeset.bump === bump);
  if (items.length === 0) return '';
  const lines = items.map((item) => `- ${item.summary.split(/\r?\n/).filter(Boolean).join(' ')}`);
  return `### ${title}\n${lines.join('\n')}\n`;
})
  .filter(Boolean)
  .join('\n');

const path = join(ROOT, 'CHANGELOG.md');
const changelog = readFileSync(path, 'utf8');
if (changelog.includes(`## [${version}]`)) {
  console.log(`CHANGELOG.md already has ${version}.`);
  process.exit(0);
}
const marker = changelog.indexOf('## [');
const entry = `## [${version}] - ${date}\n\n${body}\n`;
const updated = marker === -1 ? `${changelog}\n${entry}` : `${changelog.slice(0, marker)}${entry}${changelog.slice(marker)}`;
writeFileSync(path, updated);
console.log(`Added ${version} to CHANGELOG.md`);
