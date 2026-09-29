"""Tasks, completions (activity log) and streaks."""

from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import case, select

from .. import schemas
from ..deps import NowDep, SessionDep, SettingsDep
from ..models import Activity, Area, Task
from ..services import (
    evaluate_unlocks,
    get_or_404,
    reward_progress_map,
    rewards_for_task,
    rewards_out,
    task_stats,
    to_task_out,
)

router = APIRouter(tags=["tasks"])

PRIORITY_ORDER = case({"high": 0, "medium": 1, "low": 2}, value=Task.priority, else_=3)


@router.get("/areas/{area_id}/tasks", response_model=list[schemas.TaskOut])
async def list_tasks(
    area_id: int,
    session: SessionDep,
    settings: SettingsDep,
    now: NowDep,
    priority: schemas.Priority | None = None,
    # Named `status_` so it doesn't shadow fastapi's `status` module; clients still send ?status=
    status_: Annotated[schemas.TaskStatus | None, Query(alias="status")] = None,
    relevance: schemas.Relevance | None = None,
):
    """Filter with ?priority=high&status=active&relevance=relevant. Sorted high -> low priority."""
    await get_or_404(session, Area, area_id)
    query = select(Task).where(Task.area_id == area_id)
    if priority:
        query = query.where(Task.priority == priority)
    if status_:
        query = query.where(Task.status == status_)
    if relevance:
        query = query.where(Task.relevance == relevance)
    tasks = (await session.scalars(query.order_by(PRIORITY_ORDER, Task.created_at))).all()
    stats = await task_stats(session, tasks, settings.tz, now.astimezone(settings.tz).date())
    return [to_task_out(t, stats[t.id]) for t in tasks]


@router.get("/tasks", response_model=list[schemas.TaskWithArea])
async def list_all_tasks(
    session: SessionDep,
    settings: SettingsDep,
    now: NowDep,
    status_: Annotated[schemas.TaskStatus | None, Query(alias="status")] = None,
):
    """All tasks across areas, grouped by area — used by the reward task picker."""
    query = select(Task, Area).join(Area, Area.id == Task.area_id)
    if status_:
        query = query.where(Task.status == status_)
    rows = (await session.execute(query.order_by(Area.category_id, Area.sort_order, PRIORITY_ORDER, Task.id))).all()
    stats = await task_stats(session, [task for task, _ in rows], settings.tz, now.astimezone(settings.tz).date())
    return [
        schemas.TaskWithArea(
            **to_task_out(task, stats[task.id]).model_dump(), area_name=area.name, category_id=area.category_id
        )
        for task, area in rows
    ]


@router.post("/areas/{area_id}/tasks", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(area_id: int, body: schemas.TaskCreate, session: SessionDep, settings: SettingsDep, now: NowDep):
    await get_or_404(session, Area, area_id)
    task = Task(area_id=area_id, source="manual", **body.model_dump())
    task.title = task.title.strip()
    session.add(task)
    await session.commit()
    stats = await task_stats(session, [task], settings.tz, now.astimezone(settings.tz).date())
    return to_task_out(task, stats[task.id])


@router.get("/tasks/{task_id}", response_model=schemas.TaskDetail)
async def get_task(task_id: int, session: SessionDep, settings: SettingsDep, now: NowDep):
    today = now.astimezone(settings.tz).date()
    task = await get_or_404(session, Task, task_id)
    area = await get_or_404(session, Area, task.area_id)
    stats = await task_stats(session, [task], settings.tz, today)
    matches = await rewards_for_task(session, task, area)
    progress = (await reward_progress_map(session, [r for r, _ in matches], settings.tz, today)).progress
    return schemas.TaskDetail(
        **to_task_out(task, stats[task.id]).model_dump(),
        area=schemas.AreaRef(id=area.id, name=area.name, category_id=area.category_id),
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
        if value is None:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"{field} cannot be null")
        setattr(task, field, value.strip() if field == "title" else value)
    await session.commit()
    stats = await task_stats(session, [task], settings.tz, now.astimezone(settings.tz).date())
    return to_task_out(task, stats[task.id])


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
        task=to_task_out(task, stats[task.id]),
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
