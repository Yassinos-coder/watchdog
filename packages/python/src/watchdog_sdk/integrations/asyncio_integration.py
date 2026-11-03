from __future__ import annotations

import asyncio
from typing import Any, Callable, Dict, Optional


def install(capture: Callable[..., Any], loop: Optional[asyncio.AbstractEventLoop] = None) -> Callable[[], None]:
    target = loop or asyncio.get_running_loop()
    previous = target.get_exception_handler()

    def handler(current: asyncio.AbstractEventLoop, context: Dict[str, Any]) -> None:
        error = context.get("exception")
        try:
            if isinstance(error, BaseException):
                capture(
                    (type(error), error, error.__traceback__),
                    level="error",
                    handled=False,
                    tags={"mechanism": "asyncio"},
                    extra={"asyncio_message": str(context.get("message", ""))[:300]},
                )
        finally:
            if previous is not None:
                previous(current, context)
            else:
                current.default_exception_handler(context)

    target.set_exception_handler(handler)

    def uninstall() -> None:
        if target.get_exception_handler() is handler:
            target.set_exception_handler(previous)

    return uninstall
