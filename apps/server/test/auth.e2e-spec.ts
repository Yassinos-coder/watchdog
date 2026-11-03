import type { INestApplication } from '@nestjs/common';
import { generate } from 'otplib';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './support/create-test-app';
import {
  newAgent,
  OWNER_EMAIL,
  OWNER_PASSWORD,
  OwnerSession,
  resetDatabase,
  SETUP_TOKEN,
  signInOwner,
} from './support/test-helpers';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('first-run setup', () => {
    it('reports that setup is required', async () => {
      const response = await request(app.getHttpServer()).get('/api/auth/status').expect(200);

      expect(response.body.setupRequired).toBe(true);
    });

    it('rejects an invalid setup token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/setup')
        .send({ setupToken: 'wrong', email: OWNER_EMAIL, name: 'Owner', password: OWNER_PASSWORD })
        .expect(403);
    });

    it('rejects a weak password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/setup')
        .send({ setupToken: SETUP_TOKEN, email: OWNER_EMAIL, name: 'Owner', password: 'short' })
        .expect(400);
    });

    it('rejects unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/setup')
        .send({
          setupToken: SETUP_TOKEN,
          email: OWNER_EMAIL,
          name: 'Owner',
          password: OWNER_PASSWORD,
          role: 'OWNER',
        })
        .expect(400);
    });
  });

  describe('owner lifecycle', () => {
    let owner: OwnerSession;

    beforeAll(async () => {
      owner = await signInOwner(app);
    });

    it('blocks a second setup', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/setup')
        .send({ setupToken: SETUP_TOKEN, email: 'x@example.com', name: 'X', password: OWNER_PASSWORD })
        .expect(409);
    });

    it('issues an httpOnly session cookie and no-store responses', async () => {
      const response = await newAgent(app)
        .post('/api/auth/login')
        .send({ email: OWNER_EMAIL, password: OWNER_PASSWORD })
        .expect(200);

      expect(String(response.headers['set-cookie'])).toMatch(/wd_session=.*HttpOnly/);
      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('returned ten recovery codes when the first method was enrolled', () => {
      expect(owner.recoveryCodes).toHaveLength(10);
    });

    it('serves the current user to a fully verified session', async () => {
      const response = await owner.agent.get('/api/auth/me').expect(200);

      expect(response.body).toMatchObject({
        email: OWNER_EMAIL,
        role: 'OWNER',
        needsMfaSetup: false,
        mfaMethods: ['TOTP'],
      });
    });

    it('requires a login before protected routes', async () => {
      await request(app.getHttpServer()).get('/api/projects').expect(401);
    });

    it('keeps health checks public', async () => {
      await request(app.getHttpServer()).get('/api/health/live').expect(200);
    });
  });

  describe('forced MFA setup for a fresh owner', () => {
    it('blocks protected routes until a second factor is enrolled', async () => {
      await resetDatabase(app);
      const agent = newAgent(app);
      await agent
        .post('/api/auth/setup')
        .send({ setupToken: SETUP_TOKEN, email: OWNER_EMAIL, name: 'Owner', password: OWNER_PASSWORD })
        .expect(201);

      const me = await agent.get('/api/auth/me').expect(200);
      expect(me.body.needsMfaSetup).toBe(true);

      const blocked = await agent.get('/api/projects').expect(403);
      expect(blocked.body.code).toBe('MFA_SETUP_REQUIRED');

      const enrollment = await agent.post('/api/auth/mfa/totp/setup').expect(200);
      expect(enrollment.body.qrCodeDataUrl).toMatch(/^data:image\/png/);

      await agent.post('/api/auth/mfa/totp/confirm').send({ code: '000000' }).expect(400);
      await agent
        .post('/api/auth/mfa/totp/confirm')
        .send({ code: await generate({ secret: enrollment.body.secret }) })
        .expect(200);

      await agent.get('/api/projects').expect(200);
    });
  });

  describe('login with a second factor', () => {
    let owner: OwnerSession;

    beforeAll(async () => {
      await resetDatabase(app);
      owner = await signInOwner(app);
    });

    it('rejects a wrong password and an unknown user with the same message', async () => {
      const wrong = await newAgent(app)
        .post('/api/auth/login')
        .send({ email: OWNER_EMAIL, password: 'not the password' })
        .expect(401);
      const unknown = await newAgent(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'not the password' })
        .expect(401);

      expect(wrong.body.message).toBe(unknown.body.message);
    });

    it('asks for a second factor and gives a pending session no access', async () => {
      const agent = newAgent(app);
      const login = await agent
        .post('/api/auth/login')
        .send({ email: OWNER_EMAIL, password: OWNER_PASSWORD })
        .expect(200);

      expect(login.body).toMatchObject({ mfaRequired: true, methods: ['TOTP'], user: null });
      const pending = await agent.get('/api/auth/me').expect(401);
      expect(pending.body.code).toBe('MFA_REQUIRED');
    });

    it('rotates the session token after a valid code', async () => {
      const agent = newAgent(app);
      const login = await agent
        .post('/api/auth/login')
        .send({ email: OWNER_EMAIL, password: OWNER_PASSWORD })
        .expect(200);
      const pendingCookie = String(login.headers['set-cookie']).split(';')[0];

      await agent.post('/api/auth/mfa/verify').send({ method: 'totp', code: '111111' }).expect(401);
      const verified = await agent
        .post('/api/auth/mfa/verify')
        .send({ method: 'totp', code: await generate({ secret: owner.totpSecret }) })
        .expect(200);

      expect(String(verified.headers['set-cookie']).split(';')[0]).not.toBe(pendingCookie);
      expect(verified.body.user.email).toBe(OWNER_EMAIL);
      await agent.get('/api/auth/me').expect(200);
    });

    it('accepts each recovery code exactly once', async () => {
      const code = owner.recoveryCodes[0];

      const first = newAgent(app);
      await first.post('/api/auth/login').send({ email: OWNER_EMAIL, password: OWNER_PASSWORD });
      await first.post('/api/auth/mfa/verify').send({ method: 'recovery', code }).expect(200);

      const second = newAgent(app);
      await second.post('/api/auth/login').send({ email: OWNER_EMAIL, password: OWNER_PASSWORD });
      await second.post('/api/auth/mfa/verify').send({ method: 'recovery', code }).expect(401);
    });

    it('destroys a pending session after too many bad codes', async () => {
      const agent = newAgent(app);
      await agent.post('/api/auth/login').send({ email: OWNER_EMAIL, password: OWNER_PASSWORD });

      for (let attempt = 0; attempt < 5; attempt += 1) {
        await agent.post('/api/auth/mfa/verify').send({ method: 'totp', code: '222222' }).expect(401);
      }
      const followUp = await agent
        .post('/api/auth/mfa/verify')
        .send({ method: 'totp', code: await generate({ secret: owner.totpSecret }) });

      expect(followUp.status).toBe(401);
    });

    it('reports session state for pending and verified sessions', async () => {
      const agent = newAgent(app);
      const anonymous = await agent.get('/api/auth/session').expect(200);
      expect(anonymous.body).toEqual({ mfaRequired: false, methods: [], user: null });

      await agent.post('/api/auth/login').send({ email: OWNER_EMAIL, password: OWNER_PASSWORD });
      const pending = await agent.get('/api/auth/session').expect(200);
      expect(pending.body).toEqual({ mfaRequired: true, methods: ['TOTP'], user: null });

      await agent
        .post('/api/auth/mfa/verify')
        .send({ method: 'totp', code: await generate({ secret: owner.totpSecret }) });
      const verified = await agent.get('/api/auth/session').expect(200);
      expect(verified.body).toMatchObject({ mfaRequired: false, user: { email: OWNER_EMAIL } });
    });

    it('summarizes security settings and protects the last method', async () => {
      const agent = newAgent(app);
      await agent.post('/api/auth/login').send({ email: OWNER_EMAIL, password: OWNER_PASSWORD });
      await agent
        .post('/api/auth/mfa/verify')
        .send({ method: 'totp', code: await generate({ secret: owner.totpSecret }) });

      const summary = await agent.get('/api/auth/mfa/summary').expect(200);
      expect(summary.body).toMatchObject({
        methods: ['TOTP'],
        passkeys: [],
        emailCodeAvailable: false,
      });
      expect(summary.body.recoveryCodesRemaining).toBeGreaterThan(0);

      const blocked = await agent.delete('/api/auth/mfa/methods/TOTP').expect(400);
      expect(blocked.body.message).toContain('at least one');
      await agent.delete('/api/auth/mfa/methods/EMAIL').expect(404);
      await agent.delete('/api/auth/mfa/methods/SMS').expect(400);
      await agent.delete('/api/auth/mfa/passkeys/unknown').expect(404);
    });

    it('invalidates the session on logout', async () => {
      const agent = newAgent(app);
      await agent.post('/api/auth/login').send({ email: OWNER_EMAIL, password: OWNER_PASSWORD });
      await agent
        .post('/api/auth/mfa/verify')
        .send({ method: 'totp', code: await generate({ secret: owner.totpSecret }) });
      await agent.get('/api/auth/me').expect(200);

      await agent.post('/api/auth/logout').expect(204);
      await agent.get('/api/auth/me').expect(401);
    });
  });
});
