import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { WebhookSender } from '../src/webhooks/services/webhook-sender.service';
import { WebhookSignatureUtils } from '../src/webhooks/utils/webhook-signature.utils';
import { createTestApp } from './support/create-test-app';
import { OwnerSession, resetDatabase, signInOwner } from './support/test-helpers';

const URL_OK = 'https://93.184.216.34/hooks/watchdog';

interface Call {
  url: string;
  headers: Record<string, string>;
  body: string;
}

class RecordingSender {
  calls: Call[] = [];
  statuses: number[] = [];

  async post(url: string, headers: Record<string, string>, body: string): Promise<number> {
    this.calls.push({ url, headers, body });
    return this.statuses.shift() ?? 200;
  }
}

const waitFor = async (check: () => boolean, timeoutMs = 4_000): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('Condition not met in time');
};

describe('Webhooks (e2e)', () => {
  const sender = new RecordingSender();
  let app: INestApplication;
  let owner: OwnerSession;
  let project: { id: string; keys: { publicKey: string }[] };

  const create = (body: Record<string, unknown>) =>
    owner.agent.post('/api/integrations/webhooks').send({ name: 'Ops', url: URL_OK, events: ['issue.new'], ...body });

  beforeAll(async () => {
    app = await createTestApp((builder) => builder.overrideProvider(WebhookSender).useValue(sender));
    await resetDatabase(app);
    owner = await signInOwner(app);
    project = (await owner.agent.post('/api/projects').send({ name: 'Shop' }).expect(201)).body;
  });

  beforeEach(async () => {
    sender.calls = [];
    sender.statuses = [];
    const existing = await owner.agent.get('/api/integrations/webhooks').expect(200);
    for (const webhook of existing.body) {
      await owner.agent.delete(`/api/integrations/webhooks/${webhook.id}`).expect(204);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists the events you can subscribe to', async () => {
    const config = await owner.agent.get('/api/integrations/webhooks/config').expect(200);

    expect(config.body.events.map((event: { id: string }) => event.id)).toEqual([
      'issue.new',
      'issue.regression',
      'issue.spike',
      'metric.alert',
      'watchdog.restarting',
      'watchdog.online',
    ]);
  });

  it('shows the signing secret once and never lists it', async () => {
    const created = await create({}).expect(201);

    expect(created.body.secret).toMatch(/^whsec_/);
    const list = await owner.agent.get('/api/integrations/webhooks').expect(200);
    expect(JSON.stringify(list.body)).not.toContain(created.body.secret);
  });

  it('refuses unsafe or invalid destinations and bad events', async () => {
    await create({ url: 'http://93.184.216.34/hook' }).expect(400);
    await create({ url: 'https://127.0.0.1/hook' }).expect(400);
    await create({ url: 'https://10.0.0.5/hook' }).expect(400);
    await create({ url: 'https://user:pass@93.184.216.34/hook' }).expect(400);
    await create({ events: [] }).expect(400);
    await create({ events: ['everything'] }).expect(400);
    await request(app.getHttpServer()).get('/api/integrations/webhooks').expect(401);
  });

  it('sends a signed delivery when a subscribed event happens', async () => {
    const created = await create({ events: ['issue.new'] }).expect(201);

    await request(app.getHttpServer())
      .post(`/api/ingest/v1/${project.id}/events`)
      .set('x-watchdog-key', project.keys[0].publicKey)
      .send({ eventId: randomUUID(), release: '2.0.0', environment: 'production', exception: { type: 'Error', value: 'boom' } })
      .expect(202);
    await waitFor(() => sender.calls.length === 1);

    const call = sender.calls[0];
    const envelope = JSON.parse(call.body);
    expect(call.url).toBe(URL_OK);
    expect(call.headers['x-watchdog-event']).toBe('issue.new');
    expect(WebhookSignatureUtils.verify(created.body.secret, call.headers['x-watchdog-signature'], call.body)).toBe(true);
    expect(envelope).toMatchObject({ type: 'issue.new', data: { project: { name: 'Shop' }, issue: { title: 'Error: boom' }, release: '2.0.0' } });
  });

  it('stays quiet for events you did not choose and for disabled webhooks', async () => {
    const created = await create({ events: ['issue.regression'] }).expect(201);
    const ingest = () =>
      request(app.getHttpServer())
        .post(`/api/ingest/v1/${project.id}/events`)
        .set('x-watchdog-key', project.keys[0].publicKey)
        .send({ eventId: randomUUID(), exception: { type: 'RangeError', value: randomUUID() } })
        .expect(202);

    await ingest();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(sender.calls).toHaveLength(0);

    await owner.agent.patch(`/api/integrations/webhooks/${created.body.id}`).send({ events: ['issue.new'], enabled: false }).expect(200);
    await ingest();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(sender.calls).toHaveLength(0);
  });

  it('sends a test delivery and records it', async () => {
    const created = await create({}).expect(201);

    const test = await owner.agent.post(`/api/integrations/webhooks/${created.body.id}/test`).expect(200);
    const deliveries = await owner.agent.get(`/api/integrations/webhooks/${created.body.id}/deliveries`).expect(200);

    expect(test.body).toMatchObject({ event: 'webhook.test', status: 'SENT', responseCode: 200 });
    expect(JSON.parse(sender.calls[0].body).type).toBe('webhook.test');
    expect(deliveries.body[0]).toMatchObject({ event: 'webhook.test', status: 'SENT' });
  });

  it('retries a failing endpoint once and records the failure', async () => {
    const created = await create({}).expect(201);
    sender.statuses = [500, 503];

    const test = await owner.agent.post(`/api/integrations/webhooks/${created.body.id}/test`).expect(200);

    expect(sender.calls).toHaveLength(2);
    expect(test.body).toMatchObject({ status: 'FAILED', responseCode: 503 });
    expect(test.body.error).toContain('503');
  });

  it('does not retry a rejected request', async () => {
    const created = await create({}).expect(201);
    sender.statuses = [400];

    const test = await owner.agent.post(`/api/integrations/webhooks/${created.body.id}/test`).expect(200);

    expect(sender.calls).toHaveLength(1);
    expect(test.body.status).toBe('FAILED');
  });

  it('replaces the secret when asked', async () => {
    const created = await create({}).expect(201);
    const rotated = await owner.agent.post(`/api/integrations/webhooks/${created.body.id}/rotate-secret`).expect(200);
    await owner.agent.post(`/api/integrations/webhooks/${created.body.id}/test`).expect(200);

    const call = sender.calls[0];
    expect(rotated.body.secret).not.toBe(created.body.secret);
    expect(WebhookSignatureUtils.verify(rotated.body.secret, call.headers['x-watchdog-signature'], call.body)).toBe(true);
    expect(WebhookSignatureUtils.verify(created.body.secret, call.headers['x-watchdog-signature'], call.body)).toBe(false);
  });
});
