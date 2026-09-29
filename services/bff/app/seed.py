"""The optional starter set: suggested tiles and areas, added only when the user asks (LLR-1.8).

Nothing is seeded automatically any more. Adding the starter set only creates tiles and areas
whose names don't exist yet, so it never duplicates, renames or deletes anything (BR-R19).
"""

import re

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Area, Category

STARTER_SET = [
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


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:24] or "tile"


async def unique_tile_id(session: AsyncSession, preferred: str) -> str:
    """Tile ids are stable slugs used in links; renaming a tile never changes its id."""
    candidate, n = preferred, 2
    while await session.get(Category, candidate) is not None:
        candidate = f"{preferred}-{n}"
        n += 1
    return candidate


async def next_tile_order(session: AsyncSession) -> int:
    return await session.scalar(select(func.coalesce(func.max(Category.sort_order), -1) + 1))


async def add_starter_set(session: AsyncSession) -> tuple[int, int]:
    """Add missing starter tiles and areas (matched by name, ignoring case). Returns (tiles, areas) added."""
    existing = {c.name.lower(): c for c in (await session.scalars(select(Category))).all()}
    tiles_added = areas_added = 0
    for preferred_id, name, icon, area_names in STARTER_SET:
        tile = existing.get(name.lower())
        if tile is None:
            tile = Category(
                id=await unique_tile_id(session, preferred_id),
                name=name,
                icon=icon,
                sort_order=await next_tile_order(session),
            )
            session.add(tile)
            await session.flush()  # the tile must exist before its areas reference it
            tiles_added += 1

        have = {
            a.lower()
            for a in (await session.scalars(select(Area.name).where(Area.category_id == tile.id))).all()
        }
        next_order = await session.scalar(
            select(func.coalesce(func.max(Area.sort_order), -1) + 1).where(Area.category_id == tile.id)
        )
        for area_name in area_names:
            if area_name.lower() not in have:
                session.add(Area(category_id=tile.id, name=area_name, sort_order=next_order))
                next_order += 1
                areas_added += 1
    await session.commit()
    return tiles_added, areas_added
