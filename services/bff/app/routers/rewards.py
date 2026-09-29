"""Rewards: a free-standing list, linked to any tasks. A reward unlocks when its linked tasks meet its rule.

A reward can be kept in an area (to organise it: an area's Rewards tab lists it), but that never limits
linking: any reward can be linked to any task (many-to-many), on the Link screen. Older rewards that
counted "all tasks in the area" keep working.
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import delete, insert, select

from .. import schemas
from ..deps import NowDep, SessionDep, SettingsDep
from ..models import Area, Reward, Task, reward_tasks
from ..services import ensure_tasks_exist, evaluate_unlocks, get_or_404, rewards_out

router = APIRouter(tags=["rewards"])


async def _set_tasks(session, reward_id: int, task_ids: list[int]) -> None:
    await session.execute(delete(reward_tasks).where(reward_tasks.c.reward_id == reward_id))
    if task_ids:
        await session.execute(insert(reward_tasks), [{"reward_id": reward_id, "task_id": t} for t in task_ids])


async def _area_or_422(session, area_id: int) -> Area:
    area = await session.get(Area, area_id)
    if area is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Unknown area {area_id}")
    return area


async def _single_out(session, reward: Reward, settings, now) -> schemas.RewardOut:
    [out] = await rewards_out(session, [reward], settings.tz, now.astimezone(settings.tz).date())
    return out


@router.get("/rewards", response_model=list[schemas.RewardOut])
async def list_rewards(
    session: SessionDep,
    settings: SettingsDep,
    now: NowDep,
    status: schemas.RewardStatus | None = None,
    area_id: Annotated[int | None, Query(alias="areaId")] = None,
):
    """All rewards, newest first; ?areaId= for the ones kept in one area, ?status= to filter."""
    query = select(Reward).order_by(Reward.created_at.desc())
    if status:
        query = query.where(Reward.status == status)
    if area_id is not None:
        query = query.where(Reward.area_id == area_id)
    rewards = (await session.scalars(query)).all()
    return await rewards_out(session, rewards, settings.tz, now.astimezone(settings.tz).date())


@router.get("/rewards/{reward_id}", response_model=schemas.RewardOut)
async def get_reward(reward_id: int, session: SessionDep, settings: SettingsDep, now: NowDep):
    return await _single_out(session, await get_or_404(session, Reward, reward_id), settings, now)


@router.post("/rewards", response_model=schemas.RewardOut, status_code=201)
async def create_reward(body: schemas.RewardCreate, session: SessionDep, settings: SettingsDep, now: NowDep):
    task_ids = await ensure_tasks_exist(session, body.task_ids)
    reward = Reward(**body.model_dump(exclude={"task_ids"}))
    reward.title = reward.title.strip()
    if body.area_id is not None:
        reward.category_id = (await _area_or_422(session, body.area_id)).category_id
    session.add(reward)
    await session.flush()  # assigns reward.id
    await _set_tasks(session, reward.id, task_ids)
    # Linked tasks that already meet the rule unlock it straight away.
    await evaluate_unlocks(session, [reward], settings.tz, now)
    await session.commit()
    return await _single_out(session, reward, settings, now)


@router.patch("/rewards/{reward_id}", response_model=schemas.RewardOut)
async def update_reward(
    reward_id: int, body: schemas.RewardUpdate, session: SessionDep, settings: SettingsDep, now: NowDep
):
    reward = await get_or_404(session, Reward, reward_id)
    changes = body.model_dump(exclude_unset=True)
    new_status = changes.pop("status", None)

    if "area_id" in changes:
        area_id = changes.pop("area_id")
        reward.area_id = area_id
        reward.category_id = (await _area_or_422(session, area_id)).category_id if area_id is not None else None
    for field, value in changes.items():
        if value is None and field != "image_url":
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"{field} cannot be null")
        setattr(reward, field, value.strip() if field == "title" else value)

    if new_status == "claimed":
        if reward.status == "locked":
            raise HTTPException(status.HTTP_409_CONFLICT, "This reward is still locked")
        if reward.status == "unlocked":
            reward.status = "claimed"
            reward.claimed_at = now

    await session.flush()
    await evaluate_unlocks(session, [reward], settings.tz, now)  # a lowered threshold may now be met
    await session.commit()
    return await _single_out(session, reward, settings, now)


@router.put("/rewards/{reward_id}/tasks", response_model=schemas.RewardOut)
async def set_reward_tasks(
    reward_id: int, body: schemas.RewardTasksUpdate, session: SessionDep, settings: SettingsDep, now: NowDep
):
    """Replace the full set of tasks linked to this reward (PUT = idempotent replace)."""
    reward = await get_or_404(session, Reward, reward_id)
    await _set_tasks(session, reward.id, await ensure_tasks_exist(session, body.task_ids))
    await evaluate_unlocks(session, [reward], settings.tz, now)
    await session.commit()
    return await _single_out(session, reward, settings, now)


@router.post("/rewards/{reward_id}/tasks/{task_id}", response_model=schemas.RewardOut)
async def link_task(reward_id: int, task_id: int, session: SessionDep, settings: SettingsDep, now: NowDep):
    """Link one task to one reward (the Link screen). Linking twice is harmless."""
    reward = await get_or_404(session, Reward, reward_id)
    await get_or_404(session, Task, task_id)
    exists = await session.scalar(
        select(reward_tasks.c.task_id).where(reward_tasks.c.reward_id == reward_id, reward_tasks.c.task_id == task_id)
    )
    if exists is None:
        await session.execute(insert(reward_tasks).values(reward_id=reward_id, task_id=task_id))
        await evaluate_unlocks(session, [reward], settings.tz, now)
    await session.commit()
    return await _single_out(session, reward, settings, now)


@router.delete("/rewards/{reward_id}/tasks/{task_id}", response_model=schemas.RewardOut)
async def unlink_task(reward_id: int, task_id: int, session: SessionDep, settings: SettingsDep, now: NowDep):
    """Unlink a task. An unlocked or claimed reward stays so (BR-R10); only progress changes while locked."""
    reward = await get_or_404(session, Reward, reward_id)
    await session.execute(
        delete(reward_tasks).where(reward_tasks.c.reward_id == reward_id, reward_tasks.c.task_id == task_id)
    )
    await session.commit()
    return await _single_out(session, reward, settings, now)


@router.delete("/rewards/{reward_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reward(reward_id: int, session: SessionDep):
    """Deletes the reward and its links. Tasks and completions are untouched."""
    await session.delete(await get_or_404(session, Reward, reward_id))
    await session.commit()
