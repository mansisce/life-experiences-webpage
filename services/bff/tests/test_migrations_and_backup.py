"""Data-safety tests: migrations keep existing data, models never drift from migrations,
and export -> import round-trips every row."""

import sqlite3

import pytest
from alembic.autogenerate import compare_metadata
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine

from app.backup import export_data, import_data
from app.db import Base
from app.migrate import BASELINE_REVISION, migrate

from .test_api import area_id, complete, make_task


BASELINE_TABLES = ["categories", "areas", "tasks", "activities", "rewards", "reward_tasks", "photos", "suggestions"]


def url_for(path) -> str:
    return f"sqlite+aiosqlite:///{path.as_posix()}"


def test_models_match_migrations(tmp_path):
    """Fails when a model changes without a migration: run `alembic revision --autogenerate`."""
    migrate(url_for(tmp_path / "fresh.db"))
    engine = create_engine(f"sqlite:///{(tmp_path / 'fresh.db').as_posix()}")
    with engine.connect() as conn:
        diff = compare_metadata(MigrationContext.configure(conn, opts={"compare_type": False}), Base.metadata)
    engine.dispose()
    assert diff == [], f"Models and migrations differ; add a migration: {diff}"


def test_pre_migration_database_is_stamped_not_rebuilt(tmp_path):
    """A database made by the old create_all() keeps every row when migrations arrive."""
    db = tmp_path / "legacy.db"
    engine = create_engine(f"sqlite:///{db.as_posix()}")
    # Only the tables create_all() made before migrations existed (the 0001 baseline).
    Base.metadata.create_all(engine, tables=[Base.metadata.tables[name] for name in BASELINE_TABLES])
    engine.dispose()
    with sqlite3.connect(db) as conn:
        conn.execute("INSERT INTO categories (id, name, icon, sort_order) VALUES ('fun', 'Fun', 'x', 0)")
        conn.execute(
            "INSERT INTO areas (id, category_id, name, sort_order, created_at) "
            "VALUES (1, 'fun', 'Hobbies', 0, '2026-09-01 10:00:00')"
        )

    assert migrate(url_for(db)) >= BASELINE_REVISION

    with sqlite3.connect(db) as conn:
        assert conn.execute("SELECT name FROM areas").fetchall() == [("Hobbies",)]
        assert conn.execute("SELECT version_num FROM alembic_version").fetchone()[0] >= BASELINE_REVISION
        # Later migrations ran on top of the adopted baseline, adding their tables...
        tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        assert {"notes", "contacts", "attachments"} <= tables
    # ...and a copy of the database was saved before upgrading it.
    assert list((tmp_path / "backups").glob("legacy-*-pre-*.db"))


def test_migrate_is_idempotent(tmp_path):
    url = url_for(tmp_path / "db.db")
    assert migrate(url) == migrate(url)


def test_export_import_round_trip(client, tmp_path):
    kitchen = area_id(client, "household", "Kitchen")
    task = make_task(client, kitchen, title="Wipe counters")
    complete(client, task["id"], days_ago=1, note="After dinner")
    complete(client, task["id"])
    client.post("/rewards", json={"title": "Coffee", "ruleType": "completions", "threshold": 2, "taskIds": [task["id"]]})

    source_url = client.app.state.settings.database_url
    payload = export_data(source_url)
    assert len(payload["tables"]["activities"]) == 2
    assert payload["tables"]["rewards"][0]["status"] == "unlocked"

    target_url = url_for(tmp_path / "restored.db")
    counts = import_data(target_url, payload)
    assert counts["tasks"] == 1 and counts["activities"] == 2 and counts["reward_tasks"] == 1

    restored = export_data(target_url)
    assert restored["tables"] == payload["tables"]  # every row and value identical


def test_import_refuses_non_empty_target_without_replace(client, tmp_path):
    source_url = client.app.state.settings.database_url
    payload = export_data(source_url)  # seeded tiles and areas
    with pytest.raises(ValueError, match="isn't empty"):
        import_data(source_url, payload)
    assert import_data(source_url, payload, replace=True)["areas"] == 17
