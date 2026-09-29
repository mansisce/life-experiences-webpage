"""pytest fixtures — reusable setup injected into tests by argument name (similar in spirit to FastAPI's Depends)."""

from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.deps import get_now
from app.main import create_app

# 12:00 UTC = 17:30 in Asia/Kolkata, a Monday.
FROZEN_NOW = datetime(2026, 9, 28, 12, 0, tzinfo=UTC)
TOKEN = "test-token"


class Clock:
    """Mutable "now" so a test can move time forward between requests."""

    def __init__(self, now: datetime):
        self.now = now

    def __call__(self) -> datetime:
        return self.now


@pytest.fixture
def clock() -> Clock:
    return Clock(FROZEN_NOW)


@pytest.fixture
def settings(tmp_path) -> Settings:
    return Settings(
        database_url=f"sqlite+aiosqlite:///{(tmp_path / 'test.db').as_posix()}",
        photo_dir=tmp_path / "photos",
        demo_token=TOKEN,
        timezone="Asia/Kolkata",
        _env_file=None,
    )


def make_client(settings: Settings, clock: Clock) -> TestClient:
    app = create_app(settings)
    app.dependency_overrides[get_now] = clock
    return TestClient(app, headers={"Authorization": f"Bearer {TOKEN}"})


@pytest.fixture
def empty_client(settings, clock):
    """A brand-new database: no tiles at all (LLR-1.7)."""
    # `with` runs the lifespan (migrations), as on a real start.
    with make_client(settings, clock) as test_client:
        yield test_client


@pytest.fixture
def client(empty_client):
    """A database with the starter set added, which most tests build on."""
    assert empty_client.post("/categories/starter").status_code == 200
    return empty_client
