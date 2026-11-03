import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: ['.env', '../../.env'], quiet: true });

const TEST_SECRET_KEY = 'e2e-secret-key-e2e-secret-key-e2e-secret-key';

export default async function setup(): Promise<() => Promise<void>> {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new TypeError('DATABASE_URL is required to run the end-to-end tests');
  }
  const databaseName = `watchdog_e2e_${randomBytes(4).toString('hex')}`;
  const admin = new Client({ connectionString: baseUrl });
  await admin.connect();
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  await admin.end();

  const testUrl = new URL(baseUrl);
  testUrl.pathname = `/${databaseName}`;
  process.env.DATABASE_URL = testUrl.toString();
  process.env.WATCHDOG_SECRET_KEY = TEST_SECRET_KEY;
  process.env.SETUP_TOKEN = 'e2e-setup-token';
  process.env.APP_URL = 'http://localhost:3000';
  process.env.REDIS_URL = '';
  process.env.LOG_LEVEL = 'silent';
  process.env.SHIELD_ENABLED = 'false';
  process.env.INGEST_EVENTS_PER_MINUTE = '600';

  execFileSync('node', ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
    stdio: 'pipe',
    env: process.env,
  });

  return async () => {
    const cleanup = new Client({ connectionString: baseUrl });
    await cleanup.connect();
    await cleanup.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
    await cleanup.end();
  };
}
