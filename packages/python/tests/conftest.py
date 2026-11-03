from __future__ import annotations

from typing import Any, List, Tuple

import pytest

import watchdog_sdk

DSN = "https://key123@watchdog.test/11111111-1111-4111-8111-111111111111"


class FakeTransport:
    def __init__(self) -> None:
        self.sent: List[Tuple[str, Any]] = []

    def send(self, kind: str, payload: Any) -> None:
        self.sent.append((kind, payload))

    def flush(self, timeout: float = 0) -> bool:
        return True

    def close(self, timeout: float = 0) -> None:
        return None

    def of(self, kind: str) -> List[Any]:
        return [payload for sent_kind, payload in self.sent if sent_kind == kind]


@pytest.fixture
def transport() -> FakeTransport:
    return FakeTransport()


@pytest.fixture(autouse=True)
def _reset_sdk() -> Any:
    yield
    watchdog_sdk.close(timeout=0)


@pytest.fixture
def client(transport: FakeTransport) -> Any:
    created = watchdog_sdk.init(DSN, release="1.2.3", environment="test", transport=transport, uncaught_exceptions=False, logging_integration_enabled=False)
    assert created is not None
    return created
