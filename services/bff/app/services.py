"""Database-backed helpers shared by routers: loading stats, evaluating rewards, building responses."""

from collections import defaultdict
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date, datetime
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from . import schemas
from .domain import Progress, compute_streak, reward_progress
from .models import Activity, Area, Reward, Task, reward_tasks


async def get_or_404[M](session: AsyncSession, model: type[M], obj_id: int | str) -> M:
    obj = await session.get(model, obj_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"{model.__name__} {obj_id} not found")
    return obj


# ── Task stats ──────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class TaskStats:
    completion_count: int = 0
    current_streak: int = 0
    best_streak: int = 0
    last_completed_at: datetime | None = None


async def task_stats(
    session: AsyncSession, tasks: Sequence[Task], tz: ZoneInfo, today: date
) -> dict[int, TaskStats]:
    """Completion count and streaks for many tasks with a single query."""
    if not tasks:
        return {}
    rows = await session.execute(
        select(Activity.task_id, Activity.completed_at).where(Activity.task_id.in_([t.id for t in tasks]))
    )
    times: dict[int, list[datetime]] = defaultdict(list)
    for task_id, completed_at in rows:
        times[task_id].append(completed_at)

    stats = {}
    for task in tasks:
        task_times = times.get(task.id, [])
        streak = compute_streak((t.astimezone(tz).date() for t in task_times), task.frequency, today)
        stats[task.id] = TaskStats(
            completion_count=len(task_times),
            current_streak=streak.current,
            best_streak=streak.best,
            last_completed_at=max(task_times, default=None),
        )
    return stats


def to_task_out(task: Task, stats: TaskStats) -> schemas.TaskOut:
    return schemas.TaskOut(
        id=task.id,
        area_id=task.area_id,
        title=task.title,
        notes=task.notes,
        source=task.source,
        priority=task.priority,
        frequency=task.frequency,
        status=task.status,
        relevance=task.relevance,
        created_at=task.created_at,
        completion_count=stats.completion_count,
        current_streak=stats.current_streak,
        best_streak=stats.best_streak,
        last_completed_at=stats.last_completed_at,
    )


# ── Rewards ─────────────────────────────────────────────────────────────────────


async def reward_task_map(session: AsyncSession, reward_ids: Sequence[int]) -> dict[int, list[Task]]:
    if not reward_ids:
        return {}
    rows = await session.execute(
        select(reward_tasks.c.reward_id, Task)
        .join(Task, Task.id == reward_tasks.c.task_id)
        .where(reward_tasks.c.reward_id.in_(reward_ids))
        .order_by(Task.id)
    )
    tagged: dict[int, list[Task]] = defaultdict(list)
    for reward_id, task in rows:
        tagged[reward_id].append(task)
    return tagged


async def reward_progress_map(
    session: AsyncSession, rewards: Sequence[Reward], tz: ZoneInfo, today: date
) -> tuple[dict[int, Progress], dict[int, list[Task]]]:
    tagged = await reward_task_map(session, [r.id for r in rewards])
    all_tasks = {t.id: t for tasks in tagged.values() for t in tasks}
    stats = await task_stats(session, list(all_tasks.values()), tz, today)

    progress = {}
    for reward in rewards:
        task_stats_list = [stats[t.id] for t in tagged.get(reward.id, [])]
        progress[reward.id] = reward_progress(
            reward.rule_type,
            reward.threshold,
            reward.status,
            total_completions=sum(s.completion_count for s in task_stats_list),
            best_current_streak=max((s.current_streak for s in task_stats_list), default=0),
        )
    return progress, tagged


async def evaluate_unlocks(
    session: AsyncSession, rewards: Sequence[Reward], tz: ZoneInfo, now: datetime
) -> list[Reward]:
    """Flip locked rewards whose rule is now met to unlocked. Returns the ones that changed."""
    locked = [r for r in rewards if r.status == "locked"]
    progress, _ = await reward_progress_map(session, locked, tz, now.astimezone(tz).date())
    newly_unlocked = []
    for reward in locked:
        if progress[reward.id].met:
            reward.status = "unlocked"
            reward.unlocked_at = now
            newly_unlocked.append(reward)
    return newly_unlocked


async def locked_rewards_for_task(session: AsyncSession, task_id: int) -> list[Reward]:
    result = await session.scalars(
        select(Reward)
        .join(reward_tasks, reward_tasks.c.reward_id == Reward.id)
        .where(reward_tasks.c.task_id == task_id, Reward.status == "locked")
    )
    return list(result)


async def rewards_out(
    session: AsyncSession, rewards: Sequence[Reward], tz: ZoneInfo, today: date
) -> list[schemas.RewardOut]:
    progress, tagged = await reward_progress_map(session, rewards, tz, today)
    return [
        schemas.RewardOut(
            id=r.id,
            title=r.title,
            description=r.description,
            image_url=r.image_url,
            rule_type=r.rule_type,
            threshold=r.threshold,
            status=r.status,
            progress=schemas.ProgressOut(
                current=progress[r.id].current, target=progress[r.id].target, percent=progress[r.id].percent
            ),
            tasks=[schemas.TaskRef(id=t.id, title=t.title) for t in tagged.get(r.id, [])],
            unlocked_at=r.unlocked_at,
            claimed_at=r.claimed_at,
            created_at=r.created_at,
        )
        for r in rewards
    ]


async def ensure_tasks_exist(session: AsyncSession, task_ids: Sequence[int]) -> list[int]:
    unique_ids = list(dict.fromkeys(task_ids))
    found = set(await session.scalars(select(Task.id).where(Task.id.in_(unique_ids))))
    missing = [i for i in unique_ids if i not in found]
    if missing:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Unknown task ids: {missing}")
    return unique_ids


async def area_exists_or_404(session: AsyncSession, area_id: int) -> Area:
    return await get_or_404(session, Area, area_id)
