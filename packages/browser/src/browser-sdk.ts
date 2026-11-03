import {
  Breadcrumb,
  CaptureContext,
  DsnParser,
  Level,
  UserContext,
  WatchdogClient,
} from '@watchdog-sdk/core';
import { installClickBreadcrumbs, installConsoleBreadcrumbs, installNavigationBreadcrumbs, installNetworkBreadcrumbs } from './integrations/breadcrumbs';
import { installGlobalHandlers } from './integrations/global-handlers';
import { BrowserOptions, Uninstall } from './interfaces';

const SDK = { name: 'watchdog.browser', version: '0.4.2' };
const DEFAULT_IGNORED_ERRORS: (string | RegExp)[] = [
  /^Script error\.?$/,
  'ResizeObserver loop',
  'Non-Error promise rejection captured',
];

let client: WatchdogClient | null = null;
let uninstallers: Uninstall[] = [];

export function init(options: BrowserOptions): WatchdogClient {
  close();
  const dsn = DsnParser.parse(options.dsn);
  const { integrations = {}, ...coreOptions } = options;

  const created = new WatchdogClient(
    {
      ...coreOptions,
      ignoreErrors: [...DEFAULT_IGNORED_ERRORS, ...(options.ignoreErrors ?? [])],
    },
    SDK,
  );
  client = created;

  const capture = (error: unknown, context?: CaptureContext): void => {
    created.captureException(error, withPageContext(context));
  };
  const add = (breadcrumb: Breadcrumb): void => created.addBreadcrumb(breadcrumb);

  if (integrations.globalHandlers !== false) uninstallers.push(installGlobalHandlers(capture));
  if (integrations.console !== false) uninstallers.push(installConsoleBreadcrumbs(add));
  if (integrations.clicks !== false) uninstallers.push(installClickBreadcrumbs(add));
  if (integrations.navigation !== false) uninstallers.push(installNavigationBreadcrumbs(add));
  if (integrations.network !== false) uninstallers.push(installNetworkBreadcrumbs(add, dsn.origin));

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
  return client?.captureException(error, withPageContext(context));
}

export function captureMessage(message: string, level?: Level, context?: CaptureContext): string | undefined {
  return client?.captureMessage(message, level, withPageContext(context));
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

export function flush(timeoutMs?: number): Promise<boolean> {
  return client ? client.flush(timeoutMs) : Promise.resolve(true);
}

function withPageContext(context: CaptureContext = {}): CaptureContext {
  return {
    ...context,
    request: {
      url: location.href.split('#')[0],
      headers: { 'user-agent': navigator.userAgent, ...(document.referrer ? { referer: document.referrer } : {}) },
      ...context.request,
    },
    contexts: {
      browser: {
        language: navigator.language,
        online: navigator.onLine,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      },
      ...context.contexts,
    },
  };
}
