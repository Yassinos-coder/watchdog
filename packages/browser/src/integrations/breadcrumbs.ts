import { SafeFormat, type Breadcrumb, type Level } from '@watchdog-sdk/core';
import { Uninstall } from '../interfaces';
import { DomUtils } from '../utils/dom.utils';
import { UrlUtils } from '../utils/url.utils';

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
  const originals = new Map<string, (...args: unknown[]) => void>();

  for (const method of Object.keys(CONSOLE_LEVELS)) {
    const original = (console as unknown as Record<string, (...args: unknown[]) => void>)[method];
    originals.set(method, original);
    (console as unknown as Record<string, unknown>)[method] = (...args: unknown[]) => {
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
      (console as unknown as Record<string, unknown>)[method] = original;
    }
  };
}

export function installClickBreadcrumbs(add: AddBreadcrumb): Uninstall {
  const onClick = (event: MouseEvent): void => {
    add({ category: 'ui.click', type: 'user', message: DomUtils.describe(event.target) });
  };
  document.addEventListener('click', onClick, { capture: true, passive: true });
  return () => document.removeEventListener('click', onClick, { capture: true });
}

export function installNavigationBreadcrumbs(add: AddBreadcrumb): Uninstall {
  let previous = UrlUtils.pathOnly(location.href);
  const record = (): void => {
    const next = UrlUtils.pathOnly(location.href);
    if (next !== previous) {
      add({ category: 'navigation', type: 'navigation', data: { from: previous, to: next } });
      previous = next;
    }
  };

  const originalPush = history.pushState;
  const originalReplace = history.replaceState;
  history.pushState = function patchedPushState(...args) {
    const result = originalPush.apply(this, args);
    record();
    return result;
  };
  history.replaceState = function patchedReplaceState(...args) {
    const result = originalReplace.apply(this, args);
    record();
    return result;
  };
  window.addEventListener('popstate', record);

  return () => {
    history.pushState = originalPush;
    history.replaceState = originalReplace;
    window.removeEventListener('popstate', record);
  };
}

export function installNetworkBreadcrumbs(add: AddBreadcrumb, ignoredUrl: string): Uninstall {
  const originalFetch = globalThis.fetch;
  const originalOpen = XMLHttpRequest.prototype.open;

  if (originalFetch) {
    globalThis.fetch = async function patchedFetch(input, init) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = (init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase();
      try {
        const response = await originalFetch.call(globalThis, input, init);
        if (!url.startsWith(ignoredUrl)) {
          add(networkCrumb('fetch', method, url, response.status));
        }
        return response;
      } catch (error) {
        if (!url.startsWith(ignoredUrl)) {
          add({ ...networkCrumb('fetch', method, url, 0), level: 'error' });
        }
        throw error;
      }
    };
  }

  XMLHttpRequest.prototype.open = function patchedOpen(this: XMLHttpRequest, method: string, url: string | URL, ...rest: unknown[]) {
    const target = String(url);
    this.addEventListener('loadend', () => {
      if (!target.startsWith(ignoredUrl)) {
        add(networkCrumb('xhr', method.toUpperCase(), target, this.status));
      }
    });
    return (originalOpen as (...args: unknown[]) => void).call(this, method, url, ...rest);
  } as typeof XMLHttpRequest.prototype.open;

  return () => {
    globalThis.fetch = originalFetch;
    XMLHttpRequest.prototype.open = originalOpen;
  };
}

function networkCrumb(category: string, method: string, url: string, status: number): Breadcrumb {
  return {
    category,
    type: 'http',
    level: status >= 400 || status === 0 ? 'warning' : 'info',
    data: { method, url: UrlUtils.withoutQuery(url), status },
  };
}
