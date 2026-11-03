import type { INestApplication } from '@nestjs/common';
import { generate } from 'otplib';
import request from 'supertest';
import { PrismaService } from '../../src/database/prisma.service';

export const OWNER_EMAIL = 'owner@example.com';
export const OWNER_PASSWORD = 'correct horse battery';
export const SETUP_TOKEN = 'e2e-setup-token';

export type TestAgent = ReturnType<typeof request.agent>;

export interface OwnerSession {
  agent: TestAgent;
  totpSecret: string;
  recoveryCodes: string[];
}

export async function resetDatabase(app: INestApplication): Promise<void> {
  await app
    .get(PrismaService)
    .$executeRawUnsafe(
      'TRUNCATE TABLE users, sessions, passkeys, recovery_codes, projects, project_keys, issues, events, releases, source_maps, alert_channels, alert_rules, alert_deliveries, instance_settings RESTART IDENTITY CASCADE',
    );
}

export async function signInOwner(app: INestApplication): Promise<OwnerSession> {
  const agent = request.agent(app.getHttpServer());

  await agent
    .post('/api/auth/setup')
    .send({ setupToken: SETUP_TOKEN, email: OWNER_EMAIL, name: 'Owner', password: OWNER_PASSWORD })
    .expect(201);

  const enrollment = await agent.post('/api/auth/mfa/totp/setup').expect(200);
  const totpSecret = enrollment.body.secret as string;
  const confirmation = await agent
    .post('/api/auth/mfa/totp/confirm')
    .send({ code: await generate({ secret: totpSecret }) })
    .expect(200);

  return { agent, totpSecret, recoveryCodes: confirmation.body.recoveryCodes as string[] };
}

export function newAgent(app: INestApplication): TestAgent {
  return request.agent(app.getHttpServer());
}
