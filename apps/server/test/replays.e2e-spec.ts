import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './support/create-test-app';
import { OwnerSession, resetDatabase, signInOwner } from './support/test-helpers';

describe('Session replay (e2e)', () => {
  let app: INestApplication;
  let owner: OwnerSession;
  let projectId: string;
  let publicKey: string;

  const post = (body: unknown, key: string | null = publicKey) => {
    const call = request(app.getHttpServer()).post(`/api/ingest/v1/${projectId}/replays`);
    return (key ? call.set('x-watchdog-key', key) : call).send(body as object);
  };

  const chunk = (sequence: number, base: number, extra: Record<string, unknown> = {}) => ({
    replayId: 'replay-abcdef01',
    sequence,
    url: 'https://shop.test/cart',
    events: [
      { type: 4, timestamp: base, data: {} },
      { type: 3, timestamp: base + 500, data: {} },
    ],
    ...extra,
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

  it('rejects chunks without a valid key', async () => {
    await post(chunk(0, 1_000_000_000_000), null).expect(401);
  });

  it('assembles chunks into one replay and ignores duplicate sequences', async () => {
    await post(chunk(0, 1_700_000_000_000, { errorEventIds: ['event-aaaa1111'] })).expect(202);
    await post(chunk(1, 1_700_000_005_000)).expect(202);
    await post(chunk(1, 1_700_000_005_000)).expect(202);

    const list = await owner.agent.get(`/api/projects/${projectId}/replays`).expect(200);
    expect(list.body.total).toBe(1);
    expect(list.body.items[0].chunkCount).toBe(2);
    expect(list.body.items[0].durationMs).toBe(5500);

    const detail = await owner.agent.get(`/api/replays/${list.body.items[0].id}`).expect(200);
    expect(detail.body.events).toHaveLength(4);
  });

  it('finds the replay linked to an error event', async () => {
    const found = await owner.agent
      .get(`/api/projects/${projectId}/events/event-aaaa1111/replay`)
      .expect(200);

    expect(found.body.replayId).toBe('replay-abcdef01');
  });

  it('deletes a replay', async () => {
    const list = await owner.agent.get(`/api/projects/${projectId}/replays`).expect(200);
    await owner.agent.delete(`/api/replays/${list.body.items[0].id}`).expect(204);
    const after = await owner.agent.get(`/api/projects/${projectId}/replays`).expect(200);

    expect(after.body.total).toBe(0);
  });
});
