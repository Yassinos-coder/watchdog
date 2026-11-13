import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './support/create-test-app';
import { OwnerSession, resetDatabase, signInOwner } from './support/test-helpers';

describe('MCP server (e2e)', () => {
  let app: INestApplication;
  let owner: OwnerSession;
  let projectId: string;
  let readKey: string;
  let adminKey: string;
  let readKeyId: string;
  let issueId: string;

  const rpc = (key: string | null, body: unknown) => {
    const call = request(app.getHttpServer()).post('/api/mcp').set('accept', 'application/json, text/event-stream');
    return (key ? call.set('authorization', `Bearer ${key}`) : call).send(body as object);
  };

  const callTool = async (key: string, name: string, args: Record<string, unknown> = {}) => {
    const response = await rpc(key, { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }).expect(200);
    return response.body.result as { isError: boolean; content: { text: string }[] };
  };

  const createKey = async (name: string, permissions: string[]) =>
    (await owner.agent.post('/api/integrations/mcp/keys').send({ name, permissions }).expect(201)).body;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    owner = await signInOwner(app);
    const project = await owner.agent.post('/api/projects').send({ name: 'WePickUp Backend', platform: 'node' }).expect(201);
    projectId = project.body.id;

    await request(app.getHttpServer())
      .post(`/api/ingest/v1/${projectId}/events`)
      .set('x-watchdog-key', project.body.keys[0].publicKey)
      .send({
        eventId: randomUUID(),
        release: '1.2.3',
        environment: 'production',
        exception: {
          type: 'TypeError',
          value: "Cannot read properties of undefined (reading 'price')",
          stacktrace: {
            frames: [
              { filename: 'node_modules/express/router.js', function: 'handle', lineno: 10, inApp: false },
              {
                filename: 'src/orders/orders.controller.ts',
                function: 'checkout',
                lineno: 41,
                inApp: true,
                contextLine: '  const total = item.price * quantity;',
                preContext: ['  const item = cart.items[0];'],
                postContext: ['  return total;'],
              },
            ],
          },
        },
        breadcrumbs: [{ timestamp: new Date().toISOString(), category: 'http', message: 'POST /checkout' }],
        tags: { tier: 'pro' },
      })
      .expect(202);

    const key = await createKey('Read only', ['projects:read', 'issues:read', 'performance:read', 'alerts:read']);
    readKey = key.key;
    readKeyId = key.id;
    adminKey = (await createKey('Setup', ['projects:read', 'projects:manage', 'issues:read', 'issues:write'])).key;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('API keys', () => {
    it('shows the key once and never again', async () => {
      expect(readKey).toMatch(/^wdmcp_/);
      const list = await owner.agent.get('/api/integrations/mcp/keys').expect(200);

      expect(JSON.stringify(list.body)).not.toContain(readKey);
      expect(list.body.find((entry: { id: string }) => entry.id === readKeyId).prefix).toBe(readKey.slice(0, 12));
    });

    it('returns the full url built from the root address', async () => {
      const config = await owner.agent.get('/api/integrations/mcp/config').expect(200);

      expect(config.body.url).toBe('http://localhost:3000/api/mcp');
      expect(config.body.permissions.map((entry: { id: string }) => entry.id)).toContain('projects:manage');
      expect(config.body.defaults).not.toContain('projects:manage');
      expect(config.body.defaults).not.toContain('issues:write');
    });

    it('requires a signed-in admin and valid permissions', async () => {
      await request(app.getHttpServer()).get('/api/integrations/mcp/keys').expect(401);
      await owner.agent.post('/api/integrations/mcp/keys').send({ name: 'x', permissions: ['everything'] }).expect(400);
    });
  });

  describe('protocol', () => {
    it('rejects missing and unknown keys', async () => {
      await rpc(null, { jsonrpc: '2.0', id: 1, method: 'ping' }).expect(401);
      await rpc('wdmcp_nope', { jsonrpc: '2.0', id: 1, method: 'ping' }).expect(401);
      await rpc('wrong-prefix', { jsonrpc: '2.0', id: 1, method: 'ping' }).expect(401);
    });

    it('negotiates the protocol version on initialize', async () => {
      const response = await rpc(readKey, {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1' } },
      }).expect(200);

      expect(response.body.result.protocolVersion).toBe('2025-03-26');
      expect(response.body.result.serverInfo.name).toBe('watchdog');
      expect(response.body.result.capabilities.tools).toBeDefined();
    });

    it('answers notifications with 202 and unknown methods with an error', async () => {
      await rpc(readKey, { jsonrpc: '2.0', method: 'notifications/initialized' }).expect(202);
      const unknown = await rpc(readKey, { jsonrpc: '2.0', id: 7, method: 'nope' }).expect(200);
      expect(unknown.body.error.code).toBe(-32601);
    });

    it('only accepts POST', async () => {
      await request(app.getHttpServer()).get('/api/mcp').expect(405);
    });
  });

  describe('tools', () => {
    it('lists only the tools a key may use', async () => {
      const read = await rpc(readKey, { jsonrpc: '2.0', id: 1, method: 'tools/list' }).expect(200);
      const names = read.body.result.tools.map((tool: { name: string }) => tool.name);

      expect(names).toContain('get_latest_issue');
      expect(names).toContain('query_series');
      expect(names).not.toContain('update_issue_status');
      expect(names).not.toContain('create_project');
    });

    it('finds a project by name and hands back an issue ready to debug', async () => {
      const result = await callTool(readKey, 'get_latest_issue', { project: 'wepickup backend' });
      const view = JSON.parse(result.content[0].text);
      issueId = view.issue.id;

      expect(result.isError).toBe(false);
      expect(view.issue.title).toContain('TypeError');
      expect(view.event.release).toBe('1.2.3');
      expect(view.event.exception.frames[0]).toMatchObject({ file: 'src/orders/orders.controller.ts', line: 41, inApp: true });
      expect(view.event.exception.frames[0].code).toEqual([
        '  40 |   const item = cart.items[0];',
        '> 41 |   const total = item.price * quantity;',
        '  42 |   return total;',
      ]);
      expect(view.event.breadcrumbs[0].message).toBe('POST /checkout');
      expect(view.event.tags).toEqual({ tier: 'pro' });
    });

    it('opens an issue and lists its occurrences', async () => {
      const issue = JSON.parse((await callTool(readKey, 'get_issue', { issueId })).content[0].text);
      const events = JSON.parse((await callTool(readKey, 'list_issue_events', { issueId })).content[0].text);

      expect(issue.issue.url).toBe(`http://localhost:3000/projects/${projectId}/issues/${issueId}`);
      expect(events.total).toBe(1);
    });

    it('says which projects exist when the name is wrong', async () => {
      const result = await callTool(readKey, 'get_latest_issue', { project: 'nothing here' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('WePickUp Backend');
    });

    it('queries error series', async () => {
      const result = await callTool(readKey, 'query_series', { project: 'WePickUp Backend', source: 'ERRORS', aggregation: 'COUNT', range: '1h' });

      expect(JSON.parse(result.content[0].text).total).toBe(1);
    });

    it('refuses tools outside the key permissions', async () => {
      const write = await callTool(readKey, 'update_issue_status', { issueId, status: 'RESOLVED' });
      const setup = await callTool(readKey, 'get_project_setup', { project: 'WePickUp Backend' });

      expect(write.isError).toBe(true);
      expect(write.content[0].text).toContain('issues:write');
      expect(setup.isError).toBe(true);
    });

    it('changes an issue status when allowed', async () => {
      const result = await callTool(adminKey, 'update_issue_status', { issueId, status: 'RESOLVED' });

      expect(JSON.parse(result.content[0].text).status).toBe('RESOLVED');
    });

    it('rejects bad arguments without crashing', async () => {
      const result = await callTool(readKey, 'get_issue', { issueId: 'not-an-id' });

      expect(result.isError).toBe(true);
    });
  });

  describe('setup tools', () => {
    it('reads the setup details of a project', async () => {
      const setup = JSON.parse((await callTool(adminKey, 'get_project_setup', { project: 'WePickUp Backend' })).content[0].text);

      expect(setup.dsn).toMatch(new RegExp(`^http://[^@]+@localhost:3000/${projectId}$`));
      expect(setup.install).toBe('npm install @watchdog-sdk/node');
      expect(setup.envFile).toContain(`WATCHDOG_PROJECT_ID=${projectId}`);
      expect(setup.envFile).toContain('call rotate_upload_token');
    });

    it('creates a project with a first upload token', async () => {
      const result = await callTool(adminKey, 'create_project', { name: 'Fresh API', platform: 'python' });
      const setup = JSON.parse(result.content[0].text);

      expect(result.isError).toBe(false);
      expect(setup.install).toBe('pip install watchdog-sdk');
      expect(setup.envFile).toMatch(/WATCHDOG_UPLOAD_TOKEN=wdt_/);
      const projects = await owner.agent.get('/api/projects').expect(200);
      expect(projects.body.map((entry: { name: string }) => entry.name)).toContain('Fresh API');
    });

    it('rotates the upload token', async () => {
      const result = await callTool(adminKey, 'rotate_upload_token', { project: 'Fresh API' });

      expect(JSON.parse(result.content[0].text).envFile).toMatch(/WATCHDOG_UPLOAD_TOKEN=wdt_/);
    });
  });

  describe('revoking', () => {
    it('stops a deleted key at once and updates permissions on the fly', async () => {
      await owner.agent.patch(`/api/integrations/mcp/keys/${readKeyId}`).send({ permissions: ['projects:read'] }).expect(200);
      const narrowed = await rpc(readKey, { jsonrpc: '2.0', id: 1, method: 'tools/list' }).expect(200);
      expect(narrowed.body.result.tools.map((tool: { name: string }) => tool.name)).toEqual(['list_projects']);

      await owner.agent.delete(`/api/integrations/mcp/keys/${readKeyId}`).expect(204);
      await rpc(readKey, { jsonrpc: '2.0', id: 1, method: 'ping' }).expect(401);
    });
  });
});
