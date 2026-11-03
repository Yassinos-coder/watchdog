---
title: Python SDK
description: Report errors, performance traces and metrics from Python apps and workers to your self-hosted Watchdog server, with no dependencies and no blocking.
---

# Python SDK

`watchdog-sdk` reports unhandled exceptions, logged errors, performance traces and custom metrics from Python apps. It has no dependencies, sends in a background thread so it never blocks your code, and works with threads, asyncio and multi-process workers. It supports Python 3.9 and newer.

```bash
pip install watchdog-sdk
# or
uv add watchdog-sdk
```

```python
import watchdog_sdk as watchdog

watchdog.init(
    dsn="https://<key>@your-watchdog.example.com/<project-id>",
    release="1.0.0",
    environment="production",
)
```

Call `init` once, as early as possible. If the DSN is missing or invalid, the SDK logs a warning and stays off. It never raises, so a configuration mistake cannot stop your app from starting.

## What is captured

- **Unhandled exceptions**, in the main thread and in other threads, with the failing line of code and the lines around it. Local variables are never sent.
- **Logged errors:** `logger.error(...)` and `logger.exception(...)` become issues. Lower-level logs become breadcrumbs, but only for what your app already logs, so turning Watchdog on never changes your log output.
- **Anything you report** with `watchdog.capture_exception(error)` or `watchdog.capture_message("text")`.
- **Asyncio errors** that nobody awaited, after `watchdog.install_asyncio_handler()`.

Paths are shown relative to the directory your app runs in, and library code is marked as not part of your app.

## Tracing

A transaction is one unit of work. Spans are the steps inside it.

```python
with watchdog.start_transaction("handle_call", op="job") as transaction:
    transaction.set_tag("org", "acme")

    with watchdog.span("db", "load agent config"):
        config = load_config()

    async with watchdog.span("llm", "first response"):   # works in async code too
        reply = await ask_model(prompt)
```

Decorate a function to trace it. Inside a transaction it becomes a span, otherwise it starts its own transaction:

```python
@watchdog.trace(op="task")
async def transcribe(audio): ...
```

A failing block marks its span and transaction as failed. Transactions you do not sample cost almost nothing, because the `with` blocks become no-ops. Set `traces_sample_rate` below `1.0` on busy workers.

## Metrics

```python
watchdog.increment("calls.completed")
watchdog.gauge("calls.active", 3)
watchdog.distribution("call.duration", 184.2, unit="s", tags={"agent": "support"})
```

Metrics are batched and sent every few seconds.

## Workers and long-running processes

- **Multi-process workers** (such as LiveKit Agents, Celery or gunicorn): call `init` in each process, for example at import time of the module the worker loads. The sender restarts itself safely after a fork.
- **Asyncio apps:** call `watchdog.install_asyncio_handler()` once the loop is running, for example at the start of your entry point.
- **Shutdown:** the SDK flushes when the process exits normally or on an unhandled exception. In a custom shutdown path, call `watchdog.flush()`.

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `release`, `environment` | none | Group and filter events |
| `sample_rate` | `1.0` | Share of errors to send |
| `traces_sample_rate` | `1.0` | Share of transactions to send |
| `max_events_per_minute` | `60` | Hard cap on errors sent per minute |
| `max_transactions_per_minute` | `300` | Hard cap on transactions sent per minute |
| `ignore_errors` | none | Messages (text or regex) or exception classes to skip |
| `before_send` | none | Edit an event, or return `None` to drop it |
| `tags` | none | Tags added to every event |
| `uncaught_exceptions` | `True` | Hook `sys.excepthook` and `threading.excepthook` |
| `logging_integration_enabled` | `True` | Report logged errors and keep breadcrumbs |
| `event_log_level` | `logging.ERROR` | Lowest log level that becomes an issue |
| `breadcrumb_log_level` | `logging.INFO` | Lowest log level kept as a breadcrumb |
| `debug` | `False` | Log why events are dropped |

## Performance impact

Sending happens on a background thread with a small bounded queue. If the Watchdog server is slow or down, events are retried with backoff and the oldest are dropped when the queue fills, and your code never waits. See [Performance impact](/sdk-overhead) for the other SDKs.
