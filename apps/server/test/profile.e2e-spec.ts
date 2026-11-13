import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './support/create-test-app';
import { OWNER_EMAIL, OWNER_PASSWORD, OwnerSession, resetDatabase, signInOwner } from './support/test-helpers';

describe('Profile and sessions (e2e)', () => {
  let app: INestApplication;
  let owner: OwnerSession;

  const login = (email: string, password: string) =>
    request(app.getHttpServer()).post('/api/auth/login').send({ email, password });

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    owner = await signInOwner(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('changes the display name', async () => {
    const response = await owner.agent.patch('/api/auth/profile').send({ name: '  Yassine C.  ' }).expect(200);

    expect(response.body.name).toBe('Yassine C.');
    await owner.agent.patch('/api/auth/profile').send({ name: '' }).expect(400);
  });

  it('changes the email only with the current password', async () => {
    await owner.agent.post('/api/auth/profile/email').send({ email: 'new@example.com', currentPassword: 'wrong password' }).expect(403);

    const changed = await owner.agent
      .post('/api/auth/profile/email')
      .send({ email: ' New@Example.com ', currentPassword: OWNER_PASSWORD })
      .expect(200);
    expect(changed.body.email).toBe('new@example.com');

    await owner.agent.post('/api/auth/profile/email').send({ email: 'not-an-email', currentPassword: OWNER_PASSWORD }).expect(400);
    await owner.agent.post('/api/auth/profile/email').send({ email: OWNER_EMAIL, currentPassword: OWNER_PASSWORD }).expect(200);
  });

  it('lists the signed-in sessions and protects the current one', async () => {
    const sessions = await owner.agent.get('/api/auth/sessions').expect(200);
    const current = sessions.body.find((entry: { current: boolean }) => entry.current);

    expect(current).toBeDefined();
    await owner.agent.delete(`/api/auth/sessions/${current.id}`).expect(400);
    await owner.agent.delete('/api/auth/sessions/6f1c3d8e-0000-4000-8000-000000000000').expect(404);
    await owner.agent.delete('/api/auth/sessions').expect(204);
  });

  it('changes the password, checks the old one and the strength rules', async () => {
    const change = (currentPassword: string, newPassword: string) =>
      owner.agent.post('/api/auth/profile/password').send({ currentPassword, newPassword });

    await change('wrong password', 'a brand new passphrase').expect(403);
    await change(OWNER_PASSWORD, OWNER_PASSWORD).expect(400);
    await change(OWNER_PASSWORD, 'short').expect(400);
    await change(OWNER_PASSWORD, 'a brand new passphrase').expect(204);

    await login(OWNER_EMAIL, OWNER_PASSWORD).expect(401);
    const fresh = await login(OWNER_EMAIL, 'a brand new passphrase');
    expect(fresh.status).toBeLessThan(300);
    await owner.agent.get('/api/auth/me').expect(200);
  });

  it('requires a signed-in user', async () => {
    await request(app.getHttpServer()).get('/api/auth/sessions').expect(401);
    await request(app.getHttpServer()).post('/api/auth/profile/password').send({ currentPassword: 'x', newPassword: 'y' }).expect(401);
  });
});
