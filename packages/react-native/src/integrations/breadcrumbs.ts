import { SafeFormat, type Breadcrumb, type Level } from '@watchdog-sdk/core';
import { AppState } from 'react-native';
import type { Uninstall } from '../interfaces';

type AddBreadcrumb = (breadcrumb: Breadcrumb) => void;

const CONSOLE_LEVELS: Record<string, Level> = {
  debug: 'debug',
  info: 'info',
  log: 'info',
  warn: 'warning',
  error: 'error',
};
const MAX_MESSAGE_LENGTH = 300;

export function installConsoleBreadcrumbs(add: AddBreadcrumb): Uninstall {
  const target = console as unknown as Record<string, (...args: unknown[]) => void>;
  const originals = new Map<string, (...args: unknown[]) => void>();

  for (const method of Object.keys(CONSOLE_LEVELS)) {
    const original = target[method];
    originals.set(method, original);
    target[method] = (...args: unknown[]) => {
      add({
        category: 'console',
        level: CONSOLE_LEVELS[method],
        message: args.map((argument) => SafeFormat.describe(argument)).join(' ').slice(0, MAX_MESSAGE_LENGTH),
      });
      original.apply(console, args);
    };
  }

  return () => {
    for (const [method, original] of originals) {
      target[method] = original;
    }
  };
}

export function installNetworkBreadcrumbs(add: AddBreadcrumb, ignoredOrigin: string): Uninstall {
  const original = globalThis.fetch;
  if (typeof original !== 'function') {
    return () => undefined;
  }

  const patched: typeof fetch = async (input, init) => {
    const url = describeUrl(input);
    const method = (init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase();
    const tracked = !url.startsWith(ignoredOrigin);
    try {
      const response = await original(input, init);
      if (tracked) {
        add({
          category: 'fetch',
          type: 'http',
          level: response.ok ? 'info' : 'warning',
          message: `${method} ${stripQuery(url)}`,
          data: { status: response.status },
        });
      }
      return response;
    } catch (error) {
      if (tracked) {
        add({ category: 'fetch', type: 'http', level: 'error', message: `${method} ${stripQuery(url)}` });
      }
      throw error;
    }
  };
  globalThis.fetch = patched;

  return () => {
    if (globalThis.fetch === patched) {
      globalThis.fetch = original;
    }
  };
}

export function installAppStateBreadcrumbs(add: AddBreadcrumb): Uninstall {
  const subscription = AppState.addEventListener('change', (state) => {
    add({ category: 'app.lifecycle', type: 'navigation', message: `App ${state}` });
  });
  return () => subscription.remove();
}

function describeUrl(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function stripQuery(url: string): string {
  const index = url.indexOf('?');
  return index === -1 ? url : url.slice(0, index);
}
