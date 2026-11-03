import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '..', '..');
export const SDK_PACKAGES = ['core', 'browser', 'node', 'react', 'cli'];
export const SCOPE = '@watchdog-sdk/';

export const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

export const currentVersion = () => readJson(join(ROOT, 'packages', 'core', 'package.json')).version;

const BUMP_RANK = { patch: 1, minor: 2, major: 3 };

export const bumpVersion = (version, bump) => {
  const [major, minor, patch] = version.split('.').map(Number);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
};

export const readChangesets = () => {
  const directory = join(ROOT, '.changeset');
  return readdirSync(directory)
    .filter((file) => file.endsWith('.md') && file.toLowerCase() !== 'readme.md')
    .map((file) => {
      const content = readFileSync(join(directory, file), 'utf8');
      const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(content);
      if (!match) return null;
      const bumps = [...match[1].matchAll(/^\s*["']?([^"':\s][^"':]*)["']?\s*:\s*(major|minor|patch)\s*$/gm)].map(
        (entry) => entry[2],
      );
      if (bumps.length === 0) return null;
      const bump = bumps.reduce((highest, next) => (BUMP_RANK[next] > BUMP_RANK[highest] ? next : highest));
      return { file, bump, summary: match[2].trim() };
    })
    .filter(Boolean);
};

export const highestBump = (changesets) =>
  changesets.reduce((highest, next) => (BUMP_RANK[next.bump] > BUMP_RANK[highest] ? next.bump : highest), 'patch');
