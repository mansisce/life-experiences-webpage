"""Alembic environment: runs migrations synchronously against the BFF's configured database."""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, event

from app import models  # noqa: F401  (registers every table on Base.metadata)
from app.config import Settings
from app.db import Base, UTCDateTime
from app.migrate import sync_url

config = context.config

# When the BFF migrates itself on startup it keeps its own logging configuration.
if config.config_file_name is not None and config.attributes.get("configure_logger", True):
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def render_item(type_, obj, autogen_context):
    """Write app-specific column types as plain SQLAlchemy ones, so migrations never import app code."""
    if type_ == "type" and isinstance(obj, UTCDateTime):
        return "sa.DateTime()"
    return False


def database_url() -> str:
    return config.get_main_option("sqlalchemy.url") or sync_url(Settings().database_url)


def run_migrations_offline() -> None:
    context.configure(
        url=database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = create_engine(database_url())
    if engine.dialect.name == "sqlite":
        # Batch mode rebuilds tables for ALTERs; foreign keys must stay off while it copies rows.
        @event.listens_for(engine, "connect")
        def _foreign_keys_off(dbapi_conn, _record):
            dbapi_conn.execute("PRAGMA foreign_keys=OFF")

    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # SQLite can't ALTER most things in place; batch mode copies the table safely.
            render_as_batch=True,
            compare_type=True,
            render_item=render_item,
        )
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
