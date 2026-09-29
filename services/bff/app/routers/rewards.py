"""Rewards: create inside a tile/area scope, match tasks, track progress, claim."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import delete, insert, select

from .. import schemas
from ..deps import NowDep, SessionDep, SettingsDep
from ..models import Area, Category, Reward, Task, reward_tasks
from ..services import (
    ensure_tasks_exist,
    evaluate_unlocks,
    get_or_404,
    in_scope,
    reward_task_map,
    rewards_matching_area,
    rewards_out,
)

router = APIRouter(tags=["rewards"])

SCOPE_FIELDS = {"category_id", "area_id", "match_mode"}


async def _set_tasks(session, reward_id: int, task_ids: list[int]) -> None:
    await session.execute(delete(reward_tasks).where(reward_tasks.c.reward_id == reward_id))
    if task_ids:
        await session.execute(insert(reward_tasks), [{"reward_id": reward_id, "task_id": t} for t in task_ids])


async def _single_out(session, reward: Reward, settings, now) -> schemas.RewardOut:
    [out] = await rewards_out(session, [reward], settings.tz, now.astimezone(settings.tz).date())
    return out


def _unprocessable(message: str) -> HTTPException:
    return HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, message)


async def _check_scope(session, category_id: str, area_id: int | None) -> tuple[Category, Area | None]:
    """LLR-4.9: the tile must exist, and the area (if any) must belong to it."""
    category = await session.get(Category, category_id)
    if category is None:
        raise _unprocessable(f"Unknown tile '{category_id}'")
    if area_id is None:
        return category, None
    area = await session.get(Area, area_id)
    if area is None or area.category_id != category.id:
        raise _unprocessable(f"That area isn't part of {category.name}")
    return category, area


def _scope_label(category: Category, area: Area | None) -> str:
    return f"{category.name} › {area.name}" if area else category.name


async def _outside_scope(session, reward: Reward, task_ids: list[int]) -> list[Task]:
    """Tasks among task_ids that aren't inside the reward's scope (BR-R12), in id order."""
    if not task_ids:
        return []
    rows = await session.execute(select(Task, Area).join(Area, Area.id == Task.area_id).where(Task.id.in_(task_ids)))
    return sorted((task for task, area in rows if not in_scope(reward, area)), key=lambda t: t.id)


async def _check_tags_in_scope(session, reward: Reward, task_ids: list[int], label: str) -> None:
    """LLR-4.11: only tasks inside the reward's scope can be tagged."""
    outside = await _outside_scope(session, reward, task_ids)
    if outside:
        names = ", ".join(f"“{t.title}”" for t in outside)
        raise _unprocessable(f"{names} {'is' if len(outside) == 1 else 'are'} outside {label}")


@router.get("/rewards", response_model=list[schemas.RewardOut])
async def list_rewards(
    session: SessionDep,
    settings: SettingsDep,
    now: NowDep,
    status: schemas.RewardStatus | None = None,
    category_id: Annotated[str | None, Query(alias="categoryId")] = None,
    area_id: Annotated[int | None, Query(alias="areaId")] = None,
):
    """Filter with ?status=locked&categoryId=household&areaId=3 (areaId = rewards scoped to exactly that area)."""
    query = select(Reward).order_by(Reward.created_at.desc())
    if status:
        query = query.where(Reward.status == status)
    if category_id:
        query = query.where(Reward.category_id == category_id)
    if area_id is not None:
        query = query.where(Reward.area_id == area_id)
    rewards = (await session.scalars(query)).all()
    return await rewards_out(session, rewards, settings.tz, now.astimezone(settings.tz).date())


@router.get("/areas/{area_id}/rewards", response_model=list[schemas.RewardOut])
async def area_rewards(area_id: int, session: SessionDep, settings: SettingsDep, now: NowDep):
    """LLR-4.14: rewards you can earn here — locked or unlocked, scoped to this area or its whole tile."""
    area = await get_or_404(session, Area, area_id)
    rewards = (
        await session.scalars(
            select(Reward)
            .where(rewards_matching_area(area), Reward.status.in_(["locked", "unlocked"]))
            .order_by(Reward.status.desc(), Reward.created_at)  # unlocked first: ready to claim
        )
    ).all()
    return await rewards_out(session, rewards, settings.tz, now.astimezone(settings.tz).date())


@router.post("/rewards", response_model=schemas.RewardOut, status_code=201)
async def create_reward(body: schemas.RewardCreate, session: SessionDep, settings: SettingsDep, now: NowDep):
    category, area = await _check_scope(session, body.category_id, body.area_id)
    task_ids = await ensure_tasks_exist(session, body.task_ids)
    reward = Reward(**body.model_dump(exclude={"task_ids"}))
    reward.title = reward.title.strip()
    await _check_tags_in_scope(session, reward, task_ids, _scope_label(category, area))
    session.add(reward)
    await session.flush()  # assigns reward.id
    await _set_tasks(session, reward.id, task_ids)
    # Tasks that already meet the rule unlock it straight away.
    await evaluate_unlocks(session, [reward], settings.tz, now)
    await session.commit()
    return await _single_out(session, reward, settings, now)


async def _change_scope(session, reward: Reward, changes: dict, untag_outside: bool) -> None:
    """LLR-4.16: change tile / area / match mode while locked; narrowing untags only after confirmation."""
    # Picking the first tile for a "Needs a tile" reward is always allowed, whatever its status.
    if reward.status != "locked" and reward.category_id is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Scope can only change while the reward is locked")
    category_id = changes.get("category_id", reward.category_id)
    area_id = changes["area_id"] if "area_id" in changes else reward.area_id
    if "category_id" in changes and changes["category_id"] != reward.category_id and "area_id" not in changes:
        area_id = None  # a new tile starts as "whole tile" unless an area is given
    if category_id is None:
        raise _unprocessable("Pick a tile for this reward")
    category, area = await _check_scope(session, category_id, area_id)

    reward.category_id, reward.area_id = category.id, area.id if area else None
    if changes.get("match_mode"):
        reward.match_mode = changes["match_mode"]

    tagged = [t.id for t in (await reward_task_map(session, [reward.id])).get(reward.id, [])]
    outside = await _outside_scope(session, reward, tagged)
    if outside and not untag_outside:
        names = ", ".join(f"“{t.title}”" for t in outside)
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Moving this reward to {_scope_label(category, area)} will untag {names}. Continue?",
        )
    if outside:
        await session.execute(
            delete(reward_tasks).where(
                reward_tasks.c.reward_id == reward.id, reward_tasks.c.task_id.in_([t.id for t in outside])
            )
        )


@router.patch("/rewards/{reward_id}", response_model=schemas.RewardOut)
async def update_reward(
    reward_id: int, body: schemas.RewardUpdate, session: SessionDep, settings: SettingsDep, now: NowDep
):
    reward = await get_or_404(session, Reward, reward_id)
    changes = body.model_dump(exclude_unset=True)
    new_status = changes.pop("status", None)
    untag_outside = changes.pop("untag_outside", False)
    scope_changes = {k: changes.pop(k) for k in SCOPE_FIELDS & changes.keys()}

    if reward.category_id is None and changes and "category_id" not in scope_changes:
        raise HTTPException(status.HTTP_409_CONFLICT, "Pick a tile for this reward before editing it")
    for field, value in changes.items():
        if value is None and field != "image_url":
            raise _unprocessable(f"{field} cannot be null")
        setattr(reward, field, value)
    if scope_changes:
        await _change_scope(session, reward, scope_changes, untag_outside)

    if new_status == "claimed":
        if reward.status == "locked":
            raise HTTPException(status.HTTP_409_CONFLICT, "This reward is still locked")
        if reward.status == "unlocked":
            reward.status = "claimed"
            reward.claimed_at = now

    await session.flush()
    await evaluate_unlocks(session, [reward], settings.tz, now)  # a lowered threshold or wider scope may now be met
    await session.commit()
    return await _single_out(session, reward, settings, now)


@router.put("/rewards/{reward_id}/tasks", response_model=schemas.RewardOut)
async def set_reward_tasks(
    reward_id: int, body: schemas.RewardTasksUpdate, session: SessionDep, settings: SettingsDep, now: NowDep
):
    """Replace the full set of tasks tagged to this reward (PUT = idempotent replace)."""
    reward = await get_or_404(session, Reward, reward_id)
    if reward.category_id is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Pick a tile for this reward before changing its tasks")
    task_ids = await ensure_tasks_exist(session, body.task_ids)
    category, area = await _check_scope(session, reward.category_id, reward.area_id)
    await _check_tags_in_scope(session, reward, task_ids, _scope_label(category, area))
    await _set_tasks(session, reward.id, task_ids)
    await evaluate_unlocks(session, [reward], settings.tz, now)
    await session.commit()
    return await _single_out(session, reward, settings, now)
