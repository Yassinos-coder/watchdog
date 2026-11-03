from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import unquote, urlsplit

_PROJECT_ID = re.compile(r"^[0-9a-f-]{36}$", re.IGNORECASE)


@dataclass(frozen=True)
class ParsedDsn:
    public_key: str
    project_id: str
    origin: str

    def endpoint(self, kind: str) -> str:
        return f"{self.origin}/api/ingest/v1/{self.project_id}/{kind}"


def parse_dsn(dsn: str) -> ParsedDsn:
    parts = urlsplit(dsn.strip())
    if parts.scheme not in ("http", "https") or not parts.hostname:
        raise ValueError("Watchdog: the DSN is not a valid URL")
    public_key = unquote(parts.username or "")
    project_id = parts.path.strip("/")
    if not public_key or not _PROJECT_ID.match(project_id):
        raise ValueError("Watchdog: the DSN must look like https://<key>@<host>/<project-id>")
    return ParsedDsn(public_key=public_key, project_id=project_id, origin=f"{parts.scheme}://{parts.netloc.rsplit('@', 1)[-1]}")
