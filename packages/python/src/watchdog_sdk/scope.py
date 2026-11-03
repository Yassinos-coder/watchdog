from __future__ import annotations

import threading
import time
from collections import deque
from typing import Any, Deque, Dict, List, Optional


class Scope:
    def __init__(self, max_breadcrumbs: int) -> None:
        self._lock = threading.Lock()
        self._breadcrumbs: Deque[Dict[str, Any]] = deque(maxlen=max_breadcrumbs)
        self.user: Optional[Dict[str, Any]] = None
        self.tags: Dict[str, str] = {}
        self.extra: Dict[str, Any] = {}
        self.contexts: Dict[str, Any] = {}

    def add_breadcrumb(self, breadcrumb: Dict[str, Any]) -> None:
        crumb = {"timestamp": int(time.time() * 1000), **breadcrumb}
        with self._lock:
            self._breadcrumbs.append(crumb)

    def breadcrumbs(self) -> List[Dict[str, Any]]:
        with self._lock:
            return list(self._breadcrumbs)
