"""Database tables (the storage shape).

These are deliberately separate from the API schemas in schemas.py: the tables describe how
data is stored once, the schemas describe what each client gets. That split is what lets the
BFF hand React, Streamlit and later Android different shapes from the same data.
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import JSON, CheckConstraint, Column, Date, ForeignKey, Numeric, String, Table, Text
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
    # Scope (HLR-9): a tile, optionally narrowed to one of its areas. category_id is NULL only for
    # rewards migrated from before scopes whose tags didn't point at one tile ("Needs a tile").
    # Deleting the tile deletes its rewards; deleting the area widens the reward to the tile.
    category_id: Mapped[str | None] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), default=None, index=True
    )
    area_id: Mapped[int | None] = mapped_column(ForeignKey("areas.id", ondelete="SET NULL"), default=None, index=True)
    match_mode: Mapped[str] = mapped_column(String(10), default="selected", server_default="selected")  # selected | all
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


# ── Notes, contacts and files on tiles and areas (HLR-10) ─────────────────────
# Each row belongs to exactly one owner: a tile (category_id) or an area (area_id). Deleting the
# owner deletes its details (ON DELETE CASCADE). `topic` groups related items, e.g. "Bosch Dishwasher".

ONE_OWNER = "(category_id IS NULL) <> (area_id IS NULL)"


class Note(Base):
    __tablename__ = "notes"
    __table_args__ = (CheckConstraint(ONE_OWNER, name="ck_notes_one_owner"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[str | None] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), index=True)
    area_id: Mapped[int | None] = mapped_column(ForeignKey("areas.id", ondelete="CASCADE"), index=True)
    topic: Mapped[str | None] = mapped_column(String(60))
    title: Mapped[str | None] = mapped_column(String(120))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)


class Contact(Base):
    __tablename__ = "contacts"
    __table_args__ = (CheckConstraint(ONE_OWNER, name="ck_contacts_one_owner"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[str | None] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), index=True)
    area_id: Mapped[int | None] = mapped_column(ForeignKey("areas.id", ondelete="CASCADE"), index=True)
    topic: Mapped[str | None] = mapped_column(String(60))
    name: Mapped[str] = mapped_column(String(80))
    organisation: Mapped[str | None] = mapped_column(String(80))
    role: Mapped[str] = mapped_column(String(20), default="other")  # customer_care | service_executive | ...
    phones: Mapped[list] = mapped_column(JSON, default=list)  # [{number, label, whatsapp}]
    phone_digits: Mapped[str] = mapped_column(String(200), default="")  # for searching "98450 12345" as digits
    email: Mapped[str | None] = mapped_column(String(254))
    website: Mapped[str | None] = mapped_column(String(500))
    last_visit: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)


class Attachment(Base):
    """A file (bill, invoice, warranty card) stored privately on disk under a random name."""

    __tablename__ = "attachments"
    __table_args__ = (CheckConstraint(ONE_OWNER, name="ck_attachments_one_owner"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[str | None] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), index=True)
    area_id: Mapped[int | None] = mapped_column(ForeignKey("areas.id", ondelete="CASCADE"), index=True)
    topic: Mapped[str | None] = mapped_column(String(60))
    title: Mapped[str] = mapped_column(String(120))
    doc_date: Mapped[date | None] = mapped_column(Date)
    amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    stored_name: Mapped[str] = mapped_column(String(100), unique=True)
    original_name: Mapped[str] = mapped_column(String(255), default="")
    content_type: Mapped[str] = mapped_column(String(50))
    size_bytes: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
