"""Database tables (the storage shape).

These are deliberately separate from the API schemas in schemas.py: the tables describe how
data is stored once, the schemas describe what each client gets. That split is what lets the
BFF hand React, Streamlit and later Android different shapes from the same data.
"""

from datetime import datetime

from sqlalchemy import Column, ForeignKey, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base, UTCDateTime, utcnow


class Category(Base):
    """A tile: career, household, fun. Fixed set, seeded on first start."""

    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    icon: Mapped[str] = mapped_column(String(16))
    sort_order: Mapped[int] = mapped_column(default=0)


class Area(Base):
    """A sub-tile inside a category, e.g. Household -> Kitchen. User-editable."""

    __tablename__ = "areas"

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    sort_order: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    area_id: Mapped[int] = mapped_column(ForeignKey("areas.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    notes: Mapped[str] = mapped_column(Text, default="")
    source: Mapped[str] = mapped_column(String(10), default="manual")  # ai | manual
    priority: Mapped[str] = mapped_column(String(10), default="medium")  # high | medium | low
    frequency: Mapped[str] = mapped_column(String(10), default="weekly")  # daily | weekly | one_off
    status: Mapped[str] = mapped_column(String(10), default="active")  # active | done | archived
    relevance: Mapped[str] = mapped_column(String(15), default="relevant")  # relevant | not_relevant | ignore
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)


class Activity(Base):
    """One completion of a task. Streaks and reward progress are derived from these rows."""

    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    completed_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, index=True)
    note: Mapped[str] = mapped_column(Text, default="")


reward_tasks = Table(
    "reward_tasks",
    Base.metadata,
    Column("reward_id", ForeignKey("rewards.id", ondelete="CASCADE"), primary_key=True),
    Column("task_id", ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
)


class Reward(Base):
    __tablename__ = "rewards"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    image_url: Mapped[str | None] = mapped_column(String(500), default=None)
    rule_type: Mapped[str] = mapped_column(String(15))  # completions | streak
    threshold: Mapped[int]
    status: Mapped[str] = mapped_column(String(10), default="locked")  # locked | unlocked | claimed
    unlocked_at: Mapped[datetime | None] = mapped_column(UTCDateTime, default=None)
    claimed_at: Mapped[datetime | None] = mapped_column(UTCDateTime, default=None)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)


class Photo(Base):
    """An uploaded area photo, stored on private local disk (Phase 4)."""

    __tablename__ = "photos"

    id: Mapped[int] = mapped_column(primary_key=True)
    area_id: Mapped[int] = mapped_column(ForeignKey("areas.id", ondelete="CASCADE"), index=True)
    stored_name: Mapped[str] = mapped_column(String(100))
    original_name: Mapped[str] = mapped_column(String(255), default="")
    content_type: Mapped[str] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)


class Suggestion(Base):
    """An AI-suggested task awaiting the user's decision (Phase 4)."""

    __tablename__ = "suggestions"

    id: Mapped[int] = mapped_column(primary_key=True)
    area_id: Mapped[int] = mapped_column(ForeignKey("areas.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    why: Mapped[str] = mapped_column(Text, default="")
    priority: Mapped[str] = mapped_column(String(10), default="medium")
    frequency: Mapped[str] = mapped_column(String(10), default="weekly")
    decision: Mapped[str] = mapped_column(String(15), default="pending")  # pending | relevant | not_relevant | ignore
    task_id: Mapped[int | None] = mapped_column(ForeignKey("tasks.id", ondelete="SET NULL"), default=None)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
