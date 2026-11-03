import { describe, expect, it } from 'vitest';
import { WatchdogClient } from './client';
import { Transport, TransportKind, WatchdogEvent } from './interfaces';

const DSN = 'https://abc123@watchdog.example.com/3f2b8c1a-1111-4222-8333-444455556666';

class RecordingTransport implements Transport {
  sent: { kind: TransportKind; payload: any }[] = [];
  send(_event: WatchdogEvent): void {}
  sendTo(kind: TransportKind, payload: unknown): void {
    this.sent.push({ kind, payload });
  }
  async flush(): Promise<boolean> {
    return true;
  }
}

const createClient = (overrides: Record<string, unknown> = {}) => {
  const transport = new RecordingTransport();
  const client = new WatchdogClient(
    { dsn: DSN, transport, release: '1.0.0', environment: 'test', ...overrides },
    { name: 'test', version: '0.0.0' },
  );
  return { client, transport };
};

describe('transactions', () => {
  it('sends a transaction with its finished spans', async () => {
    const { client, transport } = createClient();
    const transaction = client.startTransaction({ name: 'GET /orders', op: 'http.server' });

    await transaction.trace('db', 'SELECT orders', async () => 'rows');
    const failing = transaction.startSpan('cache', 'get');
    failing.finish('internal_error');
    transaction.finish();

    const [sent] = transport.sent;
    expect(sent.kind).toBe('transactions');
    expect(sent.payload).toMatchObject({ name: 'GET /orders', op: 'http.server', release: '1.0.0', environment: 'test' });
    expect(sent.payload.spans.map((span: { op: string }) => span.op)).toEqual(['db', 'cache']);
    expect(sent.payload.spans[1].status).toBe('internal_error');
  });

  it('marks a span failed when the traced work throws', async () => {
    const { client, transport } = createClient();
    const transaction = client.startTransaction({ name: 'job' });

    await expect(
      transaction.trace('task', undefined, () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    transaction.finish('internal_error');

    expect(transport.sent[0].payload.spans[0].status).toBe('internal_error');
    expect(transport.sent[0].payload.status).toBe('internal_error');
  });

  it('finishes only once', () => {
    const { client, transport } = createClient();
    const transaction = client.startTransaction({ name: 'job' });

    transaction.finish();
    transaction.finish();

    expect(transport.sent).toHaveLength(1);
  });

  it('respects tracesSampleRate', () => {
    const { client, transport } = createClient({ tracesSampleRate: 0 });

    client.startTransaction({ name: 'job' }).finish();

    expect(transport.sent).toHaveLength(0);
  });
});

describe('metrics', () => {
  it('batches metrics until flushed', async () => {
    const { client, transport } = createClient({ tags: { region: 'eu' } });

    client.increment('orders.created');
    client.gauge('queue.depth', 12, { unit: 'jobs' });
    client.distribution('cart.value', 49.9, { tags: { currency: 'eur' } });
    expect(transport.sent).toHaveLength(0);

    await client.flush();

    const metrics = transport.sent[0].payload.metrics;
    expect(transport.sent[0].kind).toBe('metrics');
    expect(metrics.map((metric: { name: string; type: string }) => [metric.name, metric.type])).toEqual([
      ['orders.created', 'counter'],
      ['queue.depth', 'gauge'],
      ['cart.value', 'distribution'],
    ]);
    expect(metrics[2].tags).toEqual({ region: 'eu', currency: 'eur' });
  });

  it('ignores non-finite values and disabled clients', async () => {
    const { client, transport } = createClient();
    client.gauge('bad', Number.NaN);
    await client.flush();

    const disabled = createClient({ enabled: false });
    disabled.client.increment('x');
    await disabled.client.flush();

    expect(transport.sent).toHaveLength(0);
    expect(disabled.transport.sent).toHaveLength(0);
  });
});
