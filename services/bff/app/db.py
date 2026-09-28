"""Database engine and the base class for ORM tables.

SQLAlchemy's AsyncEngine is roughly a connection pool; an AsyncSession is a unit of work
(like a transaction you add/modify objects in, then `commit()`).
"""

from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import DateTime, event
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.types import TypeDecorator


class Base(DeclarativeBase):
    pass


class UTCDateTime(TypeDecorator):
    """SQLite has no timezone support: store naive UTC, always hand back aware UTC datetimes."""

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("naive datetimes are not allowed; use datetime.now(UTC)")
        return value.astimezone(UTC).replace(tzinfo=None)

    def process_result_value(self, value: datetime | None, dialect):
        return value.replace(tzinfo=UTC) if value is not None else None


def utcnow() -> datetime:
    return datetime.now(UTC)


def make_engine(url: str) -> AsyncEngine:
    if url.startswith("sqlite+aiosqlite:///"):
        Path(url.removeprefix("sqlite+aiosqlite:///")).parent.mkdir(parents=True, exist_ok=True)
    engine = create_async_engine(url)

    if url.startswith("sqlite"):
        # SQLite ignores foreign keys (and ON DELETE CASCADE) unless switched on per connection.
        @event.listens_for(engine.sync_engine, "connect")
        def _enable_foreign_keys(dbapi_conn, _record):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return engine


def make_sessionmaker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    # expire_on_commit=False: objects stay readable after commit without another (async) DB round trip.
    return async_sessionmaker(engine, expire_on_commit=False)
