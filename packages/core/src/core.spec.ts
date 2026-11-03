import { afterEach, describe, expect, it, vi } from 'vitest';
import { WatchdogClient } from './client';
import { Transport, WatchdogEvent } from './interfaces';
import { FetchTransport } from './transport';
import { DsnParser } from './utils/dsn';
import { StackParser } from './utils/stack';

const PROJECT_ID = '3f2b8c1a-1111-4222-8333-444455556666';
const DSN = `https://abc123@watchdog.example.com/${PROJECT_ID}`;

class MemoryTransport implements Transport {
  events: WatchdogEvent[] = [];
  send(event: WatchdogEvent): void {
    this.events.push(event);
  }
  async flush(): Promise<boolean> {
    return true;
  }
}

const createClient = (overrides: Record<string, unknown> = {}) => {
  const transport = new MemoryTransport();
  const client = new WatchdogClient(
    { dsn: DSN, transport, release: '1.0.0', environment: 'test', ...overrides },
    { name: 'test', version: '0.0.0' },
  );
  return { client, transport };
};

describe('DsnParser', () => {
  it('extracts the key, project and ingest endpoint', () => {
    expect(DsnParser.parse(DSN)).toEqual({
      publicKey: 'abc123',
      projectId: PROJECT_ID,
      origin: 'https://watchdog.example.com',
      endpoint: `https://watchdog.example.com/api/ingest/v1/${PROJECT_ID}/events`,
    });
  });

  it('keeps ports for self-hosted setups', () => {
    expect(DsnParser.parse(`http://key@localhost:3000/${PROJECT_ID}`).endpoint).toBe(
      `http://localhost:3000/api/ingest/v1/${PROJECT_ID}/events`,
    );
  });

  it('rejects malformed DSNs', () => {
    expect(() => DsnParser.parse('not a url')).toThrow(TypeError);
    expect(() => DsnParser.parse(`https://watchdog.example.com/${PROJECT_ID}`)).toThrow(TypeError);
    expect(() => DsnParser.parse('https://key@watchdog.example.com/not-a-uuid')).toThrow(TypeError);
  });
});

describe('StackParser', () => {
  it('parses V8 stacks oldest frame first and flags vendor code', () => {
    const stack = [
      'TypeError: boom',
      '    at total (https://app.example.com/assets/index-abc.js:10:20)',
      '    at async main (file:///srv/app/dist/main.js:3:5)',
      '    at Object.<anonymous> (/srv/app/node_modules/lib/index.js:1:1)',
      '    at https://app.example.com/assets/index-abc.js:99:7',
    ].join('\n');

    const frames = StackParser.parse(stack);

    expect(frames).toHaveLength(4);
    expect(frames.at(-1)).toMatchObject({
      function: 'total',
      filename: 'https://app.example.com/assets/index-abc.js',
      lineno: 10,
      colno: 20,
      inApp: true,
    });
    expect(frames[0]).toMatchObject({ lineno: 99, function: undefined });
    expect(frames.find((frame) => frame.filename?.includes('node_modules'))?.inApp).toBe(false);
  });

  it('parses Firefox and Safari stacks', () => {
    const stack = ['total@https://app.example.com/main.js:10:20', '@https://app.example.com/main.js:99:7'].join('\n');

    const frames = StackParser.parse(stack);

    expect(frames.at(-1)).toMatchObject({ function: 'total', lineno: 10, colno: 20 });
  });

  it('returns nothing for missing stacks', () => {
    expect(StackParser.parse(undefined)).toEqual([]);
    expect(StackParser.parse('')).toEqual([]);
  });
});

describe('WatchdogClient', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('captures an exception with release, environment, tags and breadcrumbs', () => {
    const { client, transport } = createClient({ tags: { region: 'eu' } });
    client.addBreadcrumb({ category: 'ui.click', message: 'button#buy' });
    client.setUser({ id: 'u1' });

    client.captureException(new TypeError('x is undefined'), { tags: { feature: 'checkout' } });

    const [event] = transport.events;
    expect(event).toMatchObject({
      level: 'error',
      release: '1.0.0',
      environment: 'test',
      message: 'TypeError: x is undefined',
      user: { id: 'u1' },
      tags: { region: 'eu', feature: 'checkout' },
      sdk: { name: 'test', version: '0.0.0' },
    });
    expect(event.exception).toMatchObject({ type: 'TypeError', value: 'x is undefined', handled: true });
    expect(event.breadcrumbs[0]).toMatchObject({ category: 'ui.click' });
    expect(event.eventId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('handles thrown strings and objects', () => {
    const { client, transport } = createClient();

    client.captureException('plain string');
    client.captureException({ code: 42 });

    expect(transport.events[0].exception?.value).toBe('plain string');
    expect(transport.events[1].exception?.value).toBe('{"code":42}');
  });

  it('records error causes', () => {
    const { client, transport } = createClient();

    client.captureException(new Error('outer', { cause: new Error('inner') }));

    expect(transport.events[0].extra).toMatchObject({ causes: ['Error: inner'] });
  });

  it('captures plain messages with a level', () => {
    const { client, transport } = createClient();

    client.captureMessage('Payment retried', 'warning');

    expect(transport.events[0]).toMatchObject({ message: 'Payment retried', level: 'warning' });
    expect(transport.events[0].exception).toBeUndefined();
  });

  it('caps the number of breadcrumbs', () => {
    const { client, transport } = createClient({ maxBreadcrumbs: 3 });
    for (let index = 0; index < 10; index += 1) {
      client.addBreadcrumb({ message: `crumb ${index}` });
    }

    client.captureMessage('x');

    expect(transport.events[0].breadcrumbs.map((crumb) => crumb.message)).toEqual([
      'crumb 7',
      'crumb 8',
      'crumb 9',
    ]);
  });

  it('lets beforeSend modify or drop events', () => {
    const { client, transport } = createClient({
      beforeSend: (event: WatchdogEvent) => (event.message === 'drop me' ? null : { ...event, tags: { scrubbed: 'yes' } }),
    });

    client.captureMessage('drop me');
    client.captureMessage('keep me');

    expect(transport.events).toHaveLength(1);
    expect(transport.events[0].tags).toEqual({ scrubbed: 'yes' });
  });

  it('ignores errors matching ignoreErrors', () => {
    const { client, transport } = createClient({ ignoreErrors: ['ResizeObserver', /^Script error/] });

    client.captureException(new Error('ResizeObserver loop limit exceeded'));
    client.captureException(new Error('Script error.'));
    client.captureException(new Error('real problem'));

    expect(transport.events).toHaveLength(1);
  });

  it('drops identical errors fired in quick succession', () => {
    const { client, transport } = createClient();
    const error = new Error('render loop');

    client.captureException(error);
    client.captureException(error);
    client.captureException(error);

    expect(transport.events).toHaveLength(1);
  });

  it('applies a client-side rate limit', () => {
    const { client, transport } = createClient({ maxEventsPerMinute: 3 });

    for (let index = 0; index < 10; index += 1) {
      client.captureMessage(`message ${index}`);
    }

    expect(transport.events).toHaveLength(3);
  });

  it('respects sampleRate and the enabled flag', () => {
    const sampled = createClient({ sampleRate: 0 });
    const disabled = createClient({ enabled: false });

    sampled.client.captureMessage('x');
    disabled.client.captureMessage('x');

    expect(sampled.transport.events).toHaveLength(0);
    expect(disabled.transport.events).toHaveLength(0);
  });
});

describe('FetchTransport', () => {
  const dsn = DsnParser.parse(DSN);
  const event = { eventId: 'e1' } as WatchdogEvent;

  it('posts the event with the project key', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202, headers: new Headers() });
    const transport = new FetchTransport(dsn, fetchMock as unknown as typeof fetch, () => undefined);

    transport.send(event);
    await transport.flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(dsn.endpoint);
    expect(init.headers['x-watchdog-key']).toBe('abc123');
    expect(JSON.parse(init.body)).toEqual(event);
  });

  it('retries on server errors and then succeeds', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, headers: new Headers() })
      .mockResolvedValueOnce({ ok: true, status: 202, headers: new Headers() });
    const transport = new FetchTransport(dsn, fetchMock as unknown as typeof fetch, () => undefined);

    transport.send(event);
    const flushed = transport.flush(60_000);
    await vi.advanceTimersByTimeAsync(10_000);

    expect(await flushed).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('does not retry client errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401, headers: new Headers() });
    const transport = new FetchTransport(dsn, fetchMock as unknown as typeof fetch, () => undefined);

    transport.send(event);
    await transport.flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('survives network failures without throwing', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
    const debug = vi.fn();
    const transport = new FetchTransport(dsn, fetchMock as unknown as typeof fetch, debug);

    transport.send(event);
    const flushed = transport.flush(120_000);
    await vi.advanceTimersByTimeAsync(120_000);
    await flushed;

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(debug).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe('StackParser with Hermes frames', () => {
  it('drops the address prefix from the bundle name', () => {
    const frames = StackParser.parse(
      'Error: boom\n    at press (address at index.android.bundle:1:2345)\n    at anonymous (address at index.android.bundle:1:99)',
    );

    expect(frames[1].filename).toBe('index.android.bundle');
    expect(frames[1].function).toBe('press');
    expect(frames[1].lineno).toBe(1);
    expect(frames[1].colno).toBe(2345);
  });
});
