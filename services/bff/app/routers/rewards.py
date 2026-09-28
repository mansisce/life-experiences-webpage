"""Rewards: create, tag to tasks, track progress, claim."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, insert, select

from .. import schemas
from ..deps import NowDep, SessionDep, SettingsDep
from ..models import Reward, reward_tasks
from ..services import ensure_tasks_exist, evaluate_unlocks, get_or_404, rewards_out

router = APIRouter(tags=["rewards"])


async def _set_tasks(session, reward_id: int, task_ids: list[int]) -> None:
    await session.execute(delete(reward_tasks).where(reward_tasks.c.reward_id == reward_id))
    if task_ids:
        await session.execute(insert(reward_tasks), [{"reward_id": reward_id, "task_id": t} for t in task_ids])


async def _single_out(session, reward: Reward, settings, now) -> schemas.RewardOut:
    [out] = await rewards_out(session, [reward], settings.tz, now.astimezone(settings.tz).date())
    return out


@router.get("/rewards", response_model=list[schemas.RewardOut])
async def list_rewards(
    session: SessionDep, settings: SettingsDep, now: NowDep, status: schemas.RewardStatus | None = None
):
    query = select(Reward).order_by(Reward.created_at.desc())
    if status:
        query = query.where(Reward.status == status)
    rewards = (await session.scalars(query)).all()
    return await rewards_out(session, rewards, settings.tz, now.astimezone(settings.tz).date())


@router.post("/rewards", response_model=schemas.RewardOut, status_code=201)
async def create_reward(body: schemas.RewardCreate, session: SessionDep, settings: SettingsDep, now: NowDep):
    task_ids = await ensure_tasks_exist(session, body.task_ids)
    reward = Reward(**body.model_dump(exclude={"task_ids"}))
    reward.title = reward.title.strip()
    session.add(reward)
    await session.flush()  # assigns reward.id
    await _set_tasks(session, reward.id, task_ids)
    # Tagging tasks that already meet the rule unlocks straight away.
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

    for field, value in changes.items():
        if value is None and field != "image_url":
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"{field} cannot be null")
        setattr(reward, field, value)

    if new_status == "claimed":
        if reward.status == "locked":
            raise HTTPException(status.HTTP_409_CONFLICT, "This reward is still locked")
        if reward.status == "unlocked":
            reward.status = "claimed"
            reward.claimed_at = now

    await evaluate_unlocks(session, [reward], settings.tz, now)  # a lowered threshold may now be met
    await session.commit()
    return await _single_out(session, reward, settings, now)


@router.put("/rewards/{reward_id}/tasks", response_model=schemas.RewardOut)
async def set_reward_tasks(
    reward_id: int, body: schemas.RewardTasksUpdate, session: SessionDep, settings: SettingsDep, now: NowDep
):
    """Replace the full set of tasks tagged to this reward (PUT = idempotent replace)."""
    reward = await get_or_404(session, Reward, reward_id)
    await _set_tasks(session, reward.id, await ensure_tasks_exist(session, body.task_ids))
    await evaluate_unlocks(session, [reward], settings.tz, now)
    await session.commit()
    return await _single_out(session, reward, settings, now)
