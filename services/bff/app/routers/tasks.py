"""Tasks, completions (activity log) and streaks."""

from datetime import UTC, datetime, timedelta
from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select

from .. import schemas
from ..deps import NowDep, SessionDep, SettingsDep
from ..models import Activity, Area, Category, Task
from ..services import (
    evaluate_unlocks,
    get_or_404,
    reward_progress_map,
    rewards_for_task,
    area_label,
    rewards_out,
    task_stats,
    to_task_out,
)

router = APIRouter(tags=["tasks"])

CLEARABLE = {"due_at", "target_days"}  # optional planning fields can be removed again


async def _last_position(session, area_id: int) -> int:
    """New and moved tasks go to the bottom of the area's order (LLR-2.1, LLR-2.13)."""
    return await session.scalar(select(func.coalesce(func.max(Task.sort_order), -1) + 1).where(Task.area_id == area_id))


def local_to_utc(value: datetime | None, tz) -> datetime | None:
    """A naive date-time from a form is in the user's timezone; store everything as aware UTC."""
    if value is None:
        return None
    return (value if value.tzinfo else value.replace(tzinfo=tz)).astimezone(UTC)


@router.get("/areas/{area_id}/tasks", response_model=list[schemas.TaskOut])
async def list_tasks(
    area_id: int,
    session: SessionDep,
    settings: SettingsDep,
    now: NowDep,
    # Named `status_` so it doesn't shadow fastapi's `status` module; clients still send ?status=
    status_: Annotated[schemas.TaskStatus | None, Query(alias="status")] = None,
    relevance: schemas.Relevance | None = None,
    milestone: bool | None = None,
    due: Literal["overdue", "today", "week"] | None = None,
    sort: Literal["order", "due"] = "order",
):
    """Filter with ?status=active&relevance=relevant&milestone=true&due=overdue|today|week.
    In the user's order (BR-R32), or ?sort=due for soonest due first (no due date last)."""
    await get_or_404(session, Area, area_id)
    query = select(Task).where(Task.area_id == area_id)
    if status_:
        query = query.where(Task.status == status_)
    if relevance:
        query = query.where(Task.relevance == relevance)
    if milestone is not None:
        query = query.where(Task.is_milestone == milestone)
    if due:
        # Day boundaries are the user's local days (LLR-11.8); "overdue" follows BR-R22.
        local_midnight = now.astimezone(settings.tz).replace(hour=0, minute=0, second=0, microsecond=0)
        if due == "overdue":
            query = query.where(Task.status == "active", Task.due_at < now)
        else:
            end = local_midnight + timedelta(days=1 if due == "today" else 7)
            query = query.where(Task.due_at >= local_midnight, Task.due_at < end)
    order = (Task.due_at.is_(None), Task.due_at, Task.sort_order) if sort == "due" else (Task.sort_order,)
    tasks = (await session.scalars(query.order_by(*order, Task.id))).all()
    stats = await task_stats(session, tasks, settings.tz, now.astimezone(settings.tz).date())
    return [to_task_out(t, stats[t.id], now) for t in tasks]


@router.get("/tasks", response_model=list[schemas.TaskWithArea])
async def list_all_tasks(
    session: SessionDep,
    settings: SettingsDep,
    now: NowDep,
    status_: Annotated[schemas.TaskStatus | None, Query(alias="status")] = None,
):
    """All tasks across areas, grouped by area — used by the reward task picker."""
    query = select(Task, Area, Category.name).join(Area, Area.id == Task.area_id).join(Category)
    if status_:
        query = query.where(Task.status == status_)
    rows = (await session.execute(query.order_by(Area.category_id, Area.sort_order, Task.sort_order, Task.id))).all()
    stats = await task_stats(session, [task for task, *_ in rows], settings.tz, now.astimezone(settings.tz).date())
    return [
        schemas.TaskWithArea(
            **to_task_out(task, stats[task.id], now).model_dump(),
            area_name=area_label(area, tile_name),
            category_id=area.category_id,
        )
        for task, area, tile_name in rows
    ]


@router.put("/areas/{area_id}/tasks/order", response_model=list[schemas.TaskOut])
async def reorder_tasks(
    area_id: int, body: schemas.OrderUpdate, session: SessionDep, settings: SettingsDep, now: NowDep
):
    """Drag to reorder (LLR-2.5): `ids` lists every active task of the area once, most important first.
    Done and archived tasks keep their places in between (LLR-2.13). Returns the active tasks in order."""
    await get_or_404(session, Area, area_id)
    tasks = (await session.scalars(select(Task).where(Task.area_id == area_id).order_by(Task.sort_order, Task.id))).all()
    active = {t.id: t for t in tasks if t.status == "active"}
    if len(body.ids) != len(set(body.ids)) or {str(i) for i in body.ids} != {str(i) for i in active}:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "ids must list every active task of the area exactly once"
        )
    reordered = iter(active[int(i)] for i in body.ids)
    # Active tasks take the active slots in the new order; the others stay where they are.
    for position, task in enumerate(next(reordered) if t.status == "active" else t for t in tasks):
        task.sort_order = position
    await session.commit()
    ordered = sorted(active.values(), key=lambda t: t.sort_order)
    stats = await task_stats(session, ordered, settings.tz, now.astimezone(settings.tz).date())
    return [to_task_out(t, stats[t.id], now) for t in ordered]


@router.post("/areas/{area_id}/tasks", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(area_id: int, body: schemas.TaskCreate, session: SessionDep, settings: SettingsDep, now: NowDep):
    await get_or_404(session, Area, area_id)
    task = Task(area_id=area_id, source="manual", sort_order=await _last_position(session, area_id), **body.model_dump())
    task.title = task.title.strip()
    task.due_at = local_to_utc(body.due_at, settings.tz)
    session.add(task)
    await session.commit()
    stats = await task_stats(session, [task], settings.tz, now.astimezone(settings.tz).date())
    return to_task_out(task, stats[task.id], now)


@router.get("/tasks/{task_id}", response_model=schemas.TaskDetail)
async def get_task(task_id: int, session: SessionDep, settings: SettingsDep, now: NowDep):
    today = now.astimezone(settings.tz).date()
    task = await get_or_404(session, Task, task_id)
    area = await get_or_404(session, Area, task.area_id)
    stats = await task_stats(session, [task], settings.tz, today)
    matches = await rewards_for_task(session, task, area)
    progress = (await reward_progress_map(session, [r for r, _ in matches], settings.tz, today)).progress
    return schemas.TaskDetail(
        **to_task_out(task, stats[task.id], now).model_dump(),
        area=schemas.AreaRef(
            id=area.id,
            name=area_label(area, (await get_or_404(session, Category, area.category_id)).name),
            category_id=area.category_id,
            hidden=area.hidden,
        ),
        rewards=[
            schemas.RewardRef(
                id=r.id,
                title=r.title,
                status=r.status,
                progress_percent=progress[r.id].percent,
                match_mode=r.match_mode,
                match=how,
            )
            for r, how in matches
        ],
    )


@router.patch("/tasks/{task_id}", response_model=schemas.TaskOut)
async def update_task(
    task_id: int, body: schemas.TaskUpdate, session: SessionDep, settings: SettingsDep, now: NowDep
):
    task = await get_or_404(session, Task, task_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        if value is None and field not in CLEARABLE:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"{field} cannot be null")
        if field == "due_at":
            value = local_to_utc(value, settings.tz)
        if field == "area_id" and value != task.area_id:
            await get_or_404(session, Area, value)  # moving keeps its completions and reward links
            task.sort_order = await _last_position(session, value)
        setattr(task, field, value.strip() if field == "title" else value)
    await session.commit()
    stats = await task_stats(session, [task], settings.tz, now.astimezone(settings.tz).date())
    return to_task_out(task, stats[task.id], now)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, session: SessionDep):
    """Deletes the task with its completions and reward tags (ON DELETE CASCADE). Rewards themselves stay."""
    await session.delete(await get_or_404(session, Task, task_id))
    await session.commit()


@router.post(
    "/tasks/{task_id}/complete", response_model=schemas.CompleteResponse, status_code=status.HTTP_201_CREATED
)
async def complete_task(
    task_id: int, body: schemas.CompleteRequest, session: SessionDep, settings: SettingsDep, now: NowDep
):
    """Log a completion, recompute the streak and unlock any rewards whose rule is now met."""
    task = await get_or_404(session, Task, task_id)
    if task.status != "active":
        raise HTTPException(status.HTTP_409_CONFLICT, f"Only active tasks can be completed (this one is {task.status})")

    completed_at = body.completed_at or now
    if completed_at.tzinfo is None:
        completed_at = completed_at.replace(tzinfo=settings.tz)  # naive = user's local time
    if completed_at > now + timedelta(minutes=1):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "completedAt cannot be in the future")

    activity = Activity(task_id=task.id, completed_at=completed_at, note=body.note.strip())
    session.add(activity)
    if task.frequency == "one_off":
        task.status = "done"
    await session.flush()  # make the new activity visible to the queries below, inside this transaction

    # BR-R15: every locked reward this task counts towards, tagged or by scope.
    area = await get_or_404(session, Area, task.area_id)
    candidates = [r for r, _ in await rewards_for_task(session, task, area) if r.status == "locked"]
    unlocked = await evaluate_unlocks(session, candidates, settings.tz, now)
    await session.commit()

    today = now.astimezone(settings.tz).date()
    stats = await task_stats(session, [task], settings.tz, today)
    return schemas.CompleteResponse(
        activity=schemas.ActivityOut.model_validate(activity),
        task=to_task_out(task, stats[task.id], now),
        unlocked_rewards=await rewards_out(session, unlocked, settings.tz, today),
    )


@router.get("/tasks/{task_id}/activity", response_model=list[schemas.ActivityOut])
async def list_activity(task_id: int, session: SessionDep):
    """Newest first."""
    await get_or_404(session, Task, task_id)
    result = await session.scalars(
        select(Activity).where(Activity.task_id == task_id).order_by(Activity.completed_at.desc(), Activity.id.desc())
    )
    return result.all()
