import {
  Breadcrumb,
  CaptureContext,
  DsnParser,
  Level,
  MetricOptions,
  Transaction,
  TransactionOptions,
  UserContext,
  WatchdogClient,
} from '@watchdog-sdk/core';
import { Platform } from 'react-native';
import {
  installAppStateBreadcrumbs,
  installConsoleBreadcrumbs,
  installNetworkBreadcrumbs,
} from './integrations/breadcrumbs';
import { installGlobalHandler, installUnhandledRejections } from './integrations/global-handlers';
import type { NativeOptions, NavigationRefLike, Uninstall } from './interfaces';

const SDK = { name: 'watchdog.react-native', version: '0.5.0' };
const DEFAULT_FLUSH_TIMEOUT_MS = 2_000;

let client: WatchdogClient | null = null;
let uninstallers: Uninstall[] = [];

export function init(options: NativeOptions): WatchdogClient {
  close();
  const dsn = DsnParser.parse(options.dsn);
  const { integrations = {}, flushTimeoutMs = DEFAULT_FLUSH_TIMEOUT_MS, ...coreOptions } = options;

  const created = new WatchdogClient({ ...coreOptions, platform: 'react-native' }, SDK);
  created.setContext('os', { name: Platform.OS, version: String(Platform.Version) });
  created.setContext('runtime', { name: isHermes() ? 'hermes' : 'jsc' });
  created.setTag('os', Platform.OS);
  client = created;

  const capture = (error: unknown, context?: CaptureContext): void => {
    created.captureException(error, context);
  };
  const add = (breadcrumb: Breadcrumb): void => created.addBreadcrumb(breadcrumb);

  if (integrations.globalHandlers !== false) {
    uninstallers.push(installGlobalHandler(capture, (timeout) => created.flush(timeout), flushTimeoutMs));
  }
  if (integrations.unhandledRejections !== false) uninstallers.push(installUnhandledRejections(capture));
  if (integrations.console !== false) uninstallers.push(installConsoleBreadcrumbs(add));
  if (integrations.network !== false) uninstallers.push(installNetworkBreadcrumbs(add, dsn.origin));
  if (integrations.appState !== false) uninstallers.push(installAppStateBreadcrumbs(add));

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

export function navigationBreadcrumbs(ref: NavigationRefLike): () => void {
  let previous = ref.getCurrentRoute()?.name;
  return () => {
    const current = ref.getCurrentRoute()?.name;
    if (!current || current === previous) return;
    addBreadcrumb({
      category: 'navigation',
      type: 'navigation',
      message: previous ? `${previous} -> ${current}` : current,
      data: { from: previous, to: current },
    });
    previous = current;
  };
}

function isHermes(): boolean {
  return typeof (globalThis as { HermesInternal?: unknown }).HermesInternal !== 'undefined';
}
