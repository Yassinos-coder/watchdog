import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './support/create-test-app';
import { newAgent, OwnerSession, resetDatabase, signInOwner } from './support/test-helpers';

const MEMBER_PASSWORD = 'a perfectly fine passphrase';

describe('Team invites and roles (e2e)', () => {
  let app: INestApplication;
  let owner: OwnerSession;

  const tokenFrom = (link: string): string => link.split('/invite/')[1];

  const inviteAndAccept = async (email: string, role: 'ADMIN' | 'MEMBER') => {
    const created = await owner.agent.post('/api/invites').send({ email, role }).expect(201);
    const agent = newAgent(app);
    await agent
      .post('/api/invites/accept')
      .send({ token: tokenFrom(created.body.link), name: 'Invited', password: MEMBER_PASSWORD })
      .expect(200);
    return agent;
  };

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    owner = await signInOwner(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('previews an invite and rejects unknown tokens', async () => {
    const created = await owner.agent
      .post('/api/invites')
      .send({ email: 'Preview@Example.com', role: 'MEMBER' })
      .expect(201);

    const preview = await request(app.getHttpServer())
      .get(`/api/invites/preview/${tokenFrom(created.body.link)}`)
      .expect(200);
    expect(preview.body.email).toBe('preview@example.com');

    await request(app.getHttpServer()).get('/api/invites/preview/nope').expect(404);
  });

  it('accepts an invite once and signs the new member in', async () => {
    const created = await owner.agent
      .post('/api/invites')
      .send({ email: 'member@example.com', role: 'MEMBER' })
      .expect(201);
    const token = tokenFrom(created.body.link);
    const agent = newAgent(app);

    const accepted = await agent
      .post('/api/invites/accept')
      .send({ token, name: 'Member', password: MEMBER_PASSWORD })
      .expect(200);
    expect(accepted.body.user.role).toBe('MEMBER');

    await agent.get('/api/auth/me').expect(200);
    await newAgent(app)
      .post('/api/invites/accept')
      .send({ token, name: 'Again', password: MEMBER_PASSWORD })
      .expect(404);
  });

  it('refuses to invite an existing user', async () => {
    await owner.agent.post('/api/invites').send({ email: 'member@example.com', role: 'MEMBER' }).expect(409);
  });

  it('keeps members away from team management', async () => {
    const member = await inviteAndAccept('plain@example.com', 'MEMBER');

    await member.get('/api/team').expect(403);
    await member.post('/api/invites').send({ email: 'x@example.com', role: 'MEMBER' }).expect(403);
  });

  it('lets the owner change roles and remove members', async () => {
    await inviteAndAccept('promote@example.com', 'MEMBER');
    const team = await owner.agent.get('/api/team').expect(200);
    const target = team.body.find((member: { email: string }) => member.email === 'promote@example.com');

    const promoted = await owner.agent.patch(`/api/team/${target.id}`).send({ role: 'ADMIN' }).expect(200);
    expect(promoted.body.role).toBe('ADMIN');

    await owner.agent.delete(`/api/team/${target.id}`).expect(204);
    const after = await owner.agent.get('/api/team').expect(200);
    expect(after.body.some((member: { id: string }) => member.id === target.id)).toBe(false);
  });

  it('stops the owner from removing themselves', async () => {
    const team = await owner.agent.get('/api/team').expect(200);
    const self = team.body.find((member: { role: string }) => member.role === 'OWNER');

    await owner.agent.delete(`/api/team/${self.id}`).expect(400);
  });
});
