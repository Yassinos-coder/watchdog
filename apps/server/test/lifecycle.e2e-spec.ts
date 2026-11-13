import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HttpPoster } from '../src/alerts/services/http-poster.service';
import { ONLINE_DELAY } from '../src/lifecycle/constants/lifecycle.constants';
import { createTestApp } from './support/create-test-app';
import { resetDatabase, signInOwner } from './support/test-helpers';

const SLACK_URL = 'https://hooks.slack.com/services/T0000/B0000/abcdefghijklmnopqrstuvwx';

class RecordingPoster {
  bodies: string[] = [];

  async postJson(_url: string, body: unknown): Promise<void> {
    this.bodies.push(JSON.stringify(body));
  }
}

const waitFor = async (check: () => boolean, timeoutMs = 5_000): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('Condition not met in time');
};

describe('Restart notices (e2e)', () => {
  const poster = new RecordingPoster();
  const apps: INestApplication[] = [];

  const start = async (): Promise<INestApplication> => {
    const app = await createTestApp((builder) =>
      builder
        .overrideProvider(HttpPoster)
        .useValue(poster)
        .overrideProvider(ONLINE_DELAY)
        .useValue(100),
    );
    apps.push(app);
    return app;
  };

  afterAll(async () => {
    await Promise.all(apps.map((app) => app.close().catch(() => undefined)));
  });

  it('announces a shutdown and then that Watchdog is online with the state of each app', async () => {
    const first = await start();
    await resetDatabase(first);
    const owner = await signInOwner(first);
    await owner.agent
      .post('/api/alerts/channels')
      .send({ type: 'SLACK', name: 'Dev Slack', config: { webhookUrl: SLACK_URL } })
      .expect(201);
    const active = await owner.agent.post('/api/projects').send({ name: 'Shop API' }).expect(201);
    await owner.agent.post('/api/projects').send({ name: 'Idle app' }).expect(201);
    await request(first.getHttpServer())
      .post(`/api/ingest/v1/${active.body.id}/events`)
      .set('x-watchdog-key', active.body.keys[0].publicKey)
      .send({ eventId: randomUUID(), exception: { type: 'Error', value: 'boom' } })
      .expect(202);

    await first.close();

    expect(poster.bodies).toHaveLength(1);
    expect(poster.bodies[0]).toContain('🔴 Watchdog is restarting');
    expect(poster.bodies[0]).toContain('I will message you here as soon as it is online again.');

    await start();
    await waitFor(() => poster.bodies.length === 2);

    const online = poster.bodies[1];
    expect(online).toContain('🟢 Watchdog is online');
    expect(online).toContain('It was away for about');
    expect(online).toContain('🟢 Shop API: last data');
    expect(online).toContain('⚪ Idle app: no data in the last 7 days');
  });

  it('stays quiet when a newer instance has already taken over', async () => {
    const before = poster.bodies.length;
    const older = apps[apps.length - 1];
    await start();

    await older.close();

    await waitFor(() => poster.bodies.length === before + 1);
    expect(poster.bodies[before]).toContain('🟢 Watchdog is online');
    expect(poster.bodies[before]).not.toContain('It was away for about');
    expect(poster.bodies.slice(before).join('')).not.toContain('Watchdog is restarting');
  });
});
