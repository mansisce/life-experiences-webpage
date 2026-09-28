"""First-run seed data: the three tiles and their starting sub-tiles."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Area, Category

SEED = [
    ("career", "Career / Office / Work", "💼", ["Learning", "Projects"]),
    (
        "household",
        "Household",
        "🏠",
        [
            "Kitchen",
            "Kitchen Utility Area",
            "Laundry",
            "Master Bathroom",
            "Guest Bathroom",
            "Master Bedroom",
            "Guest Room",
            "Hall",
            "Balcony",
            "Books",
            "Makeup",
            "Wardrobe",
            "Shiragi Toys",
        ],
    ),
    ("fun", "Fun", "🎉", ["Hobbies", "Outings"]),
]


async def seed_if_empty(session: AsyncSession) -> None:
    """Idempotent: only seeds a brand-new database, so user edits to sub-tiles are never overwritten."""
    if await session.scalar(select(func.count()).select_from(Category)):
        return
    session.add_all(Category(id=cat_id, name=name, icon=icon, sort_order=i) for i, (cat_id, name, icon, _) in enumerate(SEED))
    await session.flush()  # categories must exist before areas reference them
    for cat_id, _, _, areas in SEED:
        session.add_all(Area(category_id=cat_id, name=area, sort_order=i) for i, area in enumerate(areas))
    await session.commit()
