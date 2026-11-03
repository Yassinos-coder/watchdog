from __future__ import annotations

import sys
import threading
from typing import Any, Callable

FLUSH_TIMEOUT_S = 2.0


def install(capture: Callable[..., Any], flush: Callable[[float], Any]) -> Callable[[], None]:
    original_hook = sys.excepthook
    original_thread_hook = threading.excepthook

    def excepthook(exc_type: Any, error: BaseException, traceback_object: Any) -> None:
        try:
            capture((exc_type, error, traceback_object), level="fatal", handled=False, tags={"mechanism": "sys.excepthook"})
            flush(FLUSH_TIMEOUT_S)
        finally:
            original_hook(exc_type, error, traceback_object)

    def thread_hook(args: Any) -> None:
        try:
            if args.exc_value is not None:
                capture((args.exc_type, args.exc_value, args.exc_traceback), level="error", handled=False, tags={"mechanism": "threading.excepthook"})
        finally:
            original_thread_hook(args)

    sys.excepthook = excepthook
    threading.excepthook = thread_hook

    def uninstall() -> None:
        if sys.excepthook is excepthook:
            sys.excepthook = original_hook
        if threading.excepthook is thread_hook:
            threading.excepthook = original_thread_hook

    return uninstall
