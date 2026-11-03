from __future__ import annotations

import contextvars
import functools
import inspect
import threading
import time
import uuid
from typing import Any, Callable, Dict, List, Optional, TypeVar

MAX_SPANS = 200

F = TypeVar("F", bound=Callable[..., Any])

_current_transaction: "contextvars.ContextVar[Optional[Transaction]]" = contextvars.ContextVar("watchdog_transaction", default=None)
_current_span: "contextvars.ContextVar[Optional[Span]]" = contextvars.ContextVar("watchdog_span", default=None)


def _short_id() -> str:
    return uuid.uuid4().hex[:16]


class _NoopSpan:
    span_id = ""

    def set_status(self, status: str) -> None:
        return None

    def finish(self, status: str = "ok") -> None:
        return None

    def __enter__(self) -> "_NoopSpan":
        return self

    def __exit__(self, *exc: Any) -> bool:
        return False

    async def __aenter__(self) -> "_NoopSpan":
        return self

    async def __aexit__(self, *exc: Any) -> bool:
        return False


class _NoopTransaction(_NoopSpan):
    trace_id = ""

    def set_tag(self, key: str, value: Any) -> None:
        return None

    def span(self, op: str, description: Optional[str] = None) -> _NoopSpan:
        return _NoopSpan()

    def __enter__(self) -> "_NoopTransaction":
        return self

    async def __aenter__(self) -> "_NoopTransaction":
        return self


NOOP_SPAN = _NoopSpan()
NOOP_TRANSACTION = _NoopTransaction()


class Span:
    def __init__(self, transaction: "Transaction", op: str, description: Optional[str], parent_id: Optional[str]) -> None:
        self.span_id = _short_id()
        self._transaction = transaction
        self._op = op
        self._description = description
        self._parent_id = parent_id
        self._started = time.perf_counter()
        self._status = "ok"
        self._finished = False
        self._token: Optional["contextvars.Token[Optional[Span]]"] = None

    def set_status(self, status: str) -> None:
        self._status = status

    def finish(self, status: Optional[str] = None) -> None:
        if self._finished:
            return
        self._finished = True
        data: Dict[str, Any] = {
            "spanId": self.span_id,
            "op": self._op,
            "startOffsetMs": (self._started - self._transaction.started_perf) * 1000,
            "durationMs": (time.perf_counter() - self._started) * 1000,
            "status": status or self._status,
        }
        if self._description:
            data["description"] = self._description
        if self._parent_id:
            data["parentSpanId"] = self._parent_id
        self._transaction.record(data)

    def __enter__(self) -> "Span":
        self._token = _current_span.set(self)
        return self

    def __exit__(self, exc_type: Any, exc: Any, tb: Any) -> bool:
        if self._token is not None:
            _current_span.reset(self._token)
        self.finish("internal_error" if exc_type else None)
        return False

    async def __aenter__(self) -> "Span":
        return self.__enter__()

    async def __aexit__(self, exc_type: Any, exc: Any, tb: Any) -> bool:
        return self.__exit__(exc_type, exc, tb)


class Transaction:
    def __init__(self, name: str, op: str, tags: Optional[Dict[str, Any]], emit: Callable[[Dict[str, Any]], None]) -> None:
        self.trace_id = str(uuid.uuid4())
        self._name = name
        self._op = op
        self._tags: Dict[str, str] = {key: str(value) for key, value in (tags or {}).items()}
        self._emit = emit
        self.started_perf = time.perf_counter()
        self._started_at = int(time.time() * 1000)
        self._spans: List[Dict[str, Any]] = []
        self._lock = threading.Lock()
        self._status = "ok"
        self._finished = False
        self._token: Optional["contextvars.Token[Optional[Transaction]]"] = None

    def set_tag(self, key: str, value: Any) -> None:
        self._tags[key] = str(value)

    def set_status(self, status: str) -> None:
        self._status = status

    def span(self, op: str, description: Optional[str] = None) -> Span:
        parent = _current_span.get()
        return Span(self, op, description, parent.span_id if parent is not None else None)

    def record(self, span: Dict[str, Any]) -> None:
        with self._lock:
            if len(self._spans) < MAX_SPANS:
                self._spans.append(span)

    def finish(self, status: Optional[str] = None) -> None:
        if self._finished:
            return
        self._finished = True
        self._emit(
            {
                "eventId": str(uuid.uuid4()),
                "traceId": self.trace_id,
                "name": self._name,
                "op": self._op,
                "status": status or self._status,
                "timestamp": self._started_at,
                "durationMs": (time.perf_counter() - self.started_perf) * 1000,
                "spans": list(self._spans),
                "tags": self._tags,
            }
        )

    def __enter__(self) -> "Transaction":
        self._token = _current_transaction.set(self)
        return self

    def __exit__(self, exc_type: Any, exc: Any, tb: Any) -> bool:
        if self._token is not None:
            _current_transaction.reset(self._token)
        self.finish("internal_error" if exc_type else None)
        return False

    async def __aenter__(self) -> "Transaction":
        return self.__enter__()

    async def __aexit__(self, exc_type: Any, exc: Any, tb: Any) -> bool:
        return self.__exit__(exc_type, exc, tb)


def current_transaction() -> Optional[Transaction]:
    return _current_transaction.get()


def start_span(op: str, description: Optional[str] = None) -> Any:
    transaction = _current_transaction.get()
    return transaction.span(op, description) if transaction is not None else NOOP_SPAN


def trace(op: str = "function", name: Optional[str] = None, *, get_client: Callable[[], Any]) -> Callable[[F], F]:
    def decorate(function: F) -> F:
        label = name or getattr(function, "__qualname__", getattr(function, "__name__", "function"))
        if inspect.iscoroutinefunction(function):

            @functools.wraps(function)
            async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
                async with _span_or_transaction(get_client(), label, op):
                    return await function(*args, **kwargs)

            return async_wrapper  # type: ignore[return-value]

        @functools.wraps(function)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            with _span_or_transaction(get_client(), label, op):
                return function(*args, **kwargs)

        return wrapper  # type: ignore[return-value]

    return decorate


def _span_or_transaction(client: Any, name: str, op: str) -> Any:
    if _current_transaction.get() is not None:
        return start_span(op, name)
    if client is None:
        return NOOP_TRANSACTION
    return client.start_transaction(name, op)
