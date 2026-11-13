# Deploy to Railway

Watchdog runs on Railway as two services: Watchdog itself (built from the repo's Dockerfile) and PostgreSQL. The repo's `railway.json` sets the Dockerfile build, the health check at `/api/health/live` and the restart policy.

## One click

Use the Watchdog template from the README. It creates:

| Service | Source | Notes |
| --- | --- | --- |
| `Watchdog` | this repository, `docker/Dockerfile` | Public domain, health check at `/api/health/live` |
| `Postgres` | Railway PostgreSQL | Provides `DATABASE_URL` |

Everything is filled in for you, including the public domain and a generated `WATCHDOG_SECRET_KEY`. `APP_URL` is detected from the Railway domain. If you add a custom domain later, follow [Moving to a custom domain](#moving-to-a-custom-domain) below.

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

## Moving to a custom domain

`APP_URL` is detected from the generated Railway domain until you set it yourself, and Watchdog does not follow a domain change on its own. Passkeys, invite links, OAuth callbacks and every DSN depend on it, so change it in this order:

1. **Add the domain** to the `Watchdog` service under **Networking, Custom Domain**, and create the DNS record Railway shows you. Wait until Railway reports the domain as active.
2. **Set `APP_URL`** on the `Watchdog` service to the new origin, for example `https://watchdog.example.com` (no path, no trailing slash), and redeploy. Do this **before** you register any passkey on the new domain.
3. **Check your recovery codes.** Passkeys are bound to the host they were created on, so passkeys made on the old Railway domain stop working on the new one. Make sure you still have a recovery code, an authenticator app or email codes. Under **Security** you can make new recovery codes.
4. **Open the new domain** and sign in with another method, then add a new passkey under **Security**. Remove the old ones.
5. **Update the DSN host in every app** that reports to Watchdog. A DSN contains the host (`https://<key>@watchdog.example.com/<project-id>`), so apps keep sending to the old address until their variable is changed. The variable name depends on your app, for example `WATCHDOG_DSN`, `VITE_WATCHDOG_DSN` or `NEXT_PUBLIC_WATCHDOG_DSN`. Redeploy or rebuild each app, because front-end apps bake the DSN into their bundle.
6. **Remove the old Railway domain** once nothing uses it anymore.

If you forget step 2, Watchdog tells you. The server logs a warning, the **Security** page and the passkey dialog show a banner naming both addresses, and adding a passkey fails with a message saying which `APP_URL` to set.

## Blocked by the shield (temporary IP ban)

Watchdog uses [nestjs-shield](https://github.com/Yassinos-coder/nestjs-shield) to rate limit requests. An address that keeps being rejected (default: 10 rejections within a minute) is blocked for 5 minutes, and the block doubles on every repeat, up to a day. That can include your own address, for example after a burst of failed requests from a broken script or a misconfigured proxy. While blocked, the app shows "Access temporarily blocked" with the time left.

Behind Railway, set `TRUST_PROXY=1` (the template does). Without it every visitor shares the proxy address and one bad client blocks everyone.

To recover:

- **Wait.** The message says how long. The block ends by itself.
- **Restart the service** on Railway. Blocks are held in memory, so a restart clears them. If `REDIS_URL` is set, blocks are stored there and survive restarts: restart or clear Redis instead.
- **Use the shield dashboard.** Set `SHIELD_DASH=true`, `SHIELD_ADMIN_USER` and `SHIELD_ADMIN_PASSWORD`, redeploy, and open `/api/shield/admin`. It lists blocked addresses and lets you lift them. The dashboard is exempt from the shield, so it stays reachable. Turn it off again when you are done.

To tune it, set `SHIELD_AUTOBAN_THRESHOLD`, `SHIELD_AUTOBAN_WINDOW` and `SHIELD_AUTOBAN_DURATION` (milliseconds), or list trusted addresses in `SHIELD_WHITELIST` (comma-separated IPs or CIDR ranges, for example `203.0.113.7,198.51.100.0/24`). Whitelisted addresses skip every check, so only list addresses you control.

## Telling your channels about restarts

Watchdog sends a message to your alert channels when it is about to stop and again when it is back. Railway only waits 0 seconds after asking a service to stop by default, so the template sets this variable on the Watchdog service. If you deployed another way, add it yourself or the first message may not leave in time:

```
RAILWAY_DEPLOYMENT_DRAINING_SECONDS=10
```

See [Restart notices](alerts/overview.md#restart-notices).

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
