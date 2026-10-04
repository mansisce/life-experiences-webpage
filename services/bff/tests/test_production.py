"""Production settings: no guessable token, no public API docs, WAL on the SQLite file."""

import sqlite3

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.config import Settings
from app.main import create_app

STRONG_TOKEN = "t" * 32
STRONG_KEY = "k" * 40


def prod_settings(tmp_path, **overrides) -> Settings:
    values = dict(
        database_url=f"sqlite+aiosqlite:///{(tmp_path / 'prod.db').as_posix()}",
        photo_dir=tmp_path / "photos",
        files_dir=tmp_path / "files",
        env="production",
        demo_token=STRONG_TOKEN,
        signing_key=STRONG_KEY,
        _env_file=None,
    )
    values.update(overrides)
    return Settings(**values)


@pytest.mark.parametrize(
    "overrides",
    [
        {"demo_token": "demo-token"},
        {"demo_token": "short"},
        {"signing_key": ""},
        {"signing_key": "too-short"},
    ],
)
def test_production_refuses_demo_defaults(tmp_path, overrides):
    with pytest.raises(ValidationError):
        prod_settings(tmp_path, **overrides)


def test_development_keeps_demo_defaults():
    assert Settings(_env_file=None).demo_token == "demo-token"


def test_production_hides_api_docs_but_serves_the_api(tmp_path):
    with TestClient(create_app(prod_settings(tmp_path))) as client:
        assert client.get("/health").json() == {"status": "ok"}
        for path in ("/docs", "/redoc", "/openapi.json"):
            assert client.get(path).status_code == 404
        auth = {"Authorization": f"Bearer {STRONG_TOKEN}"}
        assert client.get("/categories", headers=auth).status_code == 200
        assert client.get("/categories", headers={"Authorization": "Bearer demo-token"}).status_code == 401


def test_development_serves_api_docs(client):
    assert client.get("/docs").status_code == 200


def test_database_uses_wal(tmp_path):
    with TestClient(create_app(prod_settings(tmp_path))) as client:
        client.get("/categories", headers={"Authorization": f"Bearer {STRONG_TOKEN}"})
    with sqlite3.connect(tmp_path / "prod.db") as conn:
        assert conn.execute("PRAGMA journal_mode").fetchone()[0] == "wal"
