from __future__ import annotations

import logging
import threading
from typing import Any, Callable, Optional

_LEVELS = {
    logging.DEBUG: "debug",
    logging.INFO: "info",
    logging.WARNING: "warning",
    logging.ERROR: "error",
    logging.CRITICAL: "fatal",
}
_GUARD = threading.local()


def _level_name(levelno: int) -> str:
    for threshold in sorted(_LEVELS, reverse=True):
        if levelno >= threshold:
            return _LEVELS[threshold]
    return "debug"


class WatchdogLoggingHandler(logging.Handler):
    def __init__(self, get_client: Callable[[], Any], event_level: int = logging.ERROR, breadcrumb_level: int = logging.INFO) -> None:
        super().__init__(level=min(event_level, breadcrumb_level))
        self._get_client = get_client
        self._event_level = event_level
        self._breadcrumb_level = breadcrumb_level

    def emit(self, record: logging.LogRecord) -> None:
        if record.name.startswith("watchdog_sdk") or getattr(_GUARD, "active", False):
            return
        client: Optional[Any] = self._get_client()
        if client is None:
            return
        _GUARD.active = True
        try:
            if record.levelno >= self._breadcrumb_level:
                client.add_breadcrumb(record.getMessage(), category=record.name, type="log", level=_level_name(record.levelno))
            if record.levelno >= self._event_level:
                self._report(client, record)
        except Exception:
            pass
        finally:
            _GUARD.active = False

    def _report(self, client: Any, record: logging.LogRecord) -> None:
        tags = {"logger": record.name, "mechanism": "logging"}
        if record.exc_info and record.exc_info[1] is not None:
            client.capture_exc_info(record.exc_info, level=_level_name(record.levelno), tags=tags, extra={"log_message": record.getMessage()[:300]})
            return
        client.capture_message(record.getMessage(), _level_name(record.levelno), tags=tags)


def install(get_client: Callable[[], Any], event_level: int = logging.ERROR, breadcrumb_level: int = logging.INFO) -> Callable[[], None]:
    handler = WatchdogLoggingHandler(get_client, event_level, breadcrumb_level)
    root = logging.getLogger()
    root.addHandler(handler)

    def uninstall() -> None:
        root.removeHandler(handler)

    return uninstall
