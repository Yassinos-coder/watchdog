import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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
    expect(list.body[0].widgets).toHaveLength(1);

    await owner.agent.delete(`/api/widgets/${widget.body.id}`).expect(204);
    await owner.agent.delete(`/api/dashboards/${dashboard.body.id}`).expect(204);
  });
});
