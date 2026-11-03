# watchdog-sdk (Python)

Python SDK for [Watchdog](https://github.com/Yassinos-coder/watchdog), the open-source, self-hosted error tracker. It reports unhandled exceptions, logged errors, performance traces and custom metrics to your own Watchdog server.

It has no dependencies, sends in a background thread so it never blocks your code, and works with asyncio, threads and multi-process workers.

```bash
pip install watchdog-sdk
# or
uv add watchdog-sdk
```

```python
import watchdog_sdk as watchdog

watchdog.init(
    dsn="https://<key>@your-watchdog-host/<project-id>",
    release="1.0.0",
    environment="production",
)
```

Call `init` once, as early as possible. If the DSN is missing or invalid, the SDK logs a warning and stays off. It never raises.

## What is captured

- Unhandled exceptions, including in threads, with the failing line of code and the lines around it. Local variables are never sent.
- Errors you log with `logging` (`logger.error(...)`, `logger.exception(...)`), plus lower-level logs as breadcrumbs.
- Exceptions you report yourself with `watchdog.capture_exception(error)`.
- Asyncio errors that nobody awaited, after `watchdog.install_asyncio_handler()`.

## Tracing and metrics

```python
with watchdog.start_transaction("handle_call", op="job") as transaction:
    transaction.set_tag("org", "acme")
    with watchdog.span("db", "load agent config"):
        ...

@watchdog.trace(op="task")
async def transcribe(audio): ...

watchdog.increment("calls.completed")
watchdog.gauge("calls.active", 3)
watchdog.distribution("call.duration", 184.2, unit="s")
```

Transactions you do not sample cost almost nothing: the `with` blocks become no-ops.

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `release`, `environment` | none | Group and filter events |
| `sample_rate` | `1.0` | Share of errors to send |
| `traces_sample_rate` | `1.0` | Share of transactions to send. Use a lower value on busy workers |
| `max_events_per_minute` | `60` | Hard cap on errors sent per minute |
| `max_transactions_per_minute` | `300` | Hard cap on transactions sent per minute |
| `ignore_errors` | none | Messages (text or regex) or exception classes to skip |
| `before_send` | none | Edit an event, or return `None` to drop it |
| `uncaught_exceptions` | `True` | Hook `sys.excepthook` and `threading.excepthook` |
| `logging_integration_enabled` | `True` | Report logged errors and keep breadcrumbs |
| `debug` | `False` | Log why events are dropped |

Documentation: https://yassinos-coder.github.io/watchdog/python
