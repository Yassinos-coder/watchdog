from __future__ import annotations

import linecache
import os
import sysconfig
from types import TracebackType
from typing import Any, Dict, List, Optional
import traceback

CONTEXT_RADIUS = 5
MAX_FRAMES = 100
MAX_LINE_LENGTH = 400
MAX_CAUSE_DEPTH = 5

_STDLIB = sysconfig.get_paths().get("stdlib")
_ROOT = os.getcwd().replace("\\", "/").rstrip("/") + "/"


def is_in_app(filename: str) -> bool:
    if not filename or filename.startswith("<"):
        return False
    if "site-packages" in filename or "dist-packages" in filename:
        return False
    return not (_STDLIB and filename.startswith(_STDLIB))


def display_path(filename: str) -> str:
    normalized = filename.replace("\\", "/")
    return normalized[len(_ROOT):] if normalized.startswith(_ROOT) else normalized


def _clip(line: str) -> str:
    return line.rstrip("\r\n")[:MAX_LINE_LENGTH]


def _context(filename: str, lineno: int, module_globals: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    lines = linecache.getlines(filename, module_globals)
    if not lines or lineno < 1 or lineno > len(lines):
        return {}
    index = lineno - 1
    return {
        "contextLine": _clip(lines[index]),
        "preContext": [_clip(line) for line in lines[max(index - CONTEXT_RADIUS, 0):index]],
        "postContext": [_clip(line) for line in lines[index + 1:index + 1 + CONTEXT_RADIUS]],
    }


def frames_from_traceback(tb: Optional[TracebackType]) -> List[Dict[str, Any]]:
    frames: List[Dict[str, Any]] = []
    for frame, lineno in traceback.walk_tb(tb):
        code = frame.f_code
        filename = code.co_filename
        in_app = is_in_app(filename)
        entry: Dict[str, Any] = {
            "filename": display_path(filename),
            "function": getattr(code, "co_qualname", code.co_name),
            "lineno": lineno,
            "inApp": in_app,
        }
        if in_app:
            entry.update(_context(filename, lineno, frame.f_globals))
        frames.append(entry)
    return frames[-MAX_FRAMES:]


def describe_causes(error: BaseException) -> List[str]:
    causes: List[str] = []
    current = error.__cause__ or error.__context__
    seen = {id(error)}
    while current is not None and len(causes) < MAX_CAUSE_DEPTH and id(current) not in seen:
        seen.add(id(current))
        causes.append(f"{type(current).__name__}: {current}"[:300])
        current = current.__cause__ or current.__context__
    return causes
