"""Areas (sub-tiles). Tile endpoints live in categories.py."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from .. import schemas
from ..deps import SessionDep, SettingsDep
from ..models import Area, Category, Task
from ..services import get_or_404
from .details import remove_stored_files, stored_names_under

router = APIRouter(tags=["categories & areas"])


async def active_counts(session, area_ids: list[int]) -> dict[int, int]:
    if not area_ids:
        return {}
    rows = await session.execute(
        select(Task.area_id, func.count())
        .where(Task.area_id.in_(area_ids), Task.status == "active")
        .group_by(Task.area_id)
    )
    return dict(rows.all())


async def _ensure_unique_name(session, category_id: str, name: str, exclude_id: int | None = None) -> None:
    query = select(Area.id).where(Area.category_id == category_id, func.lower(Area.name) == name.lower())
    if exclude_id is not None:
        query = query.where(Area.id != exclude_id)
    if await session.scalar(query):
        raise HTTPException(status.HTTP_409_CONFLICT, f"'{name}' already exists in this category")


def area_out(area: Area, counts: dict[int, int]) -> schemas.AreaOut:
    return schemas.AreaOut(
        id=area.id, category_id=area.category_id, name=area.name, active_task_count=counts.get(area.id, 0)
    )


@router.get("/areas/{area_id}", response_model=schemas.AreaDetail)
async def get_area(area_id: int, session: SessionDep):
    area = await get_or_404(session, Area, area_id)
    category = await get_or_404(session, Category, area.category_id)
    counts = await active_counts(session, [area.id])
    return schemas.AreaDetail(
        id=area.id,
        name=area.name,
        category=schemas.CategoryRef.model_validate(category),
        active_task_count=counts.get(area.id, 0),
    )


@router.post("/areas", response_model=schemas.AreaOut, status_code=status.HTTP_201_CREATED)
async def create_area(body: schemas.AreaCreate, session: SessionDep):
    await get_or_404(session, Category, body.category_id)
    name = body.name.strip()
    await _ensure_unique_name(session, body.category_id, name)
    next_order = await session.scalar(
        select(func.coalesce(func.max(Area.sort_order), -1) + 1).where(Area.category_id == body.category_id)
    )
    area = Area(category_id=body.category_id, name=name, sort_order=next_order)
    session.add(area)
    await session.commit()
    return area_out(area, {})


@router.patch("/areas/{area_id}", response_model=schemas.AreaOut)
async def rename_area(area_id: int, body: schemas.AreaUpdate, session: SessionDep):
    area = await get_or_404(session, Area, area_id)
    name = body.name.strip()
    await _ensure_unique_name(session, area.category_id, name, exclude_id=area.id)
    area.name = name
    await session.commit()
    return area_out(area, await active_counts(session, [area.id]))


@router.delete("/areas/{area_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_area(area_id: int, session: SessionDep, settings: SettingsDep):
    """Deletes the area and (via ON DELETE CASCADE) its tasks, activity, notes, contacts and files.
    Rewards scoped to the area widen to its tile (ON DELETE SET NULL, LLR-4.17)."""
    area = await get_or_404(session, Area, area_id)
    stored = await stored_names_under(session, area_ids=[area.id])
    await session.delete(area)
    await session.commit()
    remove_stored_files(settings, stored)  # only after the rows are gone (LLR-10.10)
