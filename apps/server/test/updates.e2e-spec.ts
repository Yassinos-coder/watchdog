import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './support/create-test-app';
import { OwnerSession, resetDatabase, signInOwner } from './support/test-helpers';

describe('Update check (e2e)', () => {
  let app: INestApplication;
  let owner: OwnerSession;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    owner = await signInOwner(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires a signed-in user', async () => {
    await request(app.getHttpServer()).get('/api/updates').expect(401);
  });

  it('reports the running version without calling out when the check is disabled', async () => {
    const response = await owner.agent.get('/api/updates').expect(200);

    expect(response.body.checkEnabled).toBe(false);
    expect(response.body.updateAvailable).toBe(false);
    expect(response.body.latestVersion).toBeNull();
    expect(response.body.currentVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
