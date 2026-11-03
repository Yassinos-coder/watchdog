import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './support/create-test-app';
import { resetDatabase } from './support/test-helpers';

describe('OAuth sign-in (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists no providers when none are configured', async () => {
    const response = await request(app.getHttpServer()).get('/api/oauth/providers').expect(200);

    expect(response.body).toEqual([]);
  });

  it('refuses to start an unconfigured or unknown provider', async () => {
    await request(app.getHttpServer()).get('/api/oauth/github/start').expect(404);
    await request(app.getHttpServer()).get('/api/oauth/myspace/start').expect(400);
  });

  it('sends the browser back to login when state does not match', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/oauth/github/callback?code=abc&state=forged')
      .expect(302);

    expect(response.headers.location).toBe('/login?oauth=failed');
  });
});
