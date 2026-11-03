# Deploy to Railway

Watchdog runs on Railway as two services: Watchdog itself (built from the repo's Dockerfile) and PostgreSQL. The repo's `railway.json` sets the Dockerfile build, the health check at `/api/health/live` and the restart policy.

## One click

Use the Watchdog template from the README. It creates:

| Service | Source | Notes |
| --- | --- | --- |
| `Watchdog` | this repository, `docker/Dockerfile` | Public domain, health check at `/api/health/live` |
| `Postgres` | Railway PostgreSQL | Provides `DATABASE_URL` |

Everything is filled in for you, including the public domain and a generated `WATCHDOG_SECRET_KEY`. `APP_URL` is detected from the Railway domain. If you add a custom domain later, set `APP_URL` to it **before** registering passkeys.

## First run

1. Open the generated domain.
2. Enter the setup token. Set `SETUP_TOKEN` yourself, or read it from the service's deploy logs (`First-run setup token`).
3. Create the owner account and add two-step verification.

Back up `WATCHDOG_SECRET_KEY`. Stored alert credentials cannot be decrypted without it. Database migrations run automatically on every start.

## Manual setup

1. Create a project from the GitHub repository. Railway reads `railway.json` and builds the Dockerfile.
2. Add a PostgreSQL database and reference its `DATABASE_URL` from the service.
3. Set `WATCHDOG_SECRET_KEY` to a random value of at least 32 characters (`openssl rand -hex 32`) and `TRUST_PROXY` to `1`.
4. Under the service's **Networking** tab, choose **Generate domain**.

## Keeping the database small

Replays and performance data grow fastest. Lower [`RETENTION_REPLAY_DAYS` and `RETENTION_PERFORMANCE_DAYS`](retention.md) if storage becomes a concern.

## Publishing the template (maintainers)

The template is built in Railway's dashboard. The GitHub repository must be public and `bun run build` and `bun run test` must pass on `main`. Railway's dashboard changes over time, so if a menu name differs, look for the closest match.

1. In Railway, create a new template project.
2. Add a service from the GitHub repo `Yassinos-coder/watchdog`. Name it `Watchdog`.
3. Add a **PostgreSQL** service from Railway's database list. Keep its name as `Postgres`.
4. On the `Watchdog` service open **Variables, RAW Editor** and paste:

::: v-pre
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
WATCHDOG_SECRET_KEY=${{secret(64, "abcdef0123456789")}}
TRUST_PROXY=1
SETUP_TOKEN=${{secret(32)}}
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```
:::

If the editor rejects the empty values, remove the `SMTP_` lines. The app runs without them.

5. Add descriptions, for example to `SMTP_HOST`: "Optional: your mail server, used for invites and email codes", and to `SETUP_TOKEN`: "Needed once to create the owner account".
6. Enable a public domain for the `Watchdog` service.
7. Click **Publish to Marketplace** and fill in the listing.

### Check it works

After publishing, deploy it into a throwaway project and verify:

1. The deploy goes green and the health check at `/api/health/live` passes.
2. The generated domain opens the setup screen.
3. Creating the owner with the `SETUP_TOKEN` variable works.
4. Opening **Projects**, creating a project and sending a test error from an SDK shows an issue.

Then delete the throwaway project.
