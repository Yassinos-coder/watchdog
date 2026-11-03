import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HttpPoster } from '../src/alerts/services/http-poster.service';
import { createTestApp } from './support/create-test-app';
import { OwnerSession, resetDatabase, signInOwner } from './support/test-helpers';

const SLACK_URL = 'https://hooks.slack.com/services/T0000/B0000/abcdefghijklmnopqrstuvwx';
const DISCORD_URL = 'https://discord.com/api/webhooks/123456789/abcdefghijklmnop';

class RecordingPoster {
  calls: { url: string; body: Record<string, unknown> }[] = [];
  failWith: string | null = null;

  async postJson(url: string, body: unknown): Promise<void> {
    if (this.failWith) {
      throw new TypeError(this.failWith);
    }
    this.calls.push({ url, body: body as Record<string, unknown> });
  }
}

const waitFor = async (check: () => boolean | Promise<boolean>, timeoutMs = 3_000): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('Condition not met in time');
};

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 250));

describe('Alerts (e2e)', () => {
  const poster = new RecordingPoster();
  let app: INestApplication;
  let owner: OwnerSession;
  let projectId: string;
  let publicKey: string;
  let slackChannelId: string;
  let discordChannelId: string;

  const ingest = (body: Record<string, unknown>) =>
    request(app.getHttpServer())
      .post(`/api/ingest/v1/${projectId}/events`)
      .set('x-watchdog-key', publicKey)
      .send(body);

  const typeError = (message: string, extra: Record<string, unknown> = {}) => ({
    eventId: randomUUID(),
    exception: {
      type: 'TypeError',
      value: message,
      stacktrace: { frames: [{ filename: 'src/a.ts', function: message, lineno: 1, inApp: true }] },
    },
    ...extra,
  });

  const createRule = async (body: Record<string, unknown>) =>
    (await owner.agent.post(`/api/projects/${projectId}/alert-rules`).send({ channelIds: [slackChannelId], ...body })).body;

  beforeAll(async () => {
    app = await createTestApp((builder) => builder.overrideProvider(HttpPoster).useValue(poster));
    await resetDatabase(app);
    owner = await signInOwner(app);

    const project = await owner.agent.post('/api/projects').send({ name: 'Alerting' }).expect(201);
    projectId = project.body.id;
    publicKey = project.body.keys[0].publicKey;

    slackChannelId = (
      await owner.agent.post('/api/alerts/channels').send({ type: 'SLACK', name: 'Dev Slack', config: { webhookUrl: SLACK_URL } }).expect(201)
    ).body.id;
    discordChannelId = (
      await owner.agent.post('/api/alerts/channels').send({ type: 'DISCORD', name: 'Ops Discord', config: { webhookUrl: DISCORD_URL } }).expect(201)
    ).body.id;
  });

  beforeEach(async () => {
    poster.calls = [];
    poster.failWith = null;
    await app.get(await import('../src/database/prisma.service').then((module) => module.PrismaService)).alertRule.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('channels', () => {
    it('never returns webhook secrets', async () => {
      const response = await owner.agent.get('/api/alerts/channels').expect(200);

      const serialized = JSON.stringify(response.body);
      expect(serialized).not.toContain('abcdefghijklmnopqrstuvwx');
      expect(response.body[0]).toMatchObject({ type: 'SLACK', name: 'Dev Slack', hint: 'hooks.slack.com/…uvwx', enabled: true });
    });

    it('rejects webhook urls outside the provider hosts and bad telegram settings', async () => {
      await owner.agent.post('/api/alerts/channels').send({ type: 'SLACK', name: 'x', config: { webhookUrl: 'https://localhost/hook' } }).expect(400);
      await owner.agent.post('/api/alerts/channels').send({ type: 'DISCORD', name: 'x', config: { webhookUrl: SLACK_URL } }).expect(400);
      await owner.agent.post('/api/alerts/channels').send({ type: 'TELEGRAM', name: 'x', config: { botToken: 'bad', chatId: '1' } }).expect(400);
    });

    it('requires authentication', async () => {
      await request(app.getHttpServer()).get('/api/alerts/channels').expect(401);
    });

    it('sends a test alert through the channel', async () => {
      await owner.agent.post(`/api/alerts/channels/${slackChannelId}/test`).expect(204);

      expect(poster.calls).toHaveLength(1);
      expect(poster.calls[0].url).toBe(SLACK_URL);
      expect(JSON.stringify(poster.calls[0].body)).toContain('Test alert from Watchdog');
    });

    it('reports a failing test alert as a clear error', async () => {
      poster.failWith = 'Provider answered 404: no_service';

      const response = await owner.agent.post(`/api/alerts/channels/${slackChannelId}/test`).expect(400);

      expect(response.body.message).toContain('no_service');
    });
  });

  describe('rules', () => {
    it('validates spike settings and channel references', async () => {
      await owner.agent.post(`/api/projects/${projectId}/alert-rules`).send({ name: 'Spike', trigger: 'SPIKE', channelIds: [slackChannelId] }).expect(400);
      await owner.agent.post(`/api/projects/${projectId}/alert-rules`).send({ name: 'Ghost', trigger: 'NEW_ISSUE', channelIds: [randomUUID()] }).expect(400);
      await owner.agent.post(`/api/projects/${projectId}/alert-rules`).send({ name: 'None', trigger: 'NEW_ISSUE', channelIds: [] }).expect(400);
    });

    it('creates, lists, updates and deletes a rule', async () => {
      const created = await createRule({ name: 'New issues', trigger: 'NEW_ISSUE' });
      expect(created).toMatchObject({ trigger: 'NEW_ISSUE', minLevel: 'error', cooldownMins: 30, channelIds: [slackChannelId] });

      const updated = await owner.agent
        .patch(`/api/alert-rules/${created.id}`)
        .send({ channelIds: [slackChannelId, discordChannelId], enabled: false })
        .expect(200);
      expect(updated.body.channelIds).toHaveLength(2);
      expect(updated.body.enabled).toBe(false);

      const list = await owner.agent.get(`/api/projects/${projectId}/alert-rules`).expect(200);
      expect(list.body).toHaveLength(1);

      await owner.agent.delete(`/api/alert-rules/${created.id}`).expect(204);
      await owner.agent.get(`/api/projects/${projectId}/alert-rules`).expect(200).expect((r) => expect(r.body).toHaveLength(0));
    });
  });

  describe('delivery', () => {
    it('alerts once on a new issue, across every channel on the rule', async () => {
      await createRule({ name: 'New', trigger: 'NEW_ISSUE', channelIds: [slackChannelId, discordChannelId] });

      await ingest(typeError('first problem')).expect(202);
      await waitFor(() => poster.calls.length >= 2);
      await ingest(typeError('first problem')).expect(202);
      await settle();

      expect(poster.calls.map((call) => new URL(call.url).host).sort()).toEqual(['discord.com', 'hooks.slack.com']);
      expect(JSON.stringify(poster.calls[0].body)).toContain('first problem');
    });

    it('respects the minimum level and environment filters', async () => {
      await createRule({ name: 'Prod errors', trigger: 'NEW_ISSUE', minLevel: 'error', environment: 'production' });

      await ingest({ eventId: randomUUID(), message: 'just a warning', level: 'warning', environment: 'production' }).expect(202);
      await ingest(typeError('staging problem', { environment: 'staging' })).expect(202);
      await settle();
      expect(poster.calls).toHaveLength(0);

      await ingest(typeError('production problem', { environment: 'production' })).expect(202);
      await waitFor(() => poster.calls.length === 1);
    });

    it('alerts on regressions and honours the cooldown', async () => {
      await createRule({ name: 'Regressions', trigger: 'REGRESSION', cooldownMins: 60 });
      await ingest(typeError('comes back')).expect(202);
      const issues = await owner.agent.get(`/api/projects/${projectId}/issues?q=comes`).expect(200);
      const issueId = issues.body.items[0].id;

      await owner.agent.patch(`/api/issues/${issueId}`).send({ status: 'RESOLVED' }).expect(200);
      await ingest(typeError('comes back')).expect(202);
      await waitFor(() => poster.calls.length === 1);
      expect(JSON.stringify(poster.calls[0].body)).toContain('Issue regressed');

      await owner.agent.patch(`/api/issues/${issueId}`).send({ status: 'RESOLVED' }).expect(200);
      await ingest(typeError('comes back')).expect(202);
      await settle();
      expect(poster.calls).toHaveLength(1);
    });

    it('alerts when an issue spikes', async () => {
      await createRule({ name: 'Spike', trigger: 'SPIKE', spikeThreshold: 3, spikeWindowMins: 5 });

      await ingest(typeError('noisy')).expect(202);
      await ingest(typeError('noisy')).expect(202);
      await settle();
      expect(poster.calls).toHaveLength(0);

      await ingest(typeError('noisy')).expect(202);
      await waitFor(() => poster.calls.length === 1);
      expect(JSON.stringify(poster.calls[0].body)).toContain('Spike: 3 events in 5 min');
    });

    it('does not alert through disabled rules or disabled channels', async () => {
      const rule = await createRule({ name: 'Off', trigger: 'NEW_ISSUE', enabled: false });
      await ingest(typeError('quiet one')).expect(202);
      await settle();
      expect(poster.calls).toHaveLength(0);

      await owner.agent.patch(`/api/alert-rules/${rule.id}`).send({ enabled: true }).expect(200);
      await owner.agent.patch(`/api/alerts/channels/${slackChannelId}`).send({ enabled: false }).expect(200);
      await ingest(typeError('quiet two')).expect(202);
      await settle();
      expect(poster.calls).toHaveLength(0);

      await owner.agent.patch(`/api/alerts/channels/${slackChannelId}`).send({ enabled: true }).expect(200);
    });

    it('records failures in the delivery log and never breaks ingestion', async () => {
      poster.failWith = 'Provider answered 500: down';
      await createRule({ name: 'Failing', trigger: 'NEW_ISSUE' });

      await ingest(typeError('failing delivery')).expect(202);
      await waitFor(async () => {
        const deliveries = await owner.agent.get('/api/alerts/deliveries');
        return deliveries.body.some((delivery: { status: string }) => delivery.status === 'FAILED');
      });

      const deliveries = await owner.agent.get('/api/alerts/deliveries').expect(200);
      const failed = deliveries.body.find((delivery: { status: string }) => delivery.status === 'FAILED');
      expect(failed).toMatchObject({ ruleName: 'Failing', channelName: 'Dev Slack' });
      expect(failed.error).toContain('down');
    });
  });

  describe('SMTP settings', () => {
    it('stores settings encrypted and never returns the password', async () => {
      const saved = await owner.agent
        .put('/api/settings/smtp')
        .send({ host: 'smtp.example.com', port: 587, secure: false, user: 'mailer', password: 'super-secret', from: 'Watchdog <alerts@example.com>' })
        .expect(200);

      expect(saved.body).toMatchObject({ configured: true, source: 'database', host: 'smtp.example.com', hasPassword: true });
      expect(JSON.stringify(saved.body)).not.toContain('super-secret');

      const kept = await owner.agent
        .put('/api/settings/smtp')
        .send({ host: 'smtp.example.com', port: 465, secure: true, user: 'mailer', from: 'alerts@example.com' })
        .expect(200);
      expect(kept.body).toMatchObject({ port: 465, hasPassword: true });

      const status = await request(app.getHttpServer()).get('/api/auth/status').expect(200);
      expect(status.body.emailCodeAvailable).toBe(true);

      const cleared = await owner.agent.delete('/api/settings/smtp').expect(200);
      expect(cleared.body).toMatchObject({ configured: false, source: 'none' });
    });

    it('validates input and requires authentication', async () => {
      await owner.agent.put('/api/settings/smtp').send({ host: '', port: 0, secure: 'yes', from: '' }).expect(400);
      await request(app.getHttpServer()).get('/api/settings/smtp').expect(401);
    });
  });
});
