---
title: Performance impact of the SDKs
description: How much the Watchdog SDKs add to your app's size and speed, what runs when, and the settings that keep the overhead low.
---

# Performance impact of the SDKs

A monitoring tool should not slow down the app it watches. This page says what the SDKs cost and how to keep that cost low.

## Size

| Package | Minified | Gzipped |
| --- | --- | --- |
| `@watchdog-sdk/browser` | about 16 KB | about 6 KB |
| `@watchdog-sdk/react-native` | about 15 KB | about 6 KB |

Session replay is an optional extra (`@rrweb/record`) loaded only when you turn replay on, so it is not in the numbers above.

## What runs, and when

- **At start-up:** the SDK reads the DSN, sets up a few listeners and wraps `fetch`, `XMLHttpRequest`, `console` and history. Nothing is sent and no timers run until something happens.
- **When an error happens:** it builds one event and sends it in the background. Repeats of the same error are dropped for a short time, and there is a per-minute cap, so an error loop cannot flood the network.
- **Breadcrumbs:** at most 100 are kept in memory. Console arguments are summarized to a short, bounded text, so logging a huge object costs microseconds, not milliseconds.
- **Sending:** one request at a time, with a small queue (the oldest event is dropped when it fills) and backoff when the server is slow or down. Sending never blocks your code.
- **Metrics:** batched and sent every few seconds. The timer does not keep a Node.js process alive.

## Settings that keep it light

| Setting | What it does |
| --- | --- |
| `sampleRate` | Share of errors to send (0 to 1). |
| `tracesSampleRate` | Share of transactions to send. On a busy server, use a low value such as `0.1`. |
| `maxTransactionsPerMinute` | Hard cap on transactions sent per minute. Default 300. |
| `maxEventsPerMinute` | Hard cap on errors sent per minute. |
| `replay.sampleRate` | Share of sessions recorded. Default 10%. Replay is the heaviest feature, so record only what you need. |
| `integrations` | Turn off breadcrumb sources you do not use, such as `console` or `network`. |

## Tips

- Keep `tracesSampleRate` low on high-traffic servers. Most of the value comes from a sample.
- Turn replay on for a small share of sessions, or only in production on pages where it helps.
- If you do not need request breadcrumbs, set `integrations: { network: false }`.
