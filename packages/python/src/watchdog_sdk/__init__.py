from __future__ import annotations

import atexit
import logging
from typing import Any, Callable, Dict, List, Optional

from ._version import __version__
from .client import WatchdogClient
from .integrations import asyncio_integration, excepthook, logging_integration
from .tracing import NOOP_SPAN, NOOP_TRANSACTION, Span, Transaction, current_transaction, start_span, trace as _trace

__all__ = [
    "WatchdogClient",
    "Span",
    "Transaction",
    "__version__",
    "add_breadcrumb",
    "capture_exception",
    "capture_message",
    "close",
    "distribution",
    "flush",
    "gauge",
    "get_client",
    "increment",
    "init",
    "install_asyncio_handler",
    "set_context",
    "set_extra",
    "set_tag",
    "set_user",
    "span",
    "start_transaction",
    "trace",
]

_log = logging.getLogger("watchdog_sdk")
_client: Optional[WatchdogClient] = None
_uninstallers: List[Callable[[], None]] = []
_atexit_registered = False


def init(
    dsn: str,
    *,
    release: Optional[str] = None,
    environment: Optional[str] = None,
    sample_rate: float = 1.0,
    traces_sample_rate: float = 1.0,
    max_breadcrumbs: int = 100,
    max_events_per_minute: int = 60,
    max_transactions_per_minute: int = 300,
    ignore_errors: Any = (),
    before_send: Optional[Callable[[Dict[str, Any]], Optional[Dict[str, Any]]]] = None,
    tags: Optional[Dict[str, str]] = None,
    enabled: bool = True,
    debug: bool = False,
    uncaught_exceptions: bool = True,
    logging_integration_enabled: bool = True,
    event_log_level: int = logging.ERROR,
    breadcrumb_log_level: int = logging.INFO,
    transport: Optional[Any] = None,
) -> Optional[WatchdogClient]:
    global _client, _atexit_registered
    close()
    try:
        client = WatchdogClient(
            dsn,
            release=release,
            environment=environment,
            sample_rate=sample_rate,
            traces_sample_rate=traces_sample_rate,
            max_breadcrumbs=max_breadcrumbs,
            max_events_per_minute=max_events_per_minute,
            max_transactions_per_minute=max_transactions_per_minute,
            ignore_errors=ignore_errors,
            before_send=before_send,
            tags=tags,
            enabled=enabled,
            debug=debug,
            transport=transport,
        )
    except ValueError as error:
        _log.warning("Watchdog is turned off: %s", error)
        return None
    _client = client
    if uncaught_exceptions:
        _uninstallers.append(excepthook.install(client.capture_exc_info, client.flush))
    if logging_integration_enabled:
        _uninstallers.append(logging_integration.install(get_client, event_log_level, breadcrumb_log_level))
    if not _atexit_registered:
        atexit.register(close)
        _atexit_registered = True
    return client


def close(timeout: float = 2.0) -> None:
    global _client
    while _uninstallers:
        _uninstallers.pop()()
    if _client is not None:
        _client.close(timeout)
    _client = None


def get_client() -> Optional[WatchdogClient]:
    return _client


def capture_exception(error: Optional[BaseException] = None, **context: Any) -> Optional[str]:
    return _client.capture_exception(error, **context) if _client else None


def capture_message(message: str, level: str = "info", **context: Any) -> Optional[str]:
    return _client.capture_message(message, level, **context) if _client else None


def add_breadcrumb(message: Optional[str] = None, **fields: Any) -> None:
    if _client:
        _client.add_breadcrumb(message, **fields)


def set_user(user: Optional[Dict[str, Any]]) -> None:
    if _client:
        _client.scope.user = user


def set_tag(key: str, value: Any) -> None:
    if _client:
        _client.scope.tags[key] = str(value)


def set_extra(key: str, value: Any) -> None:
    if _client:
        _client.scope.extra[key] = value


def set_context(key: str, value: Any) -> None:
    if _client:
        _client.scope.contexts[key] = value


def start_transaction(name: str, op: str = "default", **options: Any) -> Any:
    return _client.start_transaction(name, op, **options) if _client else NOOP_TRANSACTION


def span(op: str, description: Optional[str] = None) -> Any:
    return start_span(op, description)


def trace(op: str = "function", name: Optional[str] = None) -> Callable[[Any], Any]:
    return _trace(op, name, get_client=get_client)


def increment(name: str, value: float = 1, **options: Any) -> None:
    if _client:
        _client.increment(name, value, **options)


def gauge(name: str, value: float, **options: Any) -> None:
    if _client:
        _client.gauge(name, value, **options)


def distribution(name: str, value: float, **options: Any) -> None:
    if _client:
        _client.distribution(name, value, **options)


def flush(timeout: float = 2.0) -> bool:
    return _client.flush(timeout) if _client else True


def install_asyncio_handler(loop: Any = None) -> None:
    if _client is None:
        return
    _uninstallers.append(asyncio_integration.install(_client.capture_exc_info, loop))
