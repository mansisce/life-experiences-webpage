"""Backup, export and import for the Rewards database.

    uv run python -m app.backup snapshot                 # consistent copy of the SQLite file -> data/backups/
    uv run python -m app.backup export [file.json]       # every table -> one JSON file (default: data/backups/)
    uv run python -m app.backup import file.json         # load into an empty database
    uv run python -m app.backup import file.json --replace   # wipe the target's data first, then load

The JSON export is database-neutral: the same file can be imported into SQLite today or Postgres
later. Import always migrates the target to the latest schema first, and refuses a file exported
from a newer schema than this code knows about.
"""

import argparse
import json
import sys
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import DateTime, Engine, create_engine, delete, event, func, insert, select, text

from . import models  # noqa: F401  (registers every table on Base.metadata)
from .config import Settings
from .db import Base
from .migrate import backup_sqlite, current_state, migrate, sqlite_file, sync_url

FORMAT = "rewards-export"
FORMAT_VERSION = 1


def sync_engine(database_url: str) -> Engine:
    engine = create_engine(sync_url(database_url))
    if engine.dialect.name == "sqlite":

        @event.listens_for(engine, "connect")
        def _foreign_keys_on(dbapi_conn, _record):
            dbapi_conn.execute("PRAGMA foreign_keys=ON")

    return engine


def _encode(value):
    return value.isoformat() if isinstance(value, datetime) else value


def _is_datetime(column) -> bool:
    # UTCDateTime is a TypeDecorator wrapping DateTime rather than a subclass of it.
    return isinstance(column.type, DateTime) or isinstance(getattr(column.type, "impl", None), DateTime)


def _decode(column, value):
    if value is not None and _is_datetime(column):
        parsed = datetime.fromisoformat(value)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)
    return value


def export_data(database_url: str) -> dict:
    revision, _ = current_state(database_url)
    engine = sync_engine(database_url)
    try:
        with engine.connect() as conn:
            tables = {
                table.name: [
                    {key: _encode(value) for key, value in row._mapping.items()}
                    for row in conn.execute(select(table).order_by(*table.primary_key.columns))
                ]
                for table in Base.metadata.sorted_tables
            }
    finally:
        engine.dispose()
    return {
        "format": FORMAT,
        "format_version": FORMAT_VERSION,
        "schema_revision": revision,
        "exported_at": datetime.now(UTC).isoformat(),
        "tables": tables,
    }


def import_data(database_url: str, payload: dict, replace: bool = False) -> dict[str, int]:
    if payload.get("format") != FORMAT:
        raise ValueError("Not a rewards export file")
    head = migrate(database_url)  # the target always has the latest schema before loading
    if payload.get("schema_revision") and payload["schema_revision"] > head:
        raise ValueError(f"Export is from a newer schema ({payload['schema_revision']}) than this code ({head})")

    engine = sync_engine(database_url)
    counts: dict[str, int] = {}
    try:
        with engine.begin() as conn:  # one transaction: all tables load, or none do
            has_data = any(
                conn.execute(select(func.count()).select_from(t)).scalar() for t in Base.metadata.sorted_tables
            )
            if has_data and not replace:
                raise ValueError("Target database isn't empty; pass --replace to overwrite it")
            for table in reversed(Base.metadata.sorted_tables):
                conn.execute(delete(table))
            for table in Base.metadata.sorted_tables:  # parents before children
                rows = [
                    {col.name: _decode(col, row[col.name]) for col in table.columns if col.name in row}
                    for row in payload["tables"].get(table.name, [])
                ]
                if rows:
                    conn.execute(insert(table), rows)
                counts[table.name] = len(rows)
            if conn.dialect.name == "postgresql":  # keep auto-increment ids ahead of imported ones
                for table in Base.metadata.sorted_tables:
                    pk = list(table.primary_key.columns)
                    if len(pk) == 1 and pk[0].autoincrement is not False and counts[table.name]:
                        conn.execute(text(
                            f"SELECT setval(pg_get_serial_sequence('{table.name}', '{pk[0].name}'), "
                            f"(SELECT MAX({pk[0].name}) FROM {table.name}))"
                        ))
    finally:
        engine.dispose()
    return counts


def default_backup_dir(database_url: str) -> Path:
    db_file = sqlite_file(database_url)
    return (db_file.parent if db_file else Path("data")) / "backups"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.backup", description=__doc__.split("\n\n")[0])
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("snapshot", help="consistent copy of the SQLite database file")
    exp = sub.add_parser("export", help="export every table to JSON")
    exp.add_argument("file", nargs="?", type=Path)
    imp = sub.add_parser("import", help="import a JSON export")
    imp.add_argument("file", type=Path)
    imp.add_argument("--replace", action="store_true", help="delete the target's existing data first")
    args = parser.parse_args(argv)

    database_url = Settings().database_url
    if args.command == "snapshot":
        db_file = sqlite_file(database_url)
        if db_file is None or not db_file.exists():
            print("snapshot only works for an existing SQLite database", file=sys.stderr)
            return 1
        print(backup_sqlite(db_file, "manual"))
    elif args.command == "export":
        target = args.file or default_backup_dir(database_url) / f"rewards-{datetime.now():%Y%m%d-%H%M%S}.json"
        target.parent.mkdir(parents=True, exist_ok=True)
        payload = export_data(database_url)
        target.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        print(target, {name: len(rows) for name, rows in payload["tables"].items()})
    else:
        db_file = sqlite_file(database_url)
        if args.replace and db_file is not None and db_file.exists():
            print("safety copy:", backup_sqlite(db_file, "pre-import"))
        counts = import_data(database_url, json.loads(args.file.read_text(encoding="utf-8")), replace=args.replace)
        print("imported", counts)
    return 0


if __name__ == "__main__":
    sys.exit(main())
