from __future__ import annotations

import logging
import platform
import random
import re
import sys
import threading
import time
import uuid
from types import TracebackType
from typing import Any, Callable, Dict, List, Optional, Pattern, Sequence, Tuple, Union

from ._version import __version__
from .dsn import ParsedDsn, parse_dsn
from .metrics import MetricsBuffer
from .scope import Scope
from .stack import describe_causes, frames_from_traceback
from .tracing import NOOP_TRANSACTION, Transaction
from .transport import Transport

_log = logging.getLogger("watchdog_sdk")

SDK = {"name": "watchdog.python", "version": __version__}
DEFAULT_MAX_BREADCRUMBS = 100
DEFAULT_MAX_EVENTS_PER_MINUTE = 60
DEFAULT_MAX_TRANSACTIONS_PER_MINUTE = 300
DUPLICATE_WINDOW_S = 2.0
MINUTE_S = 60.0
MAX_MESSAGE_LENGTH = 1000

ExcInfo = Tuple[Optional[type], Optional[BaseException], Optional[TracebackType]]
IgnoreRule = Union[str, Pattern[str], type]


class WatchdogClient:
    def __init__(
        self,
        dsn: str,
        *,
        release: Optional[str] = None,
        environment: Optional[str] = None,
        sample_rate: float = 1.0,
        traces_sample_rate: float = 1.0,
        max_breadcrumbs: int = DEFAULT_MAX_BREADCRUMBS,
        max_events_per_minute: int = DEFAULT_MAX_EVENTS_PER_MINUTE,
        max_transactions_per_minute: int = DEFAULT_MAX_TRANSACTIONS_PER_MINUTE,
        ignore_errors: Sequence[IgnoreRule] = (),
        before_send: Optional[Callable[[Dict[str, Any]], Optional[Dict[str, Any]]]] = None,
        tags: Optional[Dict[str, str]] = None,
        enabled: bool = True,
        debug: bool = False,
        transport: Optional[Any] = None,
    ) -> None:
        self.dsn: ParsedDsn = parse_dsn(dsn)
        self.release = release
        self.environment = environment
        self.enabled = enabled
        self.debug = debug
        self._sample_rate = sample_rate
        self._traces_sample_rate = traces_sample_rate
        self._max_events = max_events_per_minute
        self._max_transactions = max_transactions_per_minute
        self._ignore_errors = tuple(ignore_errors)
        self._before_send = before_send
        self._lock = threading.Lock()
        self._recent: Optional[Tuple[str, float]] = None
        self._event_window = (time.monotonic(), 0)
        self._transaction_window = (time.monotonic(), 0)
        self.scope = Scope(max_breadcrumbs)
        self.scope.tags = dict(tags or {})
        self.scope.contexts = {
            "runtime": {"name": platform.python_implementation(), "version": platform.python_version()},
            "os": {"name": platform.system(), "version": platform.release()},
        }
        self._transport = transport if transport is not None else Transport(self.dsn, self._debug)
        self._metrics = MetricsBuffer(lambda batch: self._transport.send("metrics", {"metrics": batch}))

    def capture_exception(self, error: Optional[BaseException] = None, *, level: str = "error", handled: bool = True, tags: Optional[Dict[str, str]] = None, extra: Optional[Dict[str, Any]] = None, fingerprint: Optional[List[str]] = None) -> Optional[str]:
        exc_info: ExcInfo
        if error is None:
            exc_info = sys.exc_info()
            if exc_info[1] is None:
                return None
        else:
            exc_info = (type(error), error, error.__traceback__)
        return self.capture_exc_info(exc_info, level=level, handled=handled, tags=tags, extra=extra, fingerprint=fingerprint)

    def capture_exc_info(self, exc_info: ExcInfo, *, level: str = "error", handled: bool = True, tags: Optional[Dict[str, str]] = None, extra: Optional[Dict[str, Any]] = None, fingerprint: Optional[List[str]] = None) -> Optional[str]:
        _, error, traceback_object = exc_info
        if error is None:
            return None
        exception = {
            "type": type(error).__name__,
            "value": str(error)[:MAX_MESSAGE_LENGTH],
            "handled": handled,
            "stacktrace": {"frames": frames_from_traceback(traceback_object)},
        }
        merged_extra = dict(extra or {})
        causes = describe_causes(error)
        if causes:
            merged_extra["causes"] = causes
        return self._capture(f"{exception['type']}: {exception['value']}", exception, level, tags, merged_extra, fingerprint, error)

    def capture_message(self, message: str, level: str = "info", *, tags: Optional[Dict[str, str]] = None, extra: Optional[Dict[str, Any]] = None) -> Optional[str]:
        return self._capture(message[:MAX_MESSAGE_LENGTH], None, level, tags, dict(extra or {}), None, None)

    def add_breadcrumb(self, message: Optional[str] = None, *, category: Optional[str] = None, type: Optional[str] = None, level: Optional[str] = None, data: Optional[Dict[str, Any]] = None) -> None:
        crumb: Dict[str, Any] = {}
        if message is not None:
            crumb["message"] = message[:300]
        for key, value in (("category", category), ("type", type), ("level", level), ("data", data)):
            if value is not None:
                crumb[key] = value
        self.scope.add_breadcrumb(crumb)

    def start_transaction(self, name: str, op: str = "default", *, tags: Optional[Dict[str, Any]] = None) -> Any:
        if not self.enabled or not self._sampled(self._traces_sample_rate):
            return NOOP_TRANSACTION
        return Transaction(name, op, {**self.scope.tags, **(tags or {})}, self._emit_transaction)

    def increment(self, name: str, value: float = 1, *, unit: Optional[str] = None, tags: Optional[Dict[str, Any]] = None) -> None:
        self._track(name, value, "counter", unit, tags)

    def gauge(self, name: str, value: float, *, unit: Optional[str] = None, tags: Optional[Dict[str, Any]] = None) -> None:
        self._track(name, value, "gauge", unit, tags)

    def distribution(self, name: str, value: float, *, unit: Optional[str] = None, tags: Optional[Dict[str, Any]] = None) -> None:
        self._track(name, value, "distribution", unit, tags)

    def flush(self, timeout: float = 2.0) -> bool:
        self._metrics.flush()
        return self._transport.flush(timeout)

    def close(self, timeout: float = 2.0) -> None:
        self._metrics.flush()
        self._transport.close(timeout)

    def _track(self, name: str, value: float, kind: str, unit: Optional[str], tags: Optional[Dict[str, Any]]) -> None:
        if not self.enabled or isinstance(value, bool) or not isinstance(value, (int, float)) or value != value:
            return
        metric: Dict[str, Any] = {
            "name": name,
            "type": kind,
            "value": value,
            "tags": {**self.scope.tags, **{key: str(item) for key, item in (tags or {}).items()}},
            "release": self.release,
            "environment": self.environment,
            "timestamp": int(time.time() * 1000),
        }
        if unit:
            metric["unit"] = unit
        self._metrics.add(metric)

    def _emit_transaction(self, data: Dict[str, Any]) -> None:
        if not self.enabled or not self._within_limit("_transaction_window", self._max_transactions):
            return
        self._transport.send("transactions", {**data, "release": self.release, "environment": self.environment, "sdk": SDK})

    def _capture(self, message: str, exception: Optional[Dict[str, Any]], level: str, tags: Optional[Dict[str, str]], extra: Dict[str, Any], fingerprint: Optional[List[str]], error: Optional[BaseException]) -> Optional[str]:
        if not self.enabled or not self._sampled(self._sample_rate) or self._is_ignored(message, error) or self._is_duplicate(message, exception):
            return None
        if not self._within_limit("_event_window", self._max_events):
            self._debug("client-side rate limit reached, dropping the event")
            return None
        event: Dict[str, Any] = {
            "eventId": str(uuid.uuid4()),
            "timestamp": int(time.time() * 1000),
            "level": level,
            "platform": "python",
            "release": self.release,
            "environment": self.environment,
            "message": message,
            "breadcrumbs": self.scope.breadcrumbs(),
            "user": self.scope.user,
            "tags": {**self.scope.tags, **(tags or {})},
            "extra": {**self.scope.extra, **extra},
            "contexts": dict(self.scope.contexts),
            "sdk": SDK,
        }
        if exception is not None:
            event["exception"] = exception
        if fingerprint:
            event["fingerprint"] = fingerprint
        if self._before_send is not None:
            try:
                event = self._before_send(event)  # type: ignore[assignment]
            except Exception as failure:
                self._debug(f"before_send failed: {failure}")
            if not event:
                return None
        self._transport.send("events", event)
        return event["eventId"]

    def _sampled(self, rate: float) -> bool:
        return rate >= 1 or random.random() < rate

    def _is_ignored(self, message: str, error: Optional[BaseException]) -> bool:
        for rule in self._ignore_errors:
            if isinstance(rule, type):
                if error is not None and isinstance(error, rule):
                    return True
            elif isinstance(rule, str):
                if rule in message:
                    return True
            elif rule.search(message):
                return True
        return False

    def _is_duplicate(self, message: str, exception: Optional[Dict[str, Any]]) -> bool:
        frames = (exception or {}).get("stacktrace", {}).get("frames", [])
        top = frames[-1] if frames else {}
        signature = f"{message}|{top.get('filename')}:{top.get('lineno')}"
        now = time.monotonic()
        with self._lock:
            duplicate = self._recent is not None and self._recent[0] == signature and now - self._recent[1] < DUPLICATE_WINDOW_S
            self._recent = (signature, now)
        return duplicate

    def _within_limit(self, attribute: str, limit: int) -> bool:
        now = time.monotonic()
        with self._lock:
            start, count = getattr(self, attribute)
            if now - start >= MINUTE_S:
                start, count = now, 0
            count += 1
            setattr(self, attribute, (start, count))
            return count <= limit

    def _debug(self, message: str) -> None:
        if self.debug:
            _log.warning("watchdog: %s", message)
