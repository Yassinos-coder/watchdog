# Tracing and metrics

## Transactions and spans

A transaction is one unit of work, such as an HTTP request or a background job. Spans are the steps inside it.

```ts
import { startTransaction } from '@watchdog-sdk/node';

const transaction = startTransaction({ name: 'GET /orders', op: 'http.server' });
const span = transaction.startSpan('db', 'SELECT orders');
// ... run the query
span.finish();
transaction.finish();
```

Watchdog shows, per transaction name, the count, average, p50, p95, maximum and failure rate, plus a waterfall of spans for each sample. Set `tracesSampleRate` (0 to 1) in `init` to sample.

## Custom metrics

```ts
import { increment, gauge, distribution } from '@watchdog-sdk/node';

increment('checkout.completed');
gauge('queue.depth', 12);
distribution('cart.value', 42.5, { unit: 'usd', tags: { plan: 'pro' } });
```

Metric names start with a letter and may contain letters, digits, `_`, `.`, `-` and `/`. Metrics are batched and sent every few seconds.

## Dashboards

Open **Dashboards** in a project to build widgets from a metric or from transactions, with an aggregation (average, sum, min, max, count, p50, p95, p99) and a line, bar or number display.

## Ingest API

`POST /api/ingest/v1/<project-id>/transactions` and `/metrics` with the `x-watchdog-key` header. Metrics bodies look like `{ "metrics": [{ "name": "x", "value": 1, "type": "counter" }] }`, up to 500 per request.
