# Watchdog

Open source, self-hosted error tracking, performance tracing and session replay. Free forever, runs on your own infrastructure, no accounts with anyone but yourself.

> Status: early development. Error tracking, grouping, source-mapped code frames and authentication work today. Alerts, tracing and session replay are on the roadmap.

## Features

- **Error tracking** with automatic grouping into issues, status workflow (unresolved, resolved, ignored) and regression detection
- **Real code lines**: upload source maps and see the original file, line and surrounding code for every stack frame
- **Self-hosted authentication**: email and password with required two-step verification (authenticator app, passkey or emailed code) and recovery codes
- **Your own SDKs** for browser, React and Node.js
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

## Stack

NestJS + Prisma + PostgreSQL, React + Vite + Tailwind, Bun workspaces + Turborepo, Winston logging.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
