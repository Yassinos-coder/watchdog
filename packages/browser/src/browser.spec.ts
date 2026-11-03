import type { Transport, WatchdogEvent } from '@watchdog-sdk/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addBreadcrumb, captureException, captureMessage, close, init, setUser } from './browser-sdk';
import { DomUtils } from './utils/dom.utils';
import { UrlUtils } from './utils/url.utils';

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

let transport: MemoryTransport;

beforeEach(() => {
  transport = new MemoryTransport();
  init({ dsn: DSN, transport, release: '1.2.3', environment: 'test' });
});

afterEach(() => {
  close();
});

describe('manual capture', () => {
  it('attaches page, browser and release context', () => {
    captureException(new Error('manual'));

    const [event] = transport.events;
    expect(event.release).toBe('1.2.3');
    expect(event.request?.url).toContain('http');
    expect(event.request?.headers?.['user-agent']).toBeTruthy();
    expect(event.contexts.browser).toMatchObject({ viewport: expect.any(Object) });
    expect(event.sdk.name).toBe('watchdog.browser');
  });

  it('supports users, messages and breadcrumbs', () => {
    setUser({ id: 'u1' });
    addBreadcrumb({ category: 'custom', message: 'step 1' });

    captureMessage('hello', 'warning');

    expect(transport.events[0]).toMatchObject({ user: { id: 'u1' }, level: 'warning' });
    expect(transport.events[0].breadcrumbs.some((crumb) => crumb.message === 'step 1')).toBe(true);
  });

  it('does nothing before init and after close', () => {
    close();

    expect(captureException(new Error('late'))).toBeUndefined();
    expect(transport.events).toHaveLength(0);
  });
});

describe('global handlers', () => {
  it('reports uncaught errors as unhandled', () => {
    window.dispatchEvent(new ErrorEvent('error', { error: new TypeError('uncaught'), message: 'uncaught' }));

    expect(transport.events).toHaveLength(1);
    expect(transport.events[0].exception).toMatchObject({ type: 'TypeError', handled: false });
    expect(transport.events[0].tags.mechanism).toBe('window.onerror');
  });

  it('ignores cross-origin "Script error." noise', () => {
    window.dispatchEvent(new ErrorEvent('error', { message: 'Script error.' }));

    expect(transport.events).toHaveLength(0);
  });

  it('reports unhandled promise rejections', () => {
    const event = new Event('unhandledrejection') as Event & { reason: unknown };
    event.reason = new Error('rejected');

    window.dispatchEvent(event);

    expect(transport.events[0].exception?.value).toBe('rejected');
    expect(transport.events[0].tags.mechanism).toBe('unhandledrejection');
  });

  it('stops reporting after close', () => {
    close();
    const swallow = (event: ErrorEvent): void => event.preventDefault();
    window.addEventListener('error', swallow);

    window.dispatchEvent(new ErrorEvent('error', { error: new Error('after close'), cancelable: true }));
    window.removeEventListener('error', swallow);

    expect(transport.events).toHaveLength(0);
  });
});

describe('breadcrumbs', () => {
  it('records console output and still prints it', () => {
    console.warn('careful now');
    captureMessage('after console');

    expect(transport.events[0].breadcrumbs.find((crumb) => crumb.category === 'console')).toMatchObject({
      level: 'warning',
      message: 'careful now',
    });
  });

  it('records clicks by a privacy-safe selector', () => {
    document.body.innerHTML = '<main id="app"><button class="btn primary">Pay 42 EUR</button></main>';

    document.querySelector('button')!.click();
    captureMessage('after click');

    const crumb = transport.events[0].breadcrumbs.find((entry) => entry.category === 'ui.click');
    expect(crumb?.message).toBe('main#app > button.btn.primary');
    expect(crumb?.message).not.toContain('42');
  });

  it('records navigation between routes', () => {
    history.pushState({}, '', '/checkout');
    captureMessage('after navigation');

    const crumb = transport.events[0].breadcrumbs.find((entry) => entry.category === 'navigation');
    expect(crumb?.data).toMatchObject({ to: '/checkout' });
  });

  it('records fetch calls without query strings or bodies', async () => {
    const original = globalThis.fetch;
    close();
    globalThis.fetch = (async () => new Response('ok', { status: 500 })) as typeof fetch;
    init({ dsn: DSN, transport, integrations: { globalHandlers: false } });

    await fetch('https://api.example.com/orders?token=secret', { method: 'post', body: 'card=4242' });
    captureMessage('after fetch');
    close();
    globalThis.fetch = original;

    const crumb = transport.events.at(-1)!.breadcrumbs.find((entry) => entry.category === 'fetch');
    expect(crumb?.data).toEqual({ method: 'POST', url: 'https://api.example.com/orders', status: 500 });
    expect(crumb?.level).toBe('warning');
  });

  it('does not record calls to the Watchdog server itself', async () => {
    const original = globalThis.fetch;
    close();
    globalThis.fetch = (async () => new Response('', { status: 202 })) as typeof fetch;
    init({ dsn: DSN, transport });

    await fetch('https://watchdog.example.com/api/ingest/v1/x/events', { method: 'POST' });
    captureMessage('after ingest call');
    close();
    globalThis.fetch = original;

    expect(transport.events.at(-1)!.breadcrumbs.some((entry) => entry.category === 'fetch')).toBe(false);
  });
});

describe('DomUtils and UrlUtils', () => {
  it('describes elements and stops at the nearest id', () => {
    document.body.innerHTML = '<div id="root"><section><span class="a b c d"></span></section></div>';

    expect(DomUtils.describe(document.querySelector('span'))).toBe('div#root > section > span.a.b.c');
    expect(DomUtils.describe(null)).toBe('unknown');
  });

  it('strips queries from urls', () => {
    expect(UrlUtils.withoutQuery('https://a.com/x?y=1#z')).toBe('https://a.com/x');
    expect(UrlUtils.pathOnly('https://a.com/x/y?z=1')).toBe('/x/y');
  });
});
