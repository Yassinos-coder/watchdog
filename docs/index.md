---
layout: home
title: 'Watchdog: open-source Sentry alternative, self-hosted error tracking'
titleTemplate: false
description: Watchdog is an open-source, self-hosted Sentry alternative with error tracking, performance tracing and session replay for web, Node.js, Python and React Native apps. One container plus PostgreSQL, deployed on Railway in a click.

hero:
  name: Watchdog
  text: Open-source error tracking you host yourself
  tagline: A lightweight Sentry alternative. Errors, performance tracing and session replay in one container plus PostgreSQL. Your data stays on your own infrastructure. And you can set it up by just asking Claude.
  image:
    src: /logo.svg
    alt: Watchdog logo
  actions:
    - theme: brand
      text: Deploy on Railway
      link: 'https://railway.com/deploy/watch-dog?referralCode=TMZSr0&utm_medium=integration&utm_source=template&utm_campaign=generic'
    - theme: alt
      text: Get started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/Yassinos-coder/watchdog

features:
  - icon: 🐞
    title: Error tracking
    details: Errors are grouped into issues automatically, with a resolved and ignored workflow and regression detection when a fixed bug returns.
  - icon: 🔎
    title: Readable stack traces
    details: Upload source maps and see your original file, line and the code around every frame instead of minified bundles.
  - icon: ⚡
    title: Performance tracing
    details: Transactions, spans, custom metrics and dashboards show which endpoints are slow and where the time goes, with percentiles, rates and charts split by tag. Hourly rollups keep long ranges fast.
  - icon: 🎬
    title: Session replay
    details: Watch what users did before an error, with inputs masked by default and the replay linked to the issue it caused.
  - icon: 🔔
    title: Alerts where you work
    details: Get notified in Slack, Discord, Telegram or email when a new issue appears, a fixed one comes back, errors spike, or a metric crosses a threshold. Watchdog also tells you when it restarts and which apps are sending data again.
  - icon: 🤖
    title: Set up by your AI assistant
    details: Tell Claude "set up Watchdog in this repo" and it creates the project, installs the SDK and writes the keys to your .env through MCP. Later, ask it to read the latest issue, find the line of code behind it and fix it. Webhooks send signed events to your own tools.
  - icon: 📱
    title: SDKs for your stack
    details: Browser, React, Node.js and NestJS, Python, and React Native and Expo. All open source and published on npm and PyPI.
  - icon: 👥
    title: Teams and secure sign-in
    details: Invite teammates with owner, admin and member roles, require two-step verification, and sign in with Google or GitHub.
  - icon: 🐳
    title: One container, one database
    details: A single Docker image plus PostgreSQL. No Kafka, no ClickHouse. Runs on Railway, a VPS or your own cluster.
---

## See it

![A Watchdog issue showing the failing line of code and the stack trace](/screenshots/error-detail.png)

| | |
| --- | --- |
| ![Original code from source maps](/screenshots/source-maps.png) | ![Performance with p50 and p95](/screenshots/performance.png) |
| **Original code** from your source maps | **Performance** with p50 and p95 |
| ![Dashboards for your own metrics](/screenshots/dashboards.png) | ![Session replay with masked inputs](/screenshots/session-replay.png) |
| **Dashboards** for your own metrics | **Session replay**, inputs masked |

These are screenshots of a demo storefront with sample data.

## Why Watchdog

Most teams want to know when their app breaks and why, without sending customer data to a third party or running a dozen services to do it. Watchdog is a small, open-source error tracker you can read, change and run yourself.

- **Free and MIT licensed.** No per-event pricing and no account with anyone but yourself.
- **Small to run.** One application container and PostgreSQL. Redis is optional.
- **Everything in one place.** Errors, traces, metrics and session replays share the same projects, releases and alerts.
- **Honest about its limits.** It is an early project and does not try to be everything. See [Watchdog vs Sentry](/sentry-alternative) for what it does and does not do.

## Deploy it

The fastest way is the Railway template. It creates the app and a PostgreSQL database, generates the secrets and gives you a public address.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/watch-dog?referralCode=TMZSr0&utm_medium=integration&utm_source=template&utm_campaign=generic)

Prefer your own server? Clone the repository and run it with Docker:

```bash
git clone https://github.com/Yassinos-coder/watchdog.git
cd watchdog
cp .env.example .env
docker compose --profile app up -d
```

See [Getting started](/getting-started) for the full walkthrough.

## What to expect

Watchdog is self-hosted, so it takes a little setup, and you run it. It is not a sign-up-and-go service. A first setup usually takes 15 to 30 minutes:

1. **Deploy** the app and its database. On Railway this is one click, and the build takes a few minutes.
2. **Create the owner account** with the setup token, then add two-step verification.
3. **Create a project** in the dashboard and copy its DSN.
4. **Add an SDK** to your app and set the DSN as an environment variable.

Two things are worth doing early: upload **source maps** so stack traces show your original code, and add **email (SMTP)** if you want team invites and email sign-in codes. Sign-in with Google or GitHub is optional.

Because it is your server, you are also responsible for keeping it updated and for backing up the database and the `WATCHDOG_SECRET_KEY`. The [configuration guide](/configuration) lists every environment variable. If you would rather not run anything yourself, a hosted service may suit you better.

## Send your first error

Create a project in the dashboard, copy its DSN, and add an SDK:

```bash
npm install @watchdog-sdk/browser
```

```ts
import { init } from '@watchdog-sdk/browser';

init({
  dsn: 'https://<key>@your-watchdog.example.com/<project-id>',
  release: '1.0.0',
});
```

Packages for [React](/getting-started), Node.js and NestJS, and [React Native and Expo](/react-native) work the same way.

## Frequently asked questions

### Is Watchdog a Sentry alternative?

Yes. It covers the parts most teams use every day: error tracking and grouping, source maps, performance tracing, session replay and alerts. It uses its own open-source SDKs rather than Sentry's, so you add Watchdog's packages to your apps. The [comparison page](/sentry-alternative) lists what is and is not covered.

### Can I self-host Watchdog for free?

Yes. Watchdog is MIT licensed and has no paid tier. You pay only for the server and database you run it on.

### What do I need to run it?

A PostgreSQL database and one container built from the repository's Dockerfile, plus a secret key. On Railway the template sets all of that up for you.

### How hard is it to set up?

Not hard, but not zero. You deploy two services, create an account, and put one environment variable in each app you want to monitor. Source maps and email are extra steps you may want. [What to expect](#what-to-expect) walks through it.

### Does it work for mobile apps?

Yes, for JavaScript errors in React Native and Expo apps. Crashes inside native code are not captured, because the SDK runs in JavaScript.

### Where does my data go?

Only to the Watchdog server you run. Nothing is sent to us. The dashboard can check npm for a newer version, which you can turn off with `UPDATE_CHECK=false`.
