"""Schema migrations (Alembic) that upgrade the existing database in place, keeping every row.

Analogy: migrations are to the database what versioned codemods are to a codebase. Each
revision is a small ordered script, and the database remembers which ones it has already run
(in the `alembic_version` table), so an upgrade only applies what's new.

Safety rules applied on every startup:
- A database created before migrations existed (tables present, no `alembic_version`) is
  *stamped* as the baseline rather than rebuilt, so its data is untouched.
- Before any upgrade that changes an existing SQLite file, a consistent copy is written to
  `<db dir>/backups/` first.
"""

import sqlite3
from datetime import datetime
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect

BFF_ROOT = Path(__file__).resolve().parent.parent
BASELINE_REVISION = "0001_baseline"
KEEP_AUTOMATIC_BACKUPS = 10


def sync_url(url: str) -> str:
    """Alembic and the export tool run synchronously; swap async drivers for sync ones."""
    return url.replace("sqlite+aiosqlite", "sqlite").replace("postgresql+asyncpg", "postgresql+psycopg")


def sqlite_file(url: str) -> Path | None:
    url = sync_url(url)
    return Path(url.removeprefix("sqlite:///")) if url.startswith("sqlite:///") else None


def alembic_config(database_url: str) -> Config:
    config = Config(str(BFF_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(BFF_ROOT / "migrations"))
    config.set_main_option("sqlalchemy.url", sync_url(database_url))
    config.attributes["configure_logger"] = False
    return config


def backup_sqlite(db_file: Path, label: str) -> Path:
    """Consistent copy via SQLite's backup API, safe even while the app has the file open."""
    backup_dir = db_file.parent / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    target = backup_dir / f"{db_file.stem}-{datetime.now():%Y%m%d-%H%M%S}-{label}.db"
    source, dest = sqlite3.connect(db_file), sqlite3.connect(target)
    try:
        source.backup(dest)
    finally:
        source.close()
        dest.close()
    # Prune only automatic pre-upgrade backups; manual ones are never deleted.
    automatic = sorted(backup_dir.glob(f"{db_file.stem}-*-pre-*.db"))
    for old in automatic[:-KEEP_AUTOMATIC_BACKUPS]:
        old.unlink()
    return target


def current_state(database_url: str) -> tuple[str | None, set[str]]:
    engine = create_engine(sync_url(database_url))
    try:
        with engine.connect() as conn:
            revision = MigrationContext.configure(conn).get_current_revision()
            tables = set(inspect(conn).get_table_names()) - {"alembic_version"}
    finally:
        engine.dispose()
    return revision, tables


def migrate(database_url: str) -> str:
    """Bring the database to the latest schema and return the resulting revision."""
    db_file = sqlite_file(database_url)
    if db_file is not None:
        db_file.parent.mkdir(parents=True, exist_ok=True)

    config = alembic_config(database_url)
    head = ScriptDirectory.from_config(config).get_current_head()
    revision, tables = current_state(database_url)

    if revision is None and tables:
        # Created before migrations existed: adopt it as the baseline, without touching rows.
        command.stamp(config, BASELINE_REVISION)
        revision = BASELINE_REVISION

    if revision != head:
        if revision is not None and db_file is not None and db_file.exists():
            backup_sqlite(db_file, f"pre-{head}")
        command.upgrade(config, "head")
    return head
