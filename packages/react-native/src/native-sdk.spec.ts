import type { Transport, WatchdogEvent } from '@watchdog-sdk/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emitAppState } from '../test/react-native.stub';
import { addBreadcrumb, captureException, close, init, navigationBreadcrumbs } from './native-sdk';

type Handler = (error: unknown, isFatal?: boolean) => void;

const DSN = 'https://key123@watchdog.test/11111111-1111-4111-8111-111111111111';

function createTransport() {
  const sent: WatchdogEvent[] = [];
  const transport: Transport = {
    send: (event) => void sent.push(event),
    flush: () => Promise.resolve(true),
  };
  return { sent, transport };
}

describe('React Native SDK', () => {
  let handler: Handler;
  let previous: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    previous = vi.fn();
    handler = previous as unknown as Handler;
    (globalThis as Record<string, unknown>).ErrorUtils = {
      getGlobalHandler: () => handler,
      setGlobalHandler: (next: Handler) => {
        handler = next;
      },
    };
  });

  afterEach(() => {
    close();
    delete (globalThis as Record<string, unknown>).ErrorUtils;
    delete (globalThis as Record<string, unknown>).HermesInternal;
  });

  it('reports fatal JS errors, then hands them to the original handler', async () => {
    const { sent, transport } = createTransport();
    init({ dsn: DSN, transport });

    handler(new Error('boom'), true);
    await vi.waitFor(() => expect(previous).toHaveBeenCalledTimes(1));

    expect(sent).toHaveLength(1);
    expect(sent[0].level).toBe('fatal');
    expect(sent[0].platform).toBe('react-native');
    expect(sent[0].tags.mechanism).toBe('ErrorUtils');
    expect(sent[0].contexts.os).toEqual({ name: 'android', version: '34' });
  });

  it('hands non-fatal errors on immediately', () => {
    const { sent, transport } = createTransport();
    init({ dsn: DSN, transport });

    handler(new Error('soft'), false);

    expect(previous).toHaveBeenCalledTimes(1);
    expect(sent[0].level).toBe('error');
  });

  it('restores the original handler on close', () => {
    const { transport } = createTransport();
    init({ dsn: DSN, transport });
    close();

    expect(handler).toBe(previous);
  });

  it('captures unhandled promise rejections on Hermes', () => {
    let onUnhandled: ((id: number, rejection: unknown) => void) | undefined;
    (globalThis as Record<string, unknown>).HermesInternal = {
      hasPromise: () => true,
      enablePromiseRejectionTracker: (options: { onUnhandled: typeof onUnhandled }) => {
        onUnhandled = options.onUnhandled;
      },
    };
    const { sent, transport } = createTransport();
    init({ dsn: DSN, transport });

    onUnhandled?.(1, new Error('rejected'));

    expect(sent[0].tags.mechanism).toBe('unhandledrejection');
    expect(sent[0].contexts.runtime).toEqual({ name: 'hermes' });
  });

  it('records app lifecycle and navigation breadcrumbs', () => {
    const { sent, transport } = createTransport();
    init({ dsn: DSN, transport, integrations: { console: false } });
    emitAppState('background');
    let route = 'Home';
    const onStateChange = navigationBreadcrumbs({ getCurrentRoute: () => ({ name: route }) });
    route = 'Profile';
    onStateChange();
    addBreadcrumb({ message: 'tapped buy' });

    captureException(new Error('after'));

    const messages = sent[0].breadcrumbs.map((crumb) => crumb.message);
    expect(messages).toEqual(['App background', 'Home -> Profile', 'tapped buy']);
  });

  it('does nothing before init', () => {
    expect(captureException(new Error('early'))).toBeUndefined();
  });
});
