# Configuration

All settings are environment variables.

## Required

| Variable | Meaning |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `WATCHDOG_SECRET_KEY` | At least 32 characters. Encrypts stored secrets. Generate with `openssl rand -hex 32`. Do not lose it |

## Common

| Variable | Default | Meaning |
| --- | --- | --- |
| `APP_URL` | detected on Railway, Render, Fly | Public address. Needed for passkeys, invites and OAuth. Set it yourself before moving to a custom domain: see [Moving to a custom domain](railway.md#moving-to-a-custom-domain) |
| `PORT` | `3000` | Port to listen on |
| `SETUP_TOKEN` | printed in the log | Token needed to create the owner |
| `TRUST_PROXY` | `false` | Number of proxy hops in front of the app |
| `CORS_ORIGINS` | none | Extra allowed origins, comma separated |
| `INGEST_EVENTS_PER_MINUTE` | `6000` | Per-project ingest limit |
| `SHIELD_WHITELIST` | none | Comma-separated IPs or CIDR ranges that skip rate limits and IP blocks. Other `SHIELD_*` settings are listed under [Blocked by the shield](railway.md#blocked-by-the-shield-temporary-ip-ban) |
| `DOCS_URL` | GitHub docs | Where in-app help links point |
| `UPDATE_CHECK` | `true` | Owners and admins see a notice when a newer Watchdog version is published. Set to `false` to stop the server contacting the npm registry |

## Email

`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`. You can also set these in the app. See [Email and SMTP](alerts/email.md).

## Sign-in

`OAUTH_GOOGLE_CLIENT_ID`, `OAUTH_GOOGLE_CLIENT_SECRET`, `OAUTH_GITHUB_CLIENT_ID`, `OAUTH_GITHUB_CLIENT_SECRET`. See [OAuth](oauth.md).

## Retention

`RETENTION_EVENT_DAYS`, `RETENTION_PERFORMANCE_DAYS`, `RETENTION_ROLLUP_DAYS`, `RETENTION_REPLAY_DAYS`. See [Data retention](retention.md).
