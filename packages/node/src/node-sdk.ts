import { hostname, platform, arch } from 'node:os';
import {
  Breadcrumb,
  CaptureContext,
  Level,
  UserContext,
  MetricOptions,
  Transaction,
  TransactionOptions,
  WatchdogClient,
  WatchdogEvent,
} from '@watchdog-sdk/core';
import { ContextLines } from './context-lines';
import { HttpRequestLike, NodeOptions, Uninstall } from './interfaces';
import { RequestContextBuilder } from './request-context';

const SDK = { name: 'watchdog.node', version: '0.6.0' };
const DEFAULT_FLUSH_TIMEOUT_MS = 2_000;
const EXIT_CODE_UNCAUGHT = 1;

let client: WatchdogClient | null = null;
let uninstallers: Uninstall[] = [];

export function init(options: NodeOptions): WatchdogClient {
  close();
  const {
    captureUncaughtExceptions = true,
    captureUnhandledRejections = true,
    onUnhandledRejection = 'warn',
    contextLines = true,
    flushTimeoutMs = DEFAULT_FLUSH_TIMEOUT_MS,
    ...coreOptions
  } = options;

  const created = new WatchdogClient(
    {
      ...coreOptions,
      platform: 'node',
      beforeSend: (event) => {
        const enriched = contextLines ? withContextLines(event) : event;
        return coreOptions.beforeSend ? coreOptions.beforeSend(enriched) : enriched;
      },
    },
    SDK,
  );
  created.setContext('runtime', { name: 'node', version: process.version });
  created.setContext('os', { platform: platform(), arch: arch() });
  created.setTag('server_name', hostname());
  client = created;

  if (captureUncaughtExceptions) {
    uninstallers.push(installUncaughtException(created, flushTimeoutMs));
  }
  if (captureUnhandledRejections) {
    uninstallers.push(installUnhandledRejection(created, onUnhandledRejection, flushTimeoutMs));
  }
  return created;
}

export function close(): void {
  for (const uninstall of uninstallers) {
    uninstall();
  }
  uninstallers = [];
  client = null;
}

export function getClient(): WatchdogClient | null {
  return client;
}

export function captureException(error: unknown, context?: CaptureContext): string | undefined {
  return client?.captureException(error, context);
}

export function captureMessage(message: string, level?: Level, context?: CaptureContext): string | undefined {
  return client?.captureMessage(message, level, context);
}

export function captureRequestError(error: unknown, request: HttpRequestLike, context?: CaptureContext): string | undefined {
  return client?.captureException(error, { ...context, request: RequestContextBuilder.from(request) });
}

export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  client?.addBreadcrumb(breadcrumb);
}

export function setUser(user: UserContext | undefined): void {
  client?.setUser(user);
}

export function setTag(key: string, value: string): void {
  client?.setTag(key, value);
}

export function setExtra(key: string, value: unknown): void {
  client?.setExtra(key, value);
}

export function setContext(key: string, value: unknown): void {
  client?.setContext(key, value);
}

export function startTransaction(options: TransactionOptions): Transaction | undefined {
  return client?.startTransaction(options);
}

export function increment(name: string, value?: number, options?: MetricOptions): void {
  client?.increment(name, value, options);
}

export function gauge(name: string, value: number, options?: MetricOptions): void {
  client?.gauge(name, value, options);
}

export function distribution(name: string, value: number, options?: MetricOptions): void {
  client?.distribution(name, value, options);
}

export function flush(timeoutMs?: number): Promise<boolean> {
  return client ? client.flush(timeoutMs) : Promise.resolve(true);
}

function withContextLines(event: WatchdogEvent): WatchdogEvent {
  if (!event.exception) {
    return event;
  }
  return {
    ...event,
    exception: {
      ...event.exception,
      stacktrace: { frames: ContextLines.enrich(event.exception.stacktrace.frames) },
    },
  };
}

function installUncaughtException(target: WatchdogClient, flushTimeoutMs: number): Uninstall {
  const handler = (error: Error): void => {
    target.captureException(error, { handled: false, level: 'fatal', tags: { mechanism: 'uncaughtException' } });
    void target.flush(flushTimeoutMs).finally(() => {
      if (process.listenerCount('uncaughtException') <= 1) {
        process.exit(EXIT_CODE_UNCAUGHT);
      }
    });
  };
  process.on('uncaughtException', handler);
  return () => process.off('uncaughtException', handler);
}

function installUnhandledRejection(
  target: WatchdogClient,
  mode: 'warn' | 'exit',
  flushTimeoutMs: number,
): Uninstall {
  const handler = (reason: unknown): void => {
    target.captureException(reason, { handled: false, tags: { mechanism: 'unhandledRejection' } });
    if (mode === 'exit') {
      void target.flush(flushTimeoutMs).finally(() => process.exit(EXIT_CODE_UNCAUGHT));
      return;
    }
    console.warn('[watchdog] unhandled promise rejection:', reason);
  };
  process.on('unhandledRejection', handler);
  return () => process.off('unhandledRejection', handler);
}
