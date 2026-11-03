import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { UploadOptions } from './interfaces';

export const USAGE = `Watchdog CLI

Usage:
  watchdog sourcemaps upload <directory> --release <version> [options]

Options:
  --release <version>   Release the maps belong to (or WATCHDOG_RELEASE)
  --url <url>           Watchdog server URL (or WATCHDOG_URL)
  --project <id>        Project id (or WATCHDOG_PROJECT_ID)
  --token <token>       Project upload token (or WATCHDOG_UPLOAD_TOKEN)
  --dry-run             List the files without uploading
  -h, --help            Show this help
  -v, --version         Show the version
`;

export class ArgsError extends Error {}

export type ParsedCommand =
  | { kind: 'help' }
  | { kind: 'version' }
  | { kind: 'upload'; options: UploadOptions };

export class ArgsParser {
  static parse(argv: string[], env: NodeJS.ProcessEnv): ParsedCommand {
    const { values, positionals } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        release: { type: 'string' },
        url: { type: 'string' },
        project: { type: 'string' },
        token: { type: 'string' },
        'dry-run': { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
        version: { type: 'boolean', short: 'v', default: false },
      },
    });

    if (values.help || positionals.length === 0) {
      return { kind: 'help' };
    }
    if (values.version) {
      return { kind: 'version' };
    }
    const [group, action, directory] = positionals;
    if (group !== 'sourcemaps' || action !== 'upload' || !directory) {
      throw new ArgsError('Unknown command. Try: watchdog sourcemaps upload <directory> --release <version>');
    }

    const release = values.release ?? env.WATCHDOG_RELEASE;
    const url = values.url ?? env.WATCHDOG_URL;
    const projectId = values.project ?? env.WATCHDOG_PROJECT_ID;
    const token = values.token ?? env.WATCHDOG_UPLOAD_TOKEN;
    const missing = [
      !release && '--release',
      !url && '--url',
      !projectId && '--project',
      !token && '--token',
    ].filter(Boolean);
    if (missing.length > 0) {
      throw new ArgsError(`Missing required option(s): ${missing.join(', ')}`);
    }

    return {
      kind: 'upload',
      options: {
        directory: resolve(directory),
        release: release!,
        url: url!.replace(/\/+$/, ''),
        projectId: projectId!,
        token: token!,
        dryRun: values['dry-run'] ?? false,
      },
    };
  }
}
