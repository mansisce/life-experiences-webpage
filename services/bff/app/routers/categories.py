"""Tiles (categories): user-managed, no seeding (LLR-1.7 to 1.13, BR-R17 to R19)."""

import asyncio
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import delete, distinct, func, select

from .. import schemas
from ..deps import SessionDep, SettingsDep
from ..migrate import backup_sqlite, sqlite_file
from ..models import Activity, Area, Category, Task, reward_tasks
from ..seed import add_starter_set, next_tile_order, slugify, unique_tile_id
from ..services import get_or_404
from .areas import active_counts, area_out

router = APIRouter(tags=["categories & areas"])


async def _ensure_unique_tile_name(session, name: str, exclude_id: str | None = None) -> None:
    query = select(Category.id).where(func.lower(Category.name) == name.lower())
    if exclude_id is not None:
        query = query.where(Category.id != exclude_id)
    if await session.scalar(query):
        raise HTTPException(status.HTTP_409_CONFLICT, f"'{name}' already exists")


def _check_complete_order(requested: list, current: list) -> None:
    """A reorder must list every id exactly once, so nothing can be dropped by accident."""
    if len(requested) != len(set(requested)) or {str(i) for i in requested} != {str(i) for i in current}:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "ids must list every item exactly once, in the new order"
        )


def _category_out(category: Category, areas: list[Area], counts: dict[int, int]) -> schemas.CategoryOut:
    return schemas.CategoryOut(
        id=category.id, name=category.name, icon=category.icon, areas=[area_out(a, counts) for a in areas]
    )


@router.get("/categories", response_model=list[schemas.CategoryOut])
async def list_categories(session: SessionDep):
    categories = (await session.scalars(select(Category).order_by(Category.sort_order, Category.name))).all()
    areas = (await session.scalars(select(Area).order_by(Area.sort_order, Area.id))).all()
    counts = await active_counts(session, [a.id for a in areas])
    return [_category_out(c, [a for a in areas if a.category_id == c.id], counts) for c in categories]


@router.post("/categories", response_model=schemas.CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(body: schemas.CategoryCreate, session: SessionDep):
    name = body.name.strip()
    await _ensure_unique_tile_name(session, name)
    category = Category(
        id=await unique_tile_id(session, slugify(name)),
        name=name,
        icon=body.icon.strip(),
        sort_order=await next_tile_order(session),
    )
    session.add(category)
    await session.commit()
    return _category_out(category, [], {})


@router.post("/categories/starter", response_model=schemas.StarterResult)
async def add_starter(session: SessionDep):
    """Add the suggested tiles and areas that are missing; safe to call repeatedly."""
    tiles, areas = await add_starter_set(session)
    return schemas.StarterResult(tiles_added=tiles, areas_added=areas)


@router.put("/categories/order", response_model=list[schemas.CategoryOut])
async def reorder_categories(body: schemas.OrderUpdate, session: SessionDep):
    categories = {c.id: c for c in (await session.scalars(select(Category))).all()}
    _check_complete_order(body.ids, list(categories))
    for position, tile_id in enumerate(body.ids):
        categories[str(tile_id)].sort_order = position
    await session.commit()
    return await list_categories(session)


@router.patch("/categories/{category_id}", response_model=schemas.CategoryOut)
async def update_category(category_id: str, body: schemas.CategoryUpdate, session: SessionDep):
    category = await get_or_404(session, Category, category_id)
    if body.name is not None:
        name = body.name.strip()
        await _ensure_unique_tile_name(session, name, exclude_id=category.id)
        category.name = name  # the id (used in links) never changes
    if body.icon is not None:
        category.icon = body.icon.strip()
    await session.commit()
    areas = (
        await session.scalars(select(Area).where(Area.category_id == category.id).order_by(Area.sort_order, Area.id))
    ).all()
    return _category_out(category, areas, await active_counts(session, [a.id for a in areas]))


@router.put("/categories/{category_id}/areas/order", response_model=schemas.CategoryOut)
async def reorder_areas(category_id: str, body: schemas.OrderUpdate, session: SessionDep):
    category = await get_or_404(session, Category, category_id)
    areas = {a.id: a for a in (await session.scalars(select(Area).where(Area.category_id == category.id))).all()}
    _check_complete_order(body.ids, list(areas))
    for position, area_id in enumerate(body.ids):
        areas[int(area_id)].sort_order = position
    await session.commit()
    ordered = sorted(areas.values(), key=lambda a: a.sort_order)
    return _category_out(category, ordered, await active_counts(session, [a.id for a in ordered]))


async def _delete_preview(session, category: Category) -> schemas.DeletePreview:
    area_ids = select(Area.id).where(Area.category_id == category.id)
    task_ids = select(Task.id).where(Task.area_id.in_(area_ids))
    return schemas.DeletePreview(
        name=category.name,
        areas=await session.scalar(select(func.count()).where(Area.category_id == category.id)),
        tasks=await session.scalar(select(func.count()).where(Task.area_id.in_(area_ids))),
        completions=await session.scalar(select(func.count()).where(Activity.task_id.in_(task_ids))),
        rewards_losing_tasks=await session.scalar(
            select(func.count(distinct(reward_tasks.c.reward_id))).where(reward_tasks.c.task_id.in_(task_ids))
        ),
    )


@router.get("/categories/{category_id}/delete-preview", response_model=schemas.DeletePreview)
async def delete_preview(category_id: str, session: SessionDep):
    return await _delete_preview(session, await get_or_404(session, Category, category_id))


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    session: SessionDep,
    settings: SettingsDep,
    confirm_name: Annotated[str, Query(alias="confirmName", description="The tile's name, typed to confirm")],
):
    """Deletes the tile and everything under it, after a database snapshot (BR-R18)."""
    category = await get_or_404(session, Category, category_id)
    if confirm_name.strip().lower() != category.name.lower():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Type '{category.name}' to confirm deleting it")

    db_file = sqlite_file(settings.database_url)
    if db_file is not None and db_file.exists():
        await asyncio.to_thread(backup_sqlite, db_file, f"pre-delete-tile-{category.id}")

    # Areas cascade to tasks, completions, reward tags, photos and suggestions (ON DELETE CASCADE).
    await session.execute(delete(Area).where(Area.category_id == category.id))
    await session.delete(category)
    await session.commit()
