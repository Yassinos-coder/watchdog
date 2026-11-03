from __future__ import annotations

import asyncio
import logging
import sys
import threading

import watchdog_sdk

from .conftest import DSN, FakeTransport


def test_logged_errors_become_events_and_info_becomes_breadcrumbs(transport: FakeTransport) -> None:
    watchdog_sdk.init(DSN, transport=transport, uncaught_exceptions=False)
    logger = logging.getLogger("voice.calls")
    previous = logging.getLogger().level
    logging.getLogger().setLevel(logging.INFO)
    try:
        logger.info("call started")
        logger.debug("too quiet")
        try:
            raise ValueError("stt failed")
        except ValueError:
            logger.exception("call crashed")
        logger.error("plain error message")
    finally:
        logging.getLogger().setLevel(previous)

    events = transport.of("events")
    assert [event["message"] for event in events] == ["ValueError: stt failed", "plain error message"]
    assert events[0]["tags"]["logger"] == "voice.calls"
    assert events[0]["exception"]["type"] == "ValueError"
    assert events[1]["level"] == "error"
    messages = [crumb["message"] for crumb in events[1]["breadcrumbs"]]
    assert "call started" in messages
    assert "too quiet" not in messages


def test_the_sdk_ignores_its_own_logs(transport: FakeTransport) -> None:
    watchdog_sdk.init(DSN, transport=transport, uncaught_exceptions=False)

    logging.getLogger("watchdog_sdk").error("internal problem")

    assert transport.of("events") == []


def test_logging_integration_does_not_change_the_root_level(transport: FakeTransport) -> None:
    root = logging.getLogger()
    before = root.level

    watchdog_sdk.init(DSN, transport=transport, uncaught_exceptions=False)

    assert root.level == before


def test_excepthook_reports_fatal_and_calls_the_original(transport: FakeTransport) -> None:
    called = []
    original = sys.excepthook
    sys.excepthook = lambda *args: called.append(args)
    try:
        watchdog_sdk.init(DSN, transport=transport, logging_integration_enabled=False)
        try:
            raise RuntimeError("worker crashed")
        except RuntimeError:
            sys.excepthook(*sys.exc_info())
        watchdog_sdk.close(timeout=0)
        assert sys.excepthook is not None
    finally:
        sys.excepthook = original

    event = transport.of("events")[0]
    assert event["level"] == "fatal"
    assert event["exception"]["handled"] is False
    assert event["tags"]["mechanism"] == "sys.excepthook"
    assert len(called) == 1


def test_close_restores_the_original_hooks(transport: FakeTransport) -> None:
    original_hook = sys.excepthook
    original_thread_hook = threading.excepthook

    watchdog_sdk.init(DSN, transport=transport, logging_integration_enabled=False)
    assert sys.excepthook is not original_hook
    watchdog_sdk.close(timeout=0)

    assert sys.excepthook is original_hook
    assert threading.excepthook is original_thread_hook


def test_thread_exceptions_are_reported(transport: FakeTransport) -> None:
    watchdog_sdk.init(DSN, transport=transport, logging_integration_enabled=False)
    errors = []
    previous = threading.excepthook

    def run() -> None:
        raise KeyError("in thread")

    try:
        threading.excepthook = lambda args: errors.append(args)
        watchdog_sdk.close(timeout=0)
        watchdog_sdk.init(DSN, transport=transport, logging_integration_enabled=False)
        thread = threading.Thread(target=run)
        thread.start()
        thread.join()
    finally:
        threading.excepthook = previous

    events = transport.of("events")
    assert events and events[0]["tags"]["mechanism"] == "threading.excepthook"


def test_asyncio_errors_are_reported_and_still_handled(transport: FakeTransport) -> None:
    handled = []

    async def main() -> None:
        loop = asyncio.get_running_loop()
        loop.set_exception_handler(lambda current, context: handled.append(context))
        watchdog_sdk.init(DSN, transport=transport, uncaught_exceptions=False, logging_integration_enabled=False)
        watchdog_sdk.install_asyncio_handler()

        async def failing() -> None:
            raise OSError("socket closed")

        task = asyncio.create_task(failing())
        await asyncio.sleep(0.01)
        del task
        import gc

        gc.collect()
        await asyncio.sleep(0.01)

    asyncio.run(main())

    events = transport.of("events")
    assert events and events[0]["tags"]["mechanism"] == "asyncio"
    assert handled
