import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './support/create-test-app';
import { OwnerSession, resetDatabase, signInOwner } from './support/test-helpers';

const ORIGINAL_SOURCE = [
  'export function checkout(cart) {',
  '  const total = cart.items.reduce((sum, item) => sum + item.price, 0);',
  '  return total.toFixed(2);',
  '}',
].join('\n');

const SOURCE_MAP = JSON.stringify({
  version: 3,
  file: 'index-abc.js',
  sources: ['../src/checkout.ts'],
  sourcesContent: [ORIGINAL_SOURCE],
  names: ['checkout'],
  mappings: 'AAAA;EACE;EACA',
});

const typeErrorEvent = (overrides: Record<string, unknown> = {}) => ({
  eventId: randomUUID(),
  exception: {
    type: 'TypeError',
    value: 'Cannot read properties of undefined',
    stacktrace: {
      frames: [
        { filename: 'src/entry.ts', function: 'main', lineno: 1, inApp: true },
        { filename: 'src/cart.ts', function: 'total', lineno: 42, inApp: true },
      ],
    },
  },
  ...overrides,
});

describe('Projects, ingest and issues (e2e)', () => {
  let app: INestApplication;
  let owner: OwnerSession;
  let projectId: string;
  let publicKey: string;
  let uploadToken: string;

  const ingest = (body: unknown, key: string | null = publicKey, id = projectId) => {
    const call = request(app.getHttpServer()).post(`/api/ingest/v1/${id}/events`);
    return (key ? call.set('x-watchdog-key', key) : call).send(body as object);
  };

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    owner = await signInOwner(app);

    const created = await owner.agent
      .post('/api/projects')
      .send({ name: 'Storefront', platform: 'react' })
      .expect(201);
    projectId = created.body.id;
    publicKey = created.body.keys[0].publicKey;
    uploadToken = created.body.uploadToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('projects', () => {
    it('creates a project with a DSN, a key and a one-time upload token', async () => {
      const response = await owner.agent.get(`/api/projects/${projectId}`).expect(200);

      expect(response.body.slug).toBe('storefront');
      expect(response.body.keys[0].dsn).toBe(`http://${publicKey}@localhost:3000/${projectId}`);
      expect(response.body.uploadToken).toBeUndefined();
      expect(uploadToken).toMatch(/^wdt_/);
    });

    it('gives colliding names a unique slug', async () => {
      const response = await owner.agent.post('/api/projects').send({ name: 'Storefront' }).expect(201);

      expect(response.body.slug).toMatch(/^storefront-[0-9a-f]{4}$/);
    });

    it('requires authentication to list projects', async () => {
      await request(app.getHttpServer()).get('/api/projects').expect(401);
    });

    it('refuses to delete the last key', async () => {
      const project = await owner.agent.get(`/api/projects/${projectId}`);

      await owner.agent
        .delete(`/api/projects/${projectId}/keys/${project.body.keys[0].id}`)
        .expect(400);
    });
  });

  describe('accepting events', () => {
    it('accepts an event with a valid key', async () => {
      const event = typeErrorEvent();

      const response = await ingest(event).expect(202);

      expect(response.body.id).toBe(event.eventId);
    });

    it('rejects a missing, wrong, or foreign key', async () => {
      const other = await owner.agent.post('/api/projects').send({ name: 'Other' }).expect(201);

      await ingest(typeErrorEvent(), null).expect(401);
      await ingest(typeErrorEvent(), 'not-a-key').expect(401);
      await ingest(typeErrorEvent(), other.body.keys[0].publicKey).expect(401);
    });

    it('rejects a disabled key and accepts it again when re-enabled', async () => {
      const project = await owner.agent.post('/api/projects').send({ name: 'Toggle' }).expect(201);
      const { id, keys } = project.body;

      await ingest(typeErrorEvent(), keys[0].publicKey, id).expect(202);
      await owner.agent.patch(`/api/projects/${id}/keys/${keys[0].id}`).send({ active: false }).expect(204);
      await ingest(typeErrorEvent(), keys[0].publicKey, id).expect(401);

      await owner.agent.patch(`/api/projects/${id}/keys/${keys[0].id}`).send({ active: true }).expect(204);
      await ingest(typeErrorEvent(), keys[0].publicKey, id).expect(202);
    });

    it('rejects malformed payloads', async () => {
      await ingest({}).expect(400);
      await ingest({ exception: 'nope' }).expect(400);
    });

    it('accepts text/plain bodies with the key in the query string (sendBeacon)', async () => {
      const event = typeErrorEvent();

      await request(app.getHttpServer())
        .post(`/api/ingest/v1/${projectId}/events?key=${publicKey}`)
        .set('content-type', 'text/plain')
        .send(JSON.stringify(event))
        .expect(202);
    });

    it('answers browser preflight requests from any origin', async () => {
      const response = await request(app.getHttpServer())
        .options(`/api/ingest/v1/${projectId}/events`)
        .set('Origin', 'https://customer-app.example')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type,x-watchdog-key')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-headers']).toContain('x-watchdog-key');
    });

    it('does not let arbitrary origins call the dashboard API with credentials', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/projects')
        .set('Origin', 'https://evil.example')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('grouping and issue lifecycle', () => {
    let freshProjectId: string;
    let freshKey: string;

    const send = (body: unknown) => ingest(body, freshKey, freshProjectId);
    const listIssues = async (query = '') =>
      (await owner.agent.get(`/api/projects/${freshProjectId}/issues${query}`).expect(200)).body;

    beforeAll(async () => {
      const project = await owner.agent.post('/api/projects').send({ name: 'Grouping' }).expect(201);
      freshProjectId = project.body.id;
      freshKey = project.body.keys[0].publicKey;
    });

    it('groups identical errors into one issue and counts the events', async () => {
      await send(typeErrorEvent()).expect(202);
      await send(typeErrorEvent({ release: '1.0.1' })).expect(202);

      const issues = await listIssues();

      expect(issues.total).toBe(1);
      expect(issues.items[0]).toMatchObject({
        eventCount: 2,
        status: 'UNRESOLVED',
        culprit: 'total (src/cart.ts:42)',
        lastRelease: '1.0.1',
      });
    });

    it('keeps the newest last-seen and oldest first-seen when events arrive out of order', async () => {
      const day = 86_400_000;
      const project = await owner.agent.post('/api/projects').send({ name: 'Ordering' }).expect(201);
      const frame = [{ filename: 'src/late.ts', function: 'late', lineno: 1, inApp: true }];
      const late = (daysAgo: number, release: string) =>
        ingest(
          {
            eventId: randomUUID(),
            timestamp: Date.now() - daysAgo * day,
            release,
            exception: { type: 'LateError', value: 'arrived out of order', stacktrace: { frames: frame } },
          },
          project.body.keys[0].publicKey,
          project.body.id,
        ).expect(202);

      await late(0, '2.0.0');
      await late(3, '1.0.0');
      await late(1, '1.5.0');

      const listed = await owner.agent.get(`/api/projects/${project.body.id}/issues`).expect(200);
      const issue = listed.body.items[0];
      expect(listed.body.total).toBe(1);
      expect(issue.eventCount).toBe(3);
      expect(issue.lastRelease).toBe('2.0.0');
      expect(issue.firstRelease).toBe('1.0.0');
      expect(Date.now() - new Date(issue.lastSeen).getTime()).toBeLessThan(day / 2);
      expect(Date.now() - new Date(issue.firstSeen).getTime()).toBeGreaterThan(2.5 * day);
    });

    it('creates a separate issue for a different error', async () => {
      await send({ message: 'Payment provider timed out', level: 'warning' }).expect(202);

      const issues = await listIssues();

      expect(issues.total).toBe(2);
    });

    it('does not double count a retried event id', async () => {
      const event = typeErrorEvent();
      const before = (await listIssues()).items.find((issue: { eventCount: number }) => issue.eventCount >= 2);

      await send(event).expect(202);
      await send(event).expect(202);

      const after = (await listIssues()).items.find((issue: { id: string }) => issue.id === before.id);
      expect(after.eventCount).toBe(before.eventCount + 1);
    });

    it('filters and searches issues', async () => {
      const searched = await listIssues('?q=payment');
      const sorted = await listIssues('?sort=events');

      expect(searched.total).toBe(1);
      expect(sorted.items[0].eventCount).toBeGreaterThanOrEqual(sorted.items[1].eventCount);
    });

    it('marks a resolved issue as a regression when it happens again', async () => {
      const issueId = (await listIssues('?q=Cannot')).items[0].id;
      await owner.agent.patch(`/api/issues/${issueId}`).send({ status: 'RESOLVED' }).expect(200);

      await send(typeErrorEvent()).expect(202);

      const detail = await owner.agent.get(`/api/issues/${issueId}`).expect(200);
      expect(detail.body.issue.status).toBe('UNRESOLVED');
      expect(detail.body.issue.regressedAt).not.toBeNull();
      expect(detail.body.latestEvent.payload.exception.type).toBe('TypeError');
    });

    it('keeps an ignored issue ignored while still counting events', async () => {
      const issueId = (await listIssues('?q=payment')).items[0].id;
      await owner.agent.patch(`/api/issues/${issueId}`).send({ status: 'IGNORED' }).expect(200);

      await send({ message: 'Payment provider timed out', level: 'warning' }).expect(202);

      const detail = await owner.agent.get(`/api/issues/${issueId}`).expect(200);
      expect(detail.body.issue.status).toBe('IGNORED');
      expect(detail.body.issue.eventCount).toBe(2);
    });

    it('lists events for an issue and serves project stats', async () => {
      const issueId = (await listIssues('?q=Cannot')).items[0].id;

      const events = await owner.agent.get(`/api/issues/${issueId}/events`).expect(200);
      const stats = await owner.agent.get(`/api/projects/${freshProjectId}/stats?range=24h`).expect(200);

      expect(events.body.total).toBeGreaterThanOrEqual(3);
      expect(stats.body.totalEvents).toBeGreaterThanOrEqual(5);
      expect(stats.body.series.length).toBeGreaterThan(0);
      expect(stats.body.topReleases[0].release).toBe('1.0.1');
    });

    it('deletes an issue and its events', async () => {
      const issueId = (await listIssues('?q=payment')).items[0].id;

      await owner.agent.delete(`/api/issues/${issueId}`).expect(204);
      await owner.agent.get(`/api/issues/${issueId}`).expect(404);
    });
  });

  describe('source maps', () => {
    const minifiedEvent = (release: string) => ({
      eventId: randomUUID(),
      release,
      exception: {
        type: 'TypeError',
        value: 'total.toFixed is not a function',
        stacktrace: {
          frames: [
            { filename: 'https://shop.example.com/assets/index-abc.js', function: 'a', lineno: 2, colno: 3 },
          ],
        },
      },
    });

    const upload = (version: string, token: string | undefined) => {
      const call = request(app.getHttpServer())
        .post(`/api/projects/${projectId}/releases/${encodeURIComponent(version)}/sourcemaps`)
        .attach('files', Buffer.from(SOURCE_MAP), 'assets/index-abc.js.map');
      return token ? call.set('authorization', `Bearer ${token}`) : call;
    };

    it('rejects uploads without a valid upload token', async () => {
      await upload('2.0.0', undefined).expect(401);
      await upload('2.0.0', 'wdt_wrong').expect(401);
    });

    it('rejects files that are not source maps', async () => {
      await request(app.getHttpServer())
        .post(`/api/projects/${projectId}/releases/2.0.0/sourcemaps`)
        .set('authorization', `Bearer ${uploadToken}`)
        .attach('files', Buffer.from('{"hello":"world"}'), 'assets/x.js.map')
        .expect(400);
    });

    it('stores maps and shows the original source lines on matching events', async () => {
      const uploaded = await upload('2.0.0', uploadToken).expect(201);
      expect(uploaded.body).toEqual({ release: '2.0.0', stored: 1 });

      const event = minifiedEvent('2.0.0');
      await ingest(event).expect(202);

      const stored = await owner.agent.get(`/api/projects/${projectId}/issues?q=toFixed`).expect(200);
      const detail = await owner.agent.get(`/api/issues/${stored.body.items[0].id}`).expect(200);
      const [frame] = detail.body.latestEvent.payload.exception.frames;

      expect(frame).toMatchObject({
        filename: 'src/checkout.ts',
        lineno: 2,
        symbolicated: true,
        contextLine: '  const total = cart.items.reduce((sum, item) => sum + item.price, 0);',
        preContext: ['export function checkout(cart) {'],
        postContext: ['  return total.toFixed(2);', '}'],
      });
    });

    it('leaves frames minified for releases without maps', async () => {
      await ingest(minifiedEvent('9.9.9')).expect(202);

      const stored = await owner.agent.get(`/api/projects/${projectId}/issues?q=toFixed`).expect(200);
      const events = await owner.agent.get(`/api/issues/${stored.body.items[0].id}/events`).expect(200);
      const unmapped = events.body.items.find((item: { release: string }) => item.release === '9.9.9');

      expect(unmapped.payload.exception.frames[0].symbolicated).toBeUndefined();
    });

    it('keeps maps with the same file name in different folders apart', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/projects/${projectId}/releases/3.0.0/sourcemaps`)
        .set('authorization', `Bearer ${uploadToken}`)
        .attach('files', Buffer.from(SOURCE_MAP), { filename: 'main.js.map', filepath: 'en/main.js.map' })
        .attach('files', Buffer.from(SOURCE_MAP), { filename: 'main.js.map', filepath: 'fr/main.js.map' })
        .expect(201);

      const releases = await owner.agent.get(`/api/projects/${projectId}/releases`).expect(200);
      const release = releases.body.find((item: { version: string }) => item.version === '3.0.0');
      expect(response.body.stored).toBe(2);
      expect(release.sourceMapCount).toBe(2);
    });

    it('lists releases with their map counts', async () => {
      const response = await owner.agent.get(`/api/projects/${projectId}/releases`).expect(200);

      const release = response.body.find((item: { version: string }) => item.version === '2.0.0');
      expect(release).toMatchObject({ version: '2.0.0', sourceMapCount: 1 });
    });
  });
});
