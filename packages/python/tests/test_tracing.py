from __future__ import annotations

import asyncio
from typing import Any

import pytest

import watchdog_sdk
from watchdog_sdk.tracing import NOOP_TRANSACTION

from .conftest import DSN, FakeTransport


def test_transaction_with_nested_spans(client, transport: FakeTransport) -> None:
    with client.start_transaction("handle_call", "job", tags={"org": "acme"}) as transaction:
        with transaction.span("db", "load config") as outer:
            with watchdog_sdk.span("cache", "get agent") as inner:
                pass

    payload = transport.of("transactions")[0]
    assert payload["name"] == "handle_call"
    assert payload["op"] == "job"
    assert payload["status"] == "ok"
    assert payload["tags"]["org"] == "acme"
    assert payload["release"] == "1.2.3"
    assert payload["durationMs"] >= 0
    spans = {span["op"]: span for span in payload["spans"]}
    assert spans["cache"]["parentSpanId"] == spans["db"]["spanId"]
    assert "parentSpanId" not in spans["db"]
    assert spans["db"]["description"] == "load config"
    assert outer.span_id and inner.span_id


def test_an_exception_marks_the_transaction_and_span_as_failed(client, transport: FakeTransport) -> None:
    with pytest.raises(RuntimeError):
        with client.start_transaction("fails"):
            with watchdog_sdk.span("http", "call upstream"):
                raise RuntimeError("upstream down")

    payload = transport.of("transactions")[0]
    assert payload["status"] == "internal_error"
    assert payload["spans"][0]["status"] == "internal_error"


def test_unsampled_transactions_are_free_no_ops(transport: FakeTransport) -> None:
    created = watchdog_sdk.init(DSN, traces_sample_rate=0, transport=transport, uncaught_exceptions=False, logging_integration_enabled=False)

    transaction = created.start_transaction("skipped")
    assert transaction is NOOP_TRANSACTION
    with transaction:
        with watchdog_sdk.span("db"):
            pass

    assert transport.of("transactions") == []


def test_transactions_per_minute_are_capped(transport: FakeTransport) -> None:
    created = watchdog_sdk.init(DSN, max_transactions_per_minute=3, transport=transport, uncaught_exceptions=False, logging_integration_enabled=False)
    for index in range(10):
        with created.start_transaction(f"t{index}"):
            pass

    assert len(transport.of("transactions")) == 3


def test_trace_decorator_wraps_sync_and_async_functions(client, transport: FakeTransport) -> None:
    @watchdog_sdk.trace(op="task")
    def sync_work() -> int:
        return 1

    @watchdog_sdk.trace(op="task", name="async-work")
    async def async_work() -> int:
        await asyncio.sleep(0)
        return 2

    assert sync_work() == 1
    assert asyncio.run(async_work()) == 2

    names = [payload["name"] for payload in transport.of("transactions")]
    assert any(name.endswith("sync_work") for name in names)
    assert "async-work" in names


def test_trace_inside_a_transaction_becomes_a_span(client, transport: FakeTransport) -> None:
    @watchdog_sdk.trace(op="step")
    def inner() -> None:
        return None

    with client.start_transaction("outer"):
        inner()

    payload = transport.of("transactions")[0]
    assert payload["spans"][0]["op"] == "step"
    assert len(transport.of("transactions")) == 1


def test_spans_follow_asyncio_tasks(client, transport: FakeTransport) -> None:
    async def child(label: str) -> None:
        async with watchdog_sdk.span("work", label):
            await asyncio.sleep(0.001)

    async def main() -> None:
        async with client.start_transaction("async job"):
            await asyncio.gather(child("a"), child("b"))

    asyncio.run(main())

    spans = transport.of("transactions")[0]["spans"]
    assert sorted(span["description"] for span in spans) == ["a", "b"]


def test_metrics_are_batched_and_flushed(client, transport: FakeTransport) -> None:
    client.increment("calls.completed")
    client.gauge("calls.active", 3, tags={"region": "eu"})
    client.distribution("call.duration", 12.5, unit="s")
    client.gauge("ignored", float("nan"))
    client.increment("ignored", True)  # type: ignore[arg-type]
    client.flush()

    metrics = transport.of("metrics")[0]["metrics"]
    assert [metric["name"] for metric in metrics] == ["calls.completed", "calls.active", "call.duration"]
    assert metrics[1]["tags"]["region"] == "eu"
    assert metrics[2]["unit"] == "s"
    assert metrics[0]["type"] == "counter"
