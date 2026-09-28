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
def client(tmp_path, clock):
    settings = Settings(
        database_url=f"sqlite+aiosqlite:///{(tmp_path / 'test.db').as_posix()}",
        photo_dir=tmp_path / "photos",
        demo_token=TOKEN,
        timezone="Asia/Kolkata",
        _env_file=None,
    )
    app = create_app(settings)
    app.dependency_overrides[get_now] = clock
    # `with` runs the lifespan: tables are created and seed data loaded, as on a real start.
    with TestClient(app, headers={"Authorization": f"Bearer {TOKEN}"}) as test_client:
        yield test_client
