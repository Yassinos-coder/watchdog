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

Open **Dashboards** in a project. Every project starts with an **Overview** dashboard showing errors, requests, response time (p95) and average response time, so there is something to look at before you build anything. It is a normal dashboard: add widgets to it, or create your own and delete Overview when you do not need it. Overview is created once and does not come back after you delete it.

**Add widget** opens a gallery of cards. Each card previews the chart with your own data when you have it, and with example data when you do not yet. Pick a card, adjust it if you like, and add it. You can build widgets from a metric, from transactions, or from errors.

- **Aggregation**: average, sum, min, max, count, p50, p95, p99, or **rate per second**. For metrics the rate is the sum divided by the time covered, which suits counters such as `calls.started`. For transactions it is throughput, the number of transactions per second.
- **Errors** can be counted or shown as a rate. They cannot be split or filtered by tag.
- **Display**: line chart, bar chart, single number, or a table.
- **Split by tag**: draw one line, stacked bar or table row per value of a tag, for example calls per minute split by `tier` or `language`. The eight largest values are shown, and metrics without that tag appear as `(none)`.
- **Only where tag**: limit the widget to metrics or transactions whose tag has one value, for example `tier=pro`.

The tag lists in the widget dialog come from the last 7 days of data, so send the metric once before you build the widget.

## Long ranges and rollups

Every hour, Watchdog summarizes each metric into one row per tag combination, holding its count, sum, minimum, maximum, p50, p95 and p99. The 7, 30 and 90 day ranges read these summaries instead of the raw data points, so dashboards stay fast as volume grows. The last two hours are recalculated every five minutes, so recent hours are accurate.

- Count, sum, minimum, maximum, average and rate are exact.
- Percentiles on the 7, 30 and 90 day ranges are approximate: the percentiles of each hour are averaged, weighted by how many points the hour had.
- Summaries are kept for 400 days by default, much longer than the raw points. See [Data retention](retention.md).
- Transaction charts always use the raw data, so they stop at `RETENTION_PERFORMANCE_DAYS`.

## Ingest API

`POST /api/ingest/v1/<project-id>/transactions` and `/metrics` with the `x-watchdog-key` header. Metrics bodies look like `{ "metrics": [{ "name": "x", "value": 1, "type": "counter" }] }`, up to 500 per request.
