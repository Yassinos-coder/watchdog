from __future__ import annotations

import threading
from typing import Any, Callable, Dict, List, Optional

MAX_BUFFER = 200
FLUSH_INTERVAL_S = 5.0


class MetricsBuffer:
    def __init__(self, deliver: Callable[[List[Dict[str, Any]]], None]) -> None:
        self._deliver = deliver
        self._lock = threading.Lock()
        self._buffer: List[Dict[str, Any]] = []
        self._timer: Optional[threading.Timer] = None

    def add(self, metric: Dict[str, Any]) -> None:
        flush_now = False
        with self._lock:
            self._buffer.append(metric)
            if len(self._buffer) >= MAX_BUFFER:
                flush_now = True
            elif self._timer is None:
                self._timer = threading.Timer(FLUSH_INTERVAL_S, self.flush)
                self._timer.daemon = True
                self._timer.start()
        if flush_now:
            self.flush()

    def flush(self) -> None:
        with self._lock:
            if self._timer is not None:
                self._timer.cancel()
                self._timer = None
            batch, self._buffer = self._buffer, []
        if batch:
            self._deliver(batch)
