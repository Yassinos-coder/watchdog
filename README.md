# Watchdog

Open source, self-hosted error tracking, performance tracing and session replay. Free forever, runs on your own infrastructure, no accounts with anyone but yourself.

> Status: early development. Error tracking, grouping, source-mapped code frames and authentication work today. Alerts, tracing and session replay are on the roadmap.

## Features

- **Error tracking** with automatic grouping into issues, status workflow (unresolved, resolved, ignored) and regression detection
- **Real code lines**: upload source maps and see the original file, line and surrounding code for every stack frame
- **Self-hosted authentication**: email and password with required two-step verification (authenticator app, passkey or emailed code) and recovery codes
- **Your own SDKs** for browser, React and Node.js
- **Alerts** to Slack, Discord, Telegram and email, with your own SMTP server
- **One container + PostgreSQL**, Redis optional

## Run it with Docker

```bash
git clone https://github.com/Yassinos-coder/watchdog.git
cd watchdog
cp .env.example .env
```

Edit `.env`: set `WATCHDOG_SECRET_KEY` (for example `openssl rand -hex 32`), set `APP_URL` to the address you will open Watchdog on, and optionally `SETUP_TOKEN`.

```bash
docker compose --profile app up -d
```

Open the app and follow the first-run setup. If you did not set `SETUP_TOKEN`, find it in the logs: `docker compose logs watchdog | grep "setup token"`.

## Send your first error

Create a project in the dashboard and copy its DSN. The SDKs are published from this repository as `@watchdog/*` workspace packages (npm publishing is not set up yet, so install them from the repo for now).

```ts
// React
import * as Watchdog from '@watchdog/react';

Watchdog.init({ dsn: 'https://<key>@your-watchdog-host/<project-id>', release: '1.0.0' });

createRoot(root, Watchdog.reactRootErrorHandlers()).render(
  <Watchdog.WatchdogErrorBoundary fallback={<p>Something went wrong.</p>}>
    <App />
  </Watchdog.WatchdogErrorBoundary>,
);
```

```ts
// Node.js / NestJS
import * as Watchdog from '@watchdog/node';
import { WatchdogExceptionFilter } from '@watchdog/node/nest';

Watchdog.init({ dsn: '...', release: process.env.APP_VERSION });
// providers: [{ provide: APP_FILTER, useClass: WatchdogExceptionFilter }]
```

### See the real code, not minified bundles

Upload source maps from your build so stack traces show your original files and the lines around each failure:

```bash
WATCHDOG_URL=https://your-watchdog-host \
WATCHDOG_PROJECT_ID=<project-id> \
WATCHDOG_UPLOAD_TOKEN=<upload token from project settings> \
bunx watchdog sourcemaps upload ./dist --release 1.0.0
```

The `release` passed to the SDK and to the CLI must match.

## Packages

| Package | Purpose |
| --- | --- |
| `@watchdog/core` | Event model, stack parsing, retrying transport |
| `@watchdog/browser` | Global handlers, breadcrumbs for clicks, navigation, console and network |
| `@watchdog/react` | Error boundary, hooks and React 19 root handlers |
| `@watchdog/node` | Process handlers, source context from disk, Express and NestJS integration |
| `@watchdog/cli` | Source map upload |

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `WATCHDOG_SECRET_KEY` | yes | 32+ characters; encrypts authenticator secrets. Keep it stable |
| `APP_URL` | recommended | Public URL (also used for passkeys). Detected automatically on Railway, Render, Fly and Koyeb |
| `SETUP_TOKEN` | recommended | Guards the first-run setup; generated and logged if unset |
| `REDIS_URL` | no | Shared rate-limit counters across instances |
| `TRUST_PROXY` | no | Number of reverse proxies in front of Watchdog (for accurate client IPs) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | no | Needed for emailed sign-in codes |
| `LOG_LEVEL` | no | `error`, `warn`, `info`, `debug` or `silent` (JSON logs in production) |
| `INGEST_EVENTS_PER_MINUTE` | no | Per-project event quota (default 6000) |
| `DOCS_URL` | no | Base URL of your documentation, used by the dashboard's "Setup guide" links |

## Documentation

Guides live in [docs/](docs/README.md): alerts, authentication and source maps. Set `DOCS_URL` if you host them elsewhere; the dashboard links to them from every setup form.

## Stack

NestJS + Prisma + PostgreSQL, React + Vite + Tailwind, Bun workspaces + Turborepo, Winston logging.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
