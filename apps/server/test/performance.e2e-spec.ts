import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MetricRollupService } from '../src/performance/services/metric-rollup.service';
import { createTestApp } from './support/create-test-app';
import { OwnerSession, resetDatabase, signInOwner } from './support/test-helpers';

describe('Performance tracing and metrics (e2e)', () => {
  let app: INestApplication;
  let owner: OwnerSession;
  let projectId: string;
  let publicKey: string;

  const post = (path: string, body: unknown, key: string | null = publicKey) => {
    const call = request(app.getHttpServer()).post(`/api/ingest/v1/${projectId}/${path}`);
    return (key ? call.set('x-watchdog-key', key) : call).send(body as object);
  };

  const transaction = (overrides: Record<string, unknown> = {}) => ({
    eventId: randomUUID(),
    name: 'GET /api/orders',
    op: 'http.server',
    durationMs: 120,
    spans: [
      { op: 'db', description: 'SELECT orders', startOffsetMs: 5, durationMs: 80 },
      { op: 'serialize', startOffsetMs: 90, durationMs: 20 },
    ],
    ...overrides,
  });

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    owner = await signInOwner(app);
    const created = await owner.agent.post('/api/projects').send({ name: 'Shop' }).expect(201);
    projectId = created.body.id;
    publicKey = created.body.keys[0].publicKey;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects transactions without a valid key', async () => {
    await post('transactions', transaction(), null).expect(401);
    await post('transactions', transaction(), 'wdk_wrong').expect(401);
  });

  it('stores transactions and deduplicates by event id', async () => {
    const payload = transaction({ durationMs: 100 });
    await post('transactions', payload).expect(202);
    await post('transactions', payload).expect(202);
    await post('transactions', transaction({ durationMs: 300, status: 'internal_error' })).expect(202);

    const list = await owner.agent.get(`/api/projects/${projectId}/transactions`).expect(200);

    expect(list.body.total).toBe(2);
  });

  it('summarizes transactions with percentiles and failure rate', async () => {
    const summary = await owner.agent
      .get(`/api/projects/${projectId}/transactions/summary?range=24h`)
      .expect(200);

    expect(summary.body).toHaveLength(1);
    expect(summary.body[0]).toMatchObject({ name: 'GET /api/orders', count: 2, maxMs: 300 });
    expect(summary.body[0].failureRate).toBeCloseTo(0.5);
    expect(summary.body[0].avgMs).toBeCloseTo(200);
  });

  it('returns a transaction with its spans', async () => {
    const list = await owner.agent.get(`/api/projects/${projectId}/transactions`).expect(200);
    const detail = await owner.agent.get(`/api/transactions/${list.body.items[0].id}`).expect(200);

    expect(detail.body.spans.length).toBeGreaterThan(0);
  });

  it('accepts metric batches and drops invalid entries', async () => {
    const response = await post('metrics', {
      metrics: [
        { name: 'cart.value', type: 'distribution', value: 40, unit: 'usd' },
        { name: 'cart.value', type: 'distribution', value: 60, unit: 'usd' },
        { name: 'queue.depth', type: 'gauge', value: 7 },
        { name: 'not valid', value: 1 },
      ],
    }).expect(202);

    expect(response.body.accepted).toBe(3);
    const names = await owner.agent.get(`/api/projects/${projectId}/metrics`).expect(200);
    expect(names.body.map((entry: { name: string }) => entry.name)).toEqual(['cart.value', 'queue.depth']);
  });

  it('aggregates a metric series', async () => {
    const series = await owner.agent
      .get(`/api/projects/${projectId}/series?source=METRIC&name=cart.value&aggregation=AVG&range=1h`)
      .expect(200);

    expect(series.body.total).toBeCloseTo(50);
    expect(series.body.points.length).toBeGreaterThan(0);
    expect(series.body.bucketMs).toBe(60_000);
  });

  it('rejects an unknown aggregation', async () => {
    await owner.agent
      .get(`/api/projects/${projectId}/series?source=METRIC&name=x&aggregation=MEDIAN`)
      .expect(400);
  });

  describe('tags, rates and rollups', () => {
    const seriesUrl = (query: string) => `/api/projects/${projectId}/series?${query}`;
    const totalsOf = (groups: { key: string; total: number }[]) =>
      Object.fromEntries(groups.map((group) => [group.key, group.total]));

    beforeAll(async () => {
      await post('metrics', {
        metrics: [
          { name: 'calls.started', type: 'counter', value: 1, tags: { tier: 'pro', lang: 'en' } },
          { name: 'calls.started', type: 'counter', value: 1, tags: { tier: 'pro', lang: 'fr' } },
          { name: 'calls.started', type: 'counter', value: 1, tags: { tier: 'free', lang: 'en' } },
          { name: 'calls.started', type: 'counter', value: 3, tags: { tier: 'pro', lang: 'en' } },
          { name: 'voice.latency', type: 'distribution', value: 100, tags: { tier: 'pro' } },
          { name: 'voice.latency', type: 'distribution', value: 300, tags: { tier: 'pro' } },
        ],
      }).expect(202);
    });

    it('groups a series by tag with totals per group', async () => {
      const series = await owner.agent
        .get(seriesUrl('source=METRIC&name=calls.started&aggregation=SUM&range=1h&groupBy=tier'))
        .expect(200);

      expect(totalsOf(series.body.groups)).toEqual({ pro: 5, free: 1 });
      expect(series.body.groups[0].key).toBe('pro');
      expect(series.body.groups[0].points.length).toBeGreaterThan(0);
    });

    it('filters by tag', async () => {
      const series = await owner.agent
        .get(seriesUrl('source=METRIC&name=calls.started&aggregation=COUNT&range=1h&tagKey=lang&tagValue=fr'))
        .expect(200);

      expect(series.body.total).toBe(1);
    });

    it('rejects a tag key without a value', async () => {
      await owner.agent
        .get(seriesUrl('source=METRIC&name=calls.started&aggregation=COUNT&range=1h&tagKey=lang'))
        .expect(400);
    });

    it('computes a rate per second', async () => {
      const series = await owner.agent
        .get(seriesUrl('source=METRIC&name=calls.started&aggregation=RATE&range=1h'))
        .expect(200);

      expect(series.body.total).toBeCloseTo(6 / 3600, 6);
    });

    it('lists tag keys with sample values', async () => {
      const keys = await owner.agent
        .get(`/api/projects/${projectId}/tag-keys?source=METRIC&name=calls.started`)
        .expect(200);

      expect(keys.body).toEqual([
        { key: 'lang', values: ['en', 'fr'] },
        { key: 'tier', values: ['free', 'pro'] },
      ]);
    });

    it('rolls metrics up hourly and serves long ranges from the rollups', async () => {
      expect(await app.get(MetricRollupService).run()).toBeGreaterThan(0);
      await app.get(MetricRollupService).run();

      const sum = await owner.agent.get(seriesUrl('source=METRIC&name=calls.started&aggregation=SUM&range=7d')).expect(200);
      const count = await owner.agent.get(seriesUrl('source=METRIC&name=calls.started&aggregation=COUNT&range=30d')).expect(200);
      const latency = await owner.agent.get(seriesUrl('source=METRIC&name=voice.latency&aggregation=AVG&range=90d')).expect(200);
      const grouped = await owner.agent
        .get(seriesUrl('source=METRIC&name=calls.started&aggregation=SUM&range=7d&groupBy=lang'))
        .expect(200);

      expect(sum.body.total).toBe(6);
      expect(count.body.total).toBe(4);
      expect(latency.body.total).toBeCloseTo(200);
      expect(totalsOf(grouped.body.groups)).toEqual({ en: 5, fr: 1 });
    });

    it('creates grouped table widgets and rejects a half tag filter', async () => {
      const dashboard = await owner.agent.post(`/api/projects/${projectId}/dashboards`).send({ name: 'Calls' }).expect(201);
      const widget = await owner.agent
        .post(`/api/dashboards/${dashboard.body.id}/widgets`)
        .send({ title: 'By tier', source: 'METRIC', metricName: 'calls.started', aggregation: 'RATE', display: 'TABLE', groupBy: 'tier', tagKey: 'lang', tagValue: 'en' })
        .expect(201);

      expect(widget.body).toMatchObject({ display: 'TABLE', aggregation: 'RATE', groupBy: 'tier', tagKey: 'lang', tagValue: 'en' });
      await owner.agent
        .post(`/api/dashboards/${dashboard.body.id}/widgets`)
        .send({ title: 'Half', source: 'METRIC', metricName: 'calls.started', aggregation: 'SUM', display: 'LINE', tagKey: 'lang' })
        .expect(400);
      await owner.agent.delete(`/api/dashboards/${dashboard.body.id}`).expect(204);
    });
  });

  describe('default dashboard and error series', () => {
    let freshProjectId: string;

    beforeAll(async () => {
      const created = await owner.agent.post('/api/projects').send({ name: 'Fresh app' }).expect(201);
      freshProjectId = created.body.id;
    });

    it('gives every project an Overview dashboard once, even after it is deleted', async () => {
      const first = await owner.agent.get(`/api/projects/${freshProjectId}/dashboards`).expect(200);

      expect(first.body).toHaveLength(1);
      expect(first.body[0].name).toBe('Overview');
      expect(first.body[0].widgets.map((widget: { title: string }) => widget.title)).toEqual([
        'Errors',
        'Requests',
        'Response time (p95)',
        'Average response time',
      ]);

      await owner.agent.delete(`/api/dashboards/${first.body[0].id}`).expect(204);
      const second = await owner.agent.get(`/api/projects/${freshProjectId}/dashboards`).expect(200);
      expect(second.body).toHaveLength(0);
    });

    it('charts the number of errors and rejects what errors cannot do', async () => {
      await request(app.getHttpServer())
        .post(`/api/ingest/v1/${projectId}/events`)
        .set('x-watchdog-key', publicKey)
        .send({ eventId: randomUUID(), exception: { type: 'Error', value: 'boom' } })
        .expect(202);

      const series = await owner.agent
        .get(`/api/projects/${projectId}/series?source=ERRORS&aggregation=COUNT&range=1h`)
        .expect(200);
      expect(series.body.total).toBe(1);
      expect(series.body.points.length).toBeGreaterThan(0);

      await owner.agent.get(`/api/projects/${projectId}/series?source=ERRORS&aggregation=P95&range=1h`).expect(400);
      await owner.agent
        .get(`/api/projects/${projectId}/series?source=ERRORS&aggregation=COUNT&range=1h&groupBy=tier`)
        .expect(400);

      const tagKeys = await owner.agent.get(`/api/projects/${projectId}/tag-keys?source=ERRORS`).expect(200);
      expect(tagKeys.body).toEqual([]);
    });
  });

  it('manages dashboards and widgets', async () => {
    const dashboard = await owner.agent
      .post(`/api/projects/${projectId}/dashboards`)
      .send({ name: 'Checkout health' })
      .expect(201);
    const widget = await owner.agent
      .post(`/api/dashboards/${dashboard.body.id}/widgets`)
      .send({ title: 'Cart value', source: 'METRIC', metricName: 'cart.value', aggregation: 'AVG', display: 'LINE' })
      .expect(201);

    await owner.agent
      .post(`/api/dashboards/${dashboard.body.id}/widgets`)
      .send({ title: 'Broken', source: 'METRIC', aggregation: 'AVG', display: 'LINE' })
      .expect(400);

    const list = await owner.agent.get(`/api/projects/${projectId}/dashboards`).expect(200);
    const checkout = list.body.find((entry: { name: string }) => entry.name === 'Checkout health');
    expect(checkout.widgets).toHaveLength(1);

    await owner.agent.delete(`/api/widgets/${widget.body.id}`).expect(204);
    await owner.agent.delete(`/api/dashboards/${dashboard.body.id}`).expect(204);
  });
});
