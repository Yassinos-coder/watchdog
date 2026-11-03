import { createServer, IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ArgsError, ArgsParser } from './args';
import { MapCollector } from './collect-maps';
import { MapFile } from './interfaces';
import { run } from './run';
import { SourceMapUploader } from './uploader';

let directory: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'watchdog-cli-'));
  mkdirSync(join(directory, 'assets'), { recursive: true });
  mkdirSync(join(directory, 'node_modules', 'lib'), { recursive: true });
  writeFileSync(join(directory, 'assets', 'index-abc.js.map'), '{"version":3,"mappings":"AAAA"}');
  writeFileSync(join(directory, 'assets', 'index-abc.js'), 'console.log(1)');
  writeFileSync(join(directory, 'main.js.map'), '{"version":3,"mappings":"AAAA"}');
  writeFileSync(join(directory, 'node_modules', 'lib', 'x.js.map'), '{}');
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

const output = () => {
  const lines: string[] = [];
  const errors: string[] = [];
  return { lines, errors, log: (m: string) => lines.push(m), error: (m: string) => errors.push(m) };
};

describe('ArgsParser', () => {
  const env = {};

  it('shows help without arguments and with --help', () => {
    expect(ArgsParser.parse([], env)).toEqual({ kind: 'help' });
    expect(ArgsParser.parse(['--help'], env)).toEqual({ kind: 'help' });
  });

  it('parses an upload command from flags', () => {
    const command = ArgsParser.parse(
      ['sourcemaps', 'upload', 'dist', '--release', '1.2.3', '--url', 'https://wd.example.com/', '--project', 'p1', '--token', 't1'],
      env,
    );

    expect(command.kind).toBe('upload');
    if (command.kind === 'upload') {
      expect(command.options).toMatchObject({ release: '1.2.3', url: 'https://wd.example.com', projectId: 'p1', token: 't1', dryRun: false });
    }
  });

  it('falls back to environment variables', () => {
    const command = ArgsParser.parse(['sourcemaps', 'upload', 'dist'], {
      WATCHDOG_RELEASE: '9.9.9',
      WATCHDOG_URL: 'https://wd.example.com',
      WATCHDOG_PROJECT_ID: 'p1',
      WATCHDOG_UPLOAD_TOKEN: 't1',
    });

    expect(command.kind === 'upload' && command.options.release).toBe('9.9.9');
  });

  it('lists every missing option', () => {
    expect(() => ArgsParser.parse(['sourcemaps', 'upload', 'dist'], env)).toThrow(/--release, --url, --project, --token/);
  });

  it('rejects unknown commands', () => {
    expect(() => ArgsParser.parse(['deploy', 'now'], env)).toThrow(ArgsError);
  });
});

describe('MapCollector', () => {
  it('finds map files recursively, skipping node_modules, with posix relative paths', async () => {
    const files = await MapCollector.collect(directory);

    expect(files.map((file) => file.relativePath)).toEqual(['assets/index-abc.js.map', 'main.js.map']);
    expect(files[0].size).toBeGreaterThan(0);
  });

  it('rejects a missing directory', async () => {
    await expect(MapCollector.collect(join(directory, 'nope'))).rejects.toThrow(/not a directory/);
  });
});

describe('SourceMapUploader.batch', () => {
  const file = (name: string, size: number): MapFile => ({ absolutePath: name, relativePath: name, size });

  it('splits by file count and by byte size', () => {
    const many = Array.from({ length: 45 }, (_, index) => file(`f${index}.map`, 10));
    const big = [file('a.map', 30 * 1024 * 1024), file('b.map', 30 * 1024 * 1024)];

    expect(SourceMapUploader.batch(many).map((batch) => batch.length)).toEqual([20, 20, 5]);
    expect(SourceMapUploader.batch(big).map((batch) => batch.length)).toEqual([1, 1]);
    expect(SourceMapUploader.batch([])).toEqual([]);
  });
});

describe('run', () => {
  const args = (extra: string[] = []) => [
    'sourcemaps',
    'upload',
    directory,
    '--release',
    '1.0.0',
    '--url',
    'http://127.0.0.1:1',
    '--project',
    'p1',
    '--token',
    'wdt_secret',
    ...extra,
  ];

  it('performs a dry run without any network access', async () => {
    const out = output();

    const code = await run(args(['--dry-run']), {}, out, (() => {
      throw new Error('must not be called');
    }) as unknown as typeof fetch);

    expect(code).toBe(0);
    expect(out.lines.join('\n')).toContain('assets/index-abc.js.map');
    expect(out.lines.join('\n')).toContain('2 files would be uploaded');
  });

  it('fails when the directory has no maps', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'watchdog-empty-'));
    const out = output();

    const code = await run(['sourcemaps', 'upload', empty, '--release', '1', '--url', 'http://x', '--project', 'p', '--token', 't'], {}, out);

    rmSync(empty, { recursive: true, force: true });
    expect(code).toBe(1);
    expect(out.errors[0]).toContain('No .map files');
  });

  it('uploads the maps to a server with the bearer token and relative paths', async () => {
    const received: { url?: string; auth?: string; body: string }[] = [];
    const server = createServer((request: IncomingMessage, response) => {
      const chunks: Buffer[] = [];
      request.on('data', (chunk: Buffer) => chunks.push(chunk));
      request.on('end', () => {
        received.push({ url: request.url, auth: request.headers.authorization, body: Buffer.concat(chunks).toString('utf8') });
        response.writeHead(201, { 'content-type': 'application/json' }).end('{}');
      });
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    const out = output();

    const code = await run(args().map((value) => (value === 'http://127.0.0.1:1' ? `http://127.0.0.1:${port}` : value)), {}, out);
    await new Promise((resolve) => server.close(resolve));

    expect(code).toBe(0);
    expect(received).toHaveLength(1);
    expect(received[0].url).toBe('/api/projects/p1/releases/1.0.0/sourcemaps');
    expect(received[0].auth).toBe('Bearer wdt_secret');
    expect(received[0].body).toContain('filename="assets/index-abc.js.map"');
    expect(received[0].body).toContain('filename="main.js.map"');
    expect(out.lines.at(-1)).toContain('2 source maps uploaded');
  });

  it('surfaces server rejections with a failing exit code', async () => {
    const out = output();
    const fetchImpl = (async () => new Response('Invalid upload token', { status: 401 })) as unknown as typeof fetch;

    const code = await run(args(), {}, out, fetchImpl);

    expect(code).toBe(1);
    expect(out.errors[0]).toContain('401');
    expect(out.errors[0]).toContain('Invalid upload token');
  });
});
