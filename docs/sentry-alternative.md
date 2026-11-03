---
title: Watchdog vs Sentry
description: How Watchdog compares with Sentry as an open-source, self-hosted error tracking tool. What it covers, what it does not, and when to choose each.
---

# Watchdog vs Sentry

Watchdog is an open-source, self-hosted error tracker for teams who want the everyday parts of tools like Sentry on their own infrastructure, with a much smaller thing to run. This page is an honest comparison, including where Watchdog falls short.

## The short version

|  | Watchdog | Sentry |
| --- | --- | --- |
| How you use it | Self-hosted only | Hosted service, or self-hosted |
| License | MIT, open source | Functional Source License (source-available) |
| What you run | One container and PostgreSQL | A larger stack of services when self-hosted |
| Error tracking and grouping | Yes | Yes |
| Source maps | Yes | Yes |
| Performance tracing and metrics | Yes, with dashboards | Yes |
| Session replay | Yes | Yes |
| Alerts | Slack, Discord, Telegram, email | Many integrations |
| Mobile | React Native and Expo (JavaScript errors) | Native iOS and Android, and more |
| SDK languages | JavaScript and TypeScript | Many languages |
| Maturity | Early (version 0.x) | Established |

## Where Watchdog fits

- You want your error data to stay on your own servers.
- You prefer a small stack that one person can run and understand.
- Your apps are JavaScript or TypeScript: browser, React, Node.js, NestJS, React Native or Expo.
- You want to read and change the code that monitors your code.

## Where Sentry is the better choice

- You need native crash reporting for iOS or Android, or SDKs for languages other than JavaScript.
- You want a managed service and do not want to run anything.
- You rely on integrations and features Watchdog does not have yet, such as issue assignment, ticketing integrations, profiling or cron monitoring.
- You need a long track record and a large ecosystem.

## Switching or trying it alongside

Watchdog uses its own SDKs, not Sentry's, so you add Watchdog's packages to your apps instead of changing a DSN. You can run both at once while you compare them.

```bash
npm install @watchdog-sdk/browser
```

```ts
import { init } from '@watchdog-sdk/browser';

init({ dsn: 'https://<key>@your-watchdog.example.com/<project-id>', release: '1.0.0' });
```

## Try it

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/watch-dog?referralCode=TMZSr0&utm_medium=integration&utm_source=template&utm_campaign=generic)

Or follow [Getting started](/getting-started) to run it with Docker. If you find something missing, [open an issue](https://github.com/Yassinos-coder/watchdog/issues). Early users shape what gets built next.
