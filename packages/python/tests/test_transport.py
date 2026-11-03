from __future__ import annotations

import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Dict, List

import pytest

from watchdog_sdk import transport as transport_module
from watchdog_sdk.dsn import parse_dsn
from watchdog_sdk.transport import Transport


class Receiver:
    def __init__(self, statuses: List[int]) -> None:
        self.statuses = statuses
        self.requests: List[Dict[str, Any]] = []
        receiver = self

        class Handler(BaseHTTPRequestHandler):
            def do_POST(self) -> None:  # noqa: N802
                length = int(self.headers.get("content-length", 0))
                receiver.requests.append({"path": self.path, "key": self.headers.get("x-watchdog-key"), "body": json.loads(self.rfile.read(length))})
                status = receiver.statuses.pop(0) if receiver.statuses else 202
                self.send_response(status)
                self.end_headers()

            def log_message(self, *args: Any) -> None:
                return None

        self.server = HTTPServer(("127.0.0.1", 0), Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    @property
    def dsn(self) -> str:
        return f"http://key123@127.0.0.1:{self.server.server_port}/11111111-1111-4111-8111-111111111111"

    def stop(self) -> None:
        self.server.shutdown()


@pytest.fixture(autouse=True)
def fast_retries(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(transport_module, "BASE_DELAY_S", 0.01)
    monkeypatch.setattr(transport_module, "MAX_DELAY_S", 0.05)


def test_events_are_posted_with_the_key_and_flushed() -> None:
    receiver = Receiver([])
    sender = Transport(parse_dsn(receiver.dsn), lambda message: None)
    try:
        sender.send("events", {"message": "hello"})
        sender.send("metrics", {"metrics": []})

        assert sender.flush(3) is True
        assert [request["path"].rsplit("/", 1)[-1] for request in receiver.requests] == ["events", "metrics"]
        assert receiver.requests[0]["key"] == "key123"
        assert receiver.requests[0]["body"] == {"message": "hello"}
    finally:
        sender.close(0)
        receiver.stop()


def test_server_errors_are_retried_until_they_succeed() -> None:
    receiver = Receiver([503, 500])
    sender = Transport(parse_dsn(receiver.dsn), lambda message: None)
    try:
        sender.send("events", {"message": "retry me"})

        assert sender.flush(5) is True
        assert len(receiver.requests) == 3
    finally:
        sender.close(0)
        receiver.stop()


def test_client_errors_are_dropped_without_retrying() -> None:
    receiver = Receiver([401])
    debug: List[str] = []
    sender = Transport(parse_dsn(receiver.dsn), debug.append)
    try:
        sender.send("events", {"message": "unauthorized"})

        assert sender.flush(3) is True
        assert len(receiver.requests) == 1
        assert any("401" in message for message in debug)
    finally:
        sender.close(0)
        receiver.stop()


def test_giving_up_after_repeated_failures_does_not_block_forever() -> None:
    receiver = Receiver([500, 500, 500, 500, 500])
    sender = Transport(parse_dsn(receiver.dsn), lambda message: None)
    try:
        sender.send("events", {"message": "doomed"})

        assert sender.flush(5) is True
        assert len(receiver.requests) == 4
    finally:
        sender.close(0)
        receiver.stop()


def test_an_unreachable_server_never_raises_or_blocks_the_caller() -> None:
    sender = Transport(parse_dsn("http://key@127.0.0.1:9/11111111-1111-4111-8111-111111111111"), lambda message: None)
    try:
        sender.send("events", {"message": "nobody home"})

        assert sender.flush(0.01) in (True, False)
    finally:
        sender.close(0)


def test_the_queue_is_bounded_and_drops_the_oldest(monkeypatch: pytest.MonkeyPatch) -> None:
    receiver = Receiver([])
    sender = Transport(parse_dsn(receiver.dsn), lambda message: None)
    monkeypatch.setattr(sender, "_ensure_thread", lambda: None)
    try:
        for index in range(transport_module.MAX_QUEUE + 10):
            sender.send("events", {"n": index})

        assert sender._queue.qsize() == transport_module.MAX_QUEUE
        assert sender._queue.get_nowait()[1] == {"n": 10}
    finally:
        receiver.stop()
