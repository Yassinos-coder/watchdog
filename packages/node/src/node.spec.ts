import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Transport, WatchdogEvent } from '@watchdog/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ContextLines } from './context-lines';
import { ExceptionPolicy } from './exception-policy';
import { expressErrorHandler } from './express';
import { captureException, captureMessage, captureRequestError, close, init } from './node-sdk';
import { RequestContextBuilder } from './request-context';

const DSN = 'https://key123@watchdog.example.com/3f2b8c1a-1111-4222-8333-444455556666';

class MemoryTransport implements Transport {
  events: WatchdogEvent[] = [];
  send(event: WatchdogEvent): void {
    this.events.push(event);
  }
  async flush(): Promise<boolean> {
    return true;
  }
}

let directory: string;
let transport: MemoryTransport;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'watchdog-node-'));
  transport = new MemoryTransport();
  ContextLines.clearCache();
});

afterEach(() => {
  close();
  rmSync(directory, { recursive: true, force: true });
});

const writeSource = (): string => {
  const path = join(directory, 'service.js');
  writeFileSync(
    path,
    ['line 1', 'line 2', 'line 3', 'const total = cart.items.length;', 'line 5', 'line 6', 'line 7'].join('\n'),
  );
  return path;
};

describe('ContextLines', () => {
  it('adds the failing line with surrounding code', () => {
    const path = writeSource();

    const [frame] = ContextLines.enrich([{ filename: path, lineno: 4, inApp: true }]);

    expect(frame.contextLine).toBe('const total = cart.items.length;');
    expect(frame.preContext).toEqual(['line 1', 'line 2', 'line 3']);
    expect(frame.postContext).toEqual(['line 5', 'line 6', 'line 7']);
  });

  it('understands file:// urls from ES modules', () => {
    const path = writeSource();

    const [frame] = ContextLines.enrich([{ filename: pathToFileURL(path).href, lineno: 4, inApp: true }]);

    expect(frame.contextLine).toBe('const total = cart.items.length;');
  });

  it('leaves vendor frames, remote urls, node internals and missing files alone', () => {
    const frames = [
      { filename: writeSource(), lineno: 4, inApp: false },
      { filename: 'https://cdn.example.com/app.js', lineno: 4, inApp: true },
      { filename: 'node:internal/process', lineno: 4, inApp: true },
      { filename: join(directory, 'missing.js'), lineno: 4, inApp: true },
      { filename: writeSource(), lineno: 999, inApp: true },
    ];

    for (const frame of ContextLines.enrich(frames)) {
      expect(frame.contextLine).toBeUndefined();
    }
  });
});

describe('ExceptionPolicy', () => {
  it('reports server errors and unknown exceptions but not client errors', () => {
    expect(ExceptionPolicy.shouldReport(new Error('boom'))).toBe(true);
    expect(ExceptionPolicy.shouldReport({ getStatus: () => 500 })).toBe(true);
    expect(ExceptionPolicy.shouldReport({ status: 503 })).toBe(true);
    expect(ExceptionPolicy.shouldReport({ getStatus: () => 404 })).toBe(false);
    expect(ExceptionPolicy.shouldReport({ statusCode: 400 })).toBe(false);
    expect(ExceptionPolicy.shouldReport('string error')).toBe(true);
  });
});

describe('RequestContextBuilder', () => {
  it('keeps safe headers and drops credentials, cookies and query strings', () => {
    const context = RequestContextBuilder.from({
      originalUrl: '/api/orders?token=secret',
      method: 'POST',
      headers: {
        authorization: 'Bearer secret',
        cookie: 'session=secret',
        'user-agent': 'curl/8',
        'x-api-key': 'secret',
        'content-type': ['application/json'],
      },
    });

    expect(context).toEqual({
      url: '/api/orders',
      method: 'POST',
      headers: { 'user-agent': 'curl/8', 'content-type': 'application/json' },
    });
  });
});

describe('node SDK', () => {
  it('captures exceptions with runtime context and source lines from disk', () => {
    const path = writeSource();
    init({ dsn: DSN, transport, release: '1.0.0' });
    const error = new Error('cart failed');
    error.stack = `Error: cart failed\n    at checkout (${path}:4:7)`;

    captureException(error);

    const [event] = transport.events;
    expect(event.platform).toBe('node');
    expect(event.contexts.runtime).toMatchObject({ name: 'node' });
    expect(event.tags.server_name).toBeTruthy();
    expect(event.exception?.stacktrace.frames[0]).toMatchObject({
      function: 'checkout',
      lineno: 4,
      contextLine: 'const total = cart.items.length;',
    });
  });

  it('can skip context lines and still honors a user beforeSend', () => {
    init({
      dsn: DSN,
      transport,
      contextLines: false,
      beforeSend: (event) => ({ ...event, tags: { ...event.tags, scrubbed: '1' } }),
    });
    const error = new Error('x');
    error.stack = `Error: x\n    at fn (${writeSource()}:4:1)`;

    captureException(error);

    expect(transport.events[0].tags.scrubbed).toBe('1');
    expect(transport.events[0].exception?.stacktrace.frames[0].contextLine).toBeUndefined();
  });

  it('registers and removes process-level handlers', () => {
    const before = process.listenerCount('unhandledRejection');

    init({ dsn: DSN, transport });
    expect(process.listenerCount('unhandledRejection')).toBe(before + 1);

    close();
    expect(process.listenerCount('unhandledRejection')).toBe(before);
  });

  it('can be configured without process handlers', () => {
    const before = process.listenerCount('uncaughtException');

    init({ dsn: DSN, transport, captureUncaughtExceptions: false, captureUnhandledRejections: false });

    expect(process.listenerCount('uncaughtException')).toBe(before);
  });

  it('attaches sanitized request details', () => {
    init({ dsn: DSN, transport });

    captureRequestError(new Error('handler failed'), {
      originalUrl: '/api/pay?card=4242',
      method: 'POST',
      headers: { authorization: 'secret', 'user-agent': 'jest' },
    });

    expect(transport.events[0].request).toEqual({
      url: '/api/pay',
      method: 'POST',
      headers: { 'user-agent': 'jest' },
    });
  });

  it('does nothing before init', () => {
    expect(captureException(new Error('early'))).toBeUndefined();
    expect(captureMessage('early')).toBeUndefined();
  });
});

describe('expressErrorHandler', () => {
  it('reports server errors, skips client errors, and always forwards the error', () => {
    init({ dsn: DSN, transport });
    const handler = expressErrorHandler();
    const forwarded: unknown[] = [];
    const next = (error?: unknown) => forwarded.push(error);
    const request = { originalUrl: '/x', method: 'GET', headers: {} };

    const serverError = Object.assign(new Error('db down'), { status: 500 });
    const clientError = Object.assign(new Error('bad input'), { status: 400 });
    handler(serverError, request, {}, next);
    handler(clientError, request, {}, next);

    expect(transport.events).toHaveLength(1);
    expect(transport.events[0].tags.mechanism).toBe('express');
    expect(forwarded).toEqual([serverError, clientError]);
  });
});
