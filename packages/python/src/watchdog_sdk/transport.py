from __future__ import annotations

import json
import logging
import os
import queue
import threading
import time
import urllib.error
import urllib.request
from typing import Any, Callable, Optional, Tuple

from .dsn import ParsedDsn

_log = logging.getLogger("watchdog_sdk")

MAX_QUEUE = 50
MAX_ATTEMPTS = 4
BASE_DELAY_S = 1.0
MAX_DELAY_S = 15.0
REQUEST_TIMEOUT_S = 5.0
DEFAULT_FLUSH_TIMEOUT_S = 2.0

Item = Tuple[str, Any]


def _encode(value: Any) -> bytes:
    return json.dumps(value, default=lambda item: repr(item)[:200], separators=(",", ":")).encode("utf-8")


class Transport:
    def __init__(self, dsn: ParsedDsn, on_debug: Callable[[str], None]) -> None:
        self._dsn = dsn
        self._debug = on_debug
        self._reset()

    def _reset(self) -> None:
        self._pid = os.getpid()
        self._queue: "queue.Queue[Item]" = queue.Queue(maxsize=MAX_QUEUE)
        self._pending = 0
        self._condition = threading.Condition()
        self._stop = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._blocked_until = 0.0

    def send(self, kind: str, payload: Any) -> None:
        if self._pid != os.getpid():
            self._reset()
        self._ensure_thread()
        with self._condition:
            if self._queue.full():
                try:
                    self._queue.get_nowait()
                    self._pending -= 1
                    self._debug("queue full, dropping the oldest event")
                except queue.Empty:
                    pass
            self._queue.put_nowait((kind, payload))
            self._pending += 1

    def flush(self, timeout: float = DEFAULT_FLUSH_TIMEOUT_S) -> bool:
        deadline = time.monotonic() + timeout
        with self._condition:
            while self._pending > 0:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    return False
                self._condition.wait(remaining)
        return True

    def close(self, timeout: float = DEFAULT_FLUSH_TIMEOUT_S) -> None:
        self.flush(timeout)
        self._stop.set()

    def _ensure_thread(self) -> None:
        if self._thread is not None and self._thread.is_alive():
            return
        self._thread = threading.Thread(target=self._run, name="watchdog-sdk-sender", daemon=True)
        self._thread.start()

    def _run(self) -> None:
        while not self._stop.is_set():
            try:
                kind, payload = self._queue.get(timeout=0.5)
            except queue.Empty:
                continue
            try:
                self._deliver(kind, payload)
            except Exception as error:  # pragma: no cover - the sender must never die
                self._debug(f"unexpected sender error: {error}")
            finally:
                with self._condition:
                    self._pending -= 1
                    self._condition.notify_all()

    def _deliver(self, kind: str, payload: Any) -> None:
        body = _encode(payload)
        for attempt in range(1, MAX_ATTEMPTS + 1):
            wait = self._blocked_until - time.monotonic()
            if wait > 0 and self._stop.wait(min(wait, MAX_DELAY_S)):
                return
            outcome = self._attempt(kind, body)
            if outcome == "done":
                return
            if attempt == MAX_ATTEMPTS:
                self._debug("giving up on an event after repeated failures")
                return
            delay = min(BASE_DELAY_S * (2 ** attempt), MAX_DELAY_S)
            self._blocked_until = max(self._blocked_until, time.monotonic() + delay)

    def _attempt(self, kind: str, body: bytes) -> str:
        request = urllib.request.Request(
            self._dsn.endpoint(kind),
            data=body,
            method="POST",
            headers={"content-type": "application/json", "x-watchdog-key": self._dsn.public_key, "user-agent": "watchdog-sdk-python"},
        )
        try:
            with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_S):
                return "done"
        except urllib.error.HTTPError as error:
            if error.code == 429 or error.code >= 500:
                retry_after = error.headers.get("retry-after") if error.headers else None
                if retry_after and retry_after.isdigit():
                    self._blocked_until = time.monotonic() + min(float(retry_after), MAX_DELAY_S)
                return "retry"
            self._debug(f"server rejected an event with status {error.code}")
            return "done"
        except Exception as error:
            self._debug(f"network error: {error}")
            return "retry"
