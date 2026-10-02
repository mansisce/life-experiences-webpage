"""Database-backed helpers shared by routers: loading stats, evaluating rewards, building responses."""

import hashlib
import hmac
import time
from collections import defaultdict
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, date, datetime
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from . import schemas
from .domain import Progress, compute_streak, milestone_progress, reward_progress
from .models import Activity, Area, Category, Reward, Task, reward_tasks


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


def is_overdue(task: Task, now: datetime) -> bool:
    """BR-R22: active, has a due date, and the due date has passed. Done and archived never are."""
    return task.status == "active" and task.due_at is not None and task.due_at < now


def to_task_out(task: Task, stats: TaskStats, now: datetime | None = None) -> schemas.TaskOut:
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
        is_milestone=task.is_milestone,
        visibility=task.visibility,
        due_at=task.due_at,
        target_days=task.target_days,
        overdue=is_overdue(task, now or datetime.now(UTC)),
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


def in_scope(reward: Reward, area: Area) -> bool:
    """BR-R12: the task's area belongs to the reward's tile and, if the reward has an area, is that area."""
    return reward.category_id == area.category_id and (reward.area_id is None or reward.area_id == area.id)


async def matched_task_map(
    session: AsyncSession, rewards: Sequence[Reward]
) -> tuple[dict[int, list[Task]], dict[int, list[Task]]]:
    """(matched, tagged) tasks per reward. Matched = the tasks whose completions count (BR-R13, BR-R14)."""
    tagged = await reward_task_map(session, [r.id for r in rewards])
    by_scope = [r for r in rewards if r.match_mode == "all" and r.category_id is not None]
    in_tile: dict[str, list[Task]] = defaultdict(list)
    if by_scope:
        rows = await session.execute(
            select(Task, Area.category_id)
            .join(Area, Area.id == Task.area_id)
            .where(Area.category_id.in_({r.category_id for r in by_scope}), Task.status != "archived")
            .order_by(Task.id)
        )
        for task, category_id in rows:
            in_tile[category_id].append(task)

    matched = {}
    for reward in rewards:
        if reward.match_mode == "all" and reward.category_id is not None:
            matched[reward.id] = [
                t for t in in_tile[reward.category_id] if reward.area_id is None or t.area_id == reward.area_id
            ]
        else:
            matched[reward.id] = tagged.get(reward.id, [])
    return matched, tagged


@dataclass(frozen=True)
class RewardTasks:
    progress: dict[int, Progress]
    matched: dict[int, list[Task]]
    tagged: dict[int, list[Task]]


async def reward_progress_map(
    session: AsyncSession, rewards: Sequence[Reward], tz: ZoneInfo, today: date
) -> RewardTasks:
    matched, tagged = await matched_task_map(session, rewards)
    all_tasks = {t.id: t for tasks in matched.values() for t in tasks}
    stats = await task_stats(session, list(all_tasks.values()), tz, today)

    progress = {}
    for reward in rewards:
        task_stats_list = [stats[t.id] for t in matched[reward.id]]
        if reward.status in NO_PROGRESS:  # ideas have no rule yet (BR-R27)
            progress[reward.id] = Progress(current=0, target=0)
            continue
        if reward.rule_type == "milestone":
            milestones = [stats[t.id] for t in matched[reward.id] if t.is_milestone]
            progress[reward.id] = milestone_progress(
                sum(1 for m in milestones if m.completion_count > 0), len(milestones), reward.status
            )
            continue
        progress[reward.id] = reward_progress(
            reward.rule_type,
            reward.threshold,
            reward.status,
            total_completions=sum(s.completion_count for s in task_stats_list),
            best_current_streak=max((s.current_streak for s in task_stats_list), default=0),
        )
    return RewardTasks(progress, matched, tagged)


async def evaluate_unlocks(
    session: AsyncSession, rewards: Sequence[Reward], tz: ZoneInfo, now: datetime
) -> list[Reward]:
    """Flip locked rewards whose rule is now met to unlocked. Returns the ones that changed."""
    locked = [r for r in rewards if r.status == "locked"]
    progress = (await reward_progress_map(session, locked, tz, now.astimezone(tz).date())).progress
    newly_unlocked = []
    for reward in locked:
        if progress[reward.id].met:
            reward.status = "unlocked"
            reward.unlocked_at = now
            newly_unlocked.append(reward)
    return newly_unlocked


def rewards_matching_area(area: Area):
    """Rewards scoped to this area or to its whole tile."""
    return (Reward.category_id == area.category_id) & (Reward.area_id.is_(None) | (Reward.area_id == area.id))


async def rewards_for_task(session: AsyncSession, task: Task, area: Area) -> list[tuple[Reward, str]]:
    """Every reward the task counts towards, with how: "tagged" or "scope" (BR-R15, LLR-8.8)."""
    tagged_ids = set(await session.scalars(select(reward_tasks.c.reward_id).where(reward_tasks.c.task_id == task.id)))
    by_scope = (Reward.match_mode == "all") & rewards_matching_area(area)
    candidates = (
        await session.scalars(select(Reward).where(Reward.id.in_(tagged_ids) | by_scope).order_by(Reward.created_at))
    ).all()
    result = []
    for reward in candidates:
        if reward.match_mode == "all" and reward.category_id is not None:
            if in_scope(reward, area) and task.status != "archived":
                result.append((reward, "scope"))
        elif reward.id in tagged_ids:
            result.append((reward, "tagged"))
    return result


NO_PROGRESS = {"idea", "closed"}
COVER_LINK_SECONDS = 3600


def cover_signature(settings, reward_id: int, expires: int) -> str:
    # Same key as file downloads, different message, so a file link can't open a cover or vice versa.
    from .routers.details import signing_key  # local import: the routers import this module

    return hmac.new(signing_key(settings), f"cover:{reward_id}:{expires}".encode(), hashlib.sha256).hexdigest()[:32]


def cover_url(reward: Reward, settings) -> str | None:
    if settings is None or not reward.cover_stored_name:
        return None
    expires = int(time.time()) + COVER_LINK_SECONDS
    return f"/rewards/{reward.id}/cover?expires={expires}&sig={cover_signature(settings, reward.id, expires)}"


def area_label(area: Area, tile_name: str) -> str:
    """An area's name on screen: the hidden area of a tile without areas shows as the tile (HLR-13)."""
    return tile_name if area.hidden else area.name


async def rewards_out(
    session: AsyncSession, rewards: Sequence[Reward], tz: ZoneInfo, today: date, settings=None
) -> list[schemas.RewardOut]:
    tasks = await reward_progress_map(session, rewards, tz, today)
    categories = {
        c.id: c
        for c in await session.scalars(select(Category).where(Category.id.in_({r.category_id for r in rewards})))
    }
    areas = {a.id: a for a in await session.scalars(select(Area).where(Area.id.in_({r.area_id for r in rewards})))}
    out = []
    for r in rewards:
        progress = tasks.progress[r.id]
        category = categories.get(r.category_id)
        out.append(
            schemas.RewardOut(
                id=r.id,
                title=r.title,
                description=r.description,
                image_url=r.image_url,
                rule_type=r.rule_type,
                threshold=r.threshold,
                status=r.status,
                category_id=r.category_id,
                category_name=category.name if category else None,
                category_icon=category.icon if category else None,
                area_id=r.area_id,
                area_name=area_label(areas[r.area_id], category.name if category else "") if r.area_id in areas else None,
                area_hidden=r.area_id in areas and areas[r.area_id].hidden,
                for_whom=r.for_whom,
                visibility=r.visibility,
                link=r.link,
                where_seen=r.where_seen,
                closed_outcome=r.closed_outcome,
                closed_at=r.closed_at,
                cover_url=cover_url(r, settings),
                match_mode=r.match_mode,
                connected=(r.match_mode == "all" and r.category_id is not None) or bool(tasks.tagged.get(r.id)),
                progress=schemas.ProgressOut(current=progress.current, target=progress.target, percent=progress.percent),
                tasks=[schemas.TaskRef(id=t.id, title=t.title, area_id=t.area_id) for t in tasks.tagged.get(r.id, [])],
                matched_task_count=len(tasks.matched[r.id]),
                unlocked_at=r.unlocked_at,
                claimed_at=r.claimed_at,
                created_at=r.created_at,
            )
        )
    return out


async def ensure_tasks_exist(session: AsyncSession, task_ids: Sequence[int]) -> list[int]:
    unique_ids = list(dict.fromkeys(task_ids))
    found = set(await session.scalars(select(Task.id).where(Task.id.in_(unique_ids))))
    missing = [i for i in unique_ids if i not in found]
    if missing:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Unknown task ids: {missing}")
    return unique_ids


async def area_exists_or_404(session: AsyncSession, area_id: int) -> Area:
    return await get_or_404(session, Area, area_id)
