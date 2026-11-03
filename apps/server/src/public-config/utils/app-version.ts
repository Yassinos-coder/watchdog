import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export class AppVersion {
  private static cached: string | null = null;

  static read(): string {
    if (AppVersion.cached) {
      return AppVersion.cached;
    }
    try {
      const raw = readFileSync(join(__dirname, '..', '..', '..', 'package.json'), 'utf8');
      AppVersion.cached = (JSON.parse(raw) as { version?: string }).version ?? 'unknown';
    } catch {
      AppVersion.cached = 'unknown';
    }
    return AppVersion.cached;
  }
}
