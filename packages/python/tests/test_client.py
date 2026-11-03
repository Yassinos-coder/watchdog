from __future__ import annotations

import re

import pytest

import watchdog_sdk
from watchdog_sdk.dsn import parse_dsn

from .conftest import DSN, FakeTransport


def boom(value: int) -> None:
    raise ValueError(f"bad value {value}")


def test_parse_dsn_reads_key_host_and_project() -> None:
    parsed = parse_dsn(DSN)

    assert parsed.public_key == "key123"
    assert parsed.origin == "https://watchdog.test"
    assert parsed.endpoint("events") == "https://watchdog.test/api/ingest/v1/11111111-1111-4111-8111-111111111111/events"


@pytest.mark.parametrize("bad", ["", "nope", "https://watchdog.test/abc", "https://key@watchdog.test/not-a-project", "ftp://key@watchdog.test/11111111-1111-4111-8111-111111111111"])
def test_parse_dsn_rejects_bad_values(bad: str) -> None:
    with pytest.raises(ValueError):
        parse_dsn(bad)


def test_init_with_a_bad_dsn_never_raises() -> None:
    assert watchdog_sdk.init("not a dsn") is None
    assert watchdog_sdk.capture_message("ignored") is None


def test_capture_exception_builds_a_full_event(client, transport: FakeTransport) -> None:
    client.scope.user = {"id": "u1"}
    client.add_breadcrumb("clicked pay", category="ui")
    try:
        boom(7)
    except ValueError as error:
        event_id = client.capture_exception(error, tags={"call": "c1"})

    event = transport.of("events")[0]
    assert event["eventId"] == event_id
    assert event["platform"] == "python"
    assert event["level"] == "error"
    assert event["release"] == "1.2.3"
    assert event["environment"] == "test"
    assert event["message"] == "ValueError: bad value 7"
    assert event["exception"]["type"] == "ValueError"
    assert event["exception"]["handled"] is True
    assert event["tags"]["call"] == "c1"
    assert event["user"] == {"id": "u1"}
    assert event["breadcrumbs"][0]["message"] == "clicked pay"
    assert event["sdk"]["name"] == "watchdog.python"
    assert "python" in event["contexts"]["runtime"]["name"].lower() or event["contexts"]["runtime"]["name"]


def test_frames_are_oldest_first_with_code_context_and_no_variables(client, transport: FakeTransport) -> None:
    local_secret = "never-sent-as-a-variable"  # noqa: F841
    try:
        boom(1)
    except ValueError as error:
        client.capture_exception(error)

    frames = transport.of("events")[0]["exception"]["stacktrace"]["frames"]
    assert [frame["function"] for frame in frames][-2:] == ["test_frames_are_oldest_first_with_code_context_and_no_variables", "boom"]
    top = frames[-1]
    assert top["contextLine"].strip() == 'raise ValueError(f"bad value {value}")'
    assert top["inApp"] is True
    assert top["lineno"] > 0
    allowed = {"filename", "function", "lineno", "inApp", "contextLine", "preContext", "postContext"}
    assert all(set(frame) <= allowed for frame in frames)


def test_chained_exceptions_are_summarised(client, transport: FakeTransport) -> None:
    try:
        try:
            boom(2)
        except ValueError as inner:
            raise RuntimeError("outer failure") from inner
    except RuntimeError as error:
        client.capture_exception(error)

    assert transport.of("events")[0]["extra"]["causes"] == ["ValueError: bad value 2"]


def test_capture_message_and_default_level(client, transport: FakeTransport) -> None:
    client.capture_message("hello", "warning")

    event = transport.of("events")[0]
    assert event["message"] == "hello"
    assert event["level"] == "warning"
    assert "exception" not in event


def test_sample_rate_zero_sends_nothing(transport: FakeTransport) -> None:
    created = watchdog_sdk.init(DSN, sample_rate=0, transport=transport, uncaught_exceptions=False, logging_integration_enabled=False)
    created.capture_message("dropped")

    assert transport.sent == []


def test_before_send_can_edit_or_drop(transport: FakeTransport) -> None:
    def hook(event):
        if "drop" in event["message"]:
            return None
        event["tags"]["edited"] = "yes"
        return event

    created = watchdog_sdk.init(DSN, before_send=hook, transport=transport, uncaught_exceptions=False, logging_integration_enabled=False)
    created.capture_message("drop me")
    created.capture_message("keep me")

    assert [payload["tags"].get("edited") for payload in transport.of("events")] == ["yes"]


def test_ignore_errors_accepts_text_regex_and_classes(transport: FakeTransport) -> None:
    created = watchdog_sdk.init(DSN, ignore_errors=["noisy", re.compile(r"timeout \d+"), KeyError], transport=transport, uncaught_exceptions=False, logging_integration_enabled=False)
    created.capture_message("a noisy thing")
    created.capture_message("timeout 30")
    created.capture_exception(KeyError("k"))
    created.capture_message("kept")

    assert [payload["message"] for payload in transport.of("events")] == ["kept"]


def test_duplicates_within_two_seconds_are_dropped(client, transport: FakeTransport) -> None:
    for _ in range(3):
        client.capture_message("same")

    assert len(transport.of("events")) == 1


def test_events_per_minute_are_capped(transport: FakeTransport) -> None:
    created = watchdog_sdk.init(DSN, max_events_per_minute=3, transport=transport, uncaught_exceptions=False, logging_integration_enabled=False)
    for index in range(10):
        created.capture_message(f"message {index}")

    assert len(transport.of("events")) == 3


def test_breadcrumbs_are_capped(transport: FakeTransport) -> None:
    created = watchdog_sdk.init(DSN, max_breadcrumbs=5, transport=transport, uncaught_exceptions=False, logging_integration_enabled=False)
    for index in range(20):
        created.add_breadcrumb(f"step {index}")
    created.capture_message("done")

    crumbs = transport.of("events")[0]["breadcrumbs"]
    assert [crumb["message"] for crumb in crumbs] == [f"step {index}" for index in range(15, 20)]


def test_module_helpers_are_safe_before_init() -> None:
    watchdog_sdk.close(timeout=0)

    assert watchdog_sdk.capture_exception(ValueError("x")) is None
    watchdog_sdk.add_breadcrumb("nothing")
    watchdog_sdk.increment("nothing")
    with watchdog_sdk.start_transaction("noop") as transaction:
        with watchdog_sdk.span("db"):
            transaction.set_tag("a", "b")
