import { readdir, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { MapFile } from './interfaces';

const SKIPPED_DIRECTORIES = new Set(['node_modules', '.git']);
const MAP_SUFFIX = '.map';

export class MapCollector {
  static async collect(directory: string): Promise<MapFile[]> {
    const info = await stat(directory).catch(() => null);
    if (!info?.isDirectory()) {
      throw new TypeError(`${directory} is not a directory`);
    }
    const files: MapFile[] = [];
    await MapCollector.walk(directory, directory, files);
    return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  private static async walk(root: string, current: string, files: MapFile[]): Promise<void> {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const absolutePath = join(current, entry.name);
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) {
          await MapCollector.walk(root, absolutePath, files);
        }
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(MAP_SUFFIX)) {
        files.push({
          absolutePath,
          relativePath: relative(root, absolutePath).split(sep).join('/'),
          size: (await stat(absolutePath)).size,
        });
      }
    }
  }
}
