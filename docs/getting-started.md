# Getting started

Watchdog is a single container plus PostgreSQL. It catches errors, tracks performance and records sessions from your apps.

::: tip Skip the clicking: let your AI assistant set it up
Once Watchdog is running, open **Integrations → MCP**, create an API key with **Set up projects and credentials** turned on, and connect Claude Code or another assistant. Then say: *"Use Watchdog to set up error tracking in this repo."* It creates the project, installs the right SDK, adds the init code and writes the DSN and source map keys to your `.env` file. See [MCP](mcp.md).
:::

## 1. Run it

The quickest route is [Railway](railway.md). To run it yourself:

```bash
docker compose --profile app up -d
```

Set at least `DATABASE_URL` and `WATCHDOG_SECRET_KEY` (generate one with `openssl rand -hex 32`). See [Configuration](configuration.md) for everything else.

## 2. Create the owner

Open the app. Enter the **setup token** (`SETUP_TOKEN`, or the value printed in the server log on first start) and create the owner account. You then add two-step verification. See [Authentication](authentication.md).

## 3. Create a project and copy the DSN

Under **Projects**, create a project. Its settings page shows the DSN your SDK needs.

## 4. Install an SDK

```bash
npm install @watchdog-sdk/browser
```

```ts
import { init } from '@watchdog-sdk/browser';

init({ dsn: 'https://<key>@your-watchdog.example.com/<project-id>', release: '1.0.0' });
```

For Node use `@watchdog-sdk/node`; for React error boundaries use `@watchdog-sdk/react`; for mobile apps use [`@watchdog-sdk/react-native`](react-native.md); for Python use [`watchdog-sdk`](python.md).

## What next

- [Tracing and metrics](tracing-and-metrics.md): see how long things take
- [Session replay](session-replay.md): watch what users did before an error
- [Alerts](alerts/overview.md): get told when something breaks
- [Team, invites and roles](team.md): bring your colleagues in
