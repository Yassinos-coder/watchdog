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

## Reading the colors

On the Performance page, durations and failure rates are colored so problems stand out. Each colored value also has an icon and a text label for screen readers, so color is never the only signal.

| Kind of work (op) | Slow (yellow) | Very slow (red) |
| --- | --- | --- |
| Web requests (`http.server`) | 500 ms or more | 1.5 s or more |
| Outgoing HTTP calls (`http`, `http.client`) | 800 ms or more | 3 s or more |
| Database (`db`, `db.query`) | 100 ms or more | 500 ms or more |
| Cache (`cache`) | 20 ms or more | 100 ms or more |
| User interface (`ui`) | 1 s or more | 3 s or more |

Failure rate: yellow from 1%, red from 5%.

Only the kinds of work above are colored. Jobs, calls and other long-running work, such as an operation of type `call` or `job`, have no single "normal" length, so they stay uncolored. Give a transaction or span one of the ops above if you want it judged against these limits.

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
