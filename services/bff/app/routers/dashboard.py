"""Aggregated, flat, snake_case data for the Streamlit dashboard.

Same database as the React endpoints, different shape: Streamlit wants tables it can turn into
pandas DataFrames and charts, not screen-by-screen objects. That difference is the BFF principle.
"""

from collections import Counter
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from .. import schemas
from ..deps import NowDep, SessionDep, SettingsDep
from ..models import Activity, Area, Category, Reward, Suggestion, Task
from ..services import is_overdue, reward_progress_map, task_stats

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/summary", response_model=schemas.DashboardSummary)
async def dashboard_summary(
    session: SessionDep,
    settings: SettingsDep,
    now: NowDep,
    days: Annotated[int | None, Query(ge=1, le=365, description="Only count completions from the last N days")] = None,
):
    tz = settings.tz
    today = now.astimezone(tz).date()

    categories = (await session.scalars(select(Category).order_by(Category.sort_order))).all()
    areas = (await session.scalars(select(Area).order_by(Area.sort_order))).all()
    tasks = (await session.scalars(select(Task))).all()
    area_by_id = {a.id: a for a in areas}
    category_by_id = {c.id: c for c in categories}
    task_by_id = {t.id: t for t in tasks}

    activity_query = select(Activity.task_id, Activity.completed_at)
    if days:
        activity_query = activity_query.where(Activity.completed_at >= now - timedelta(days=days))
    activity = (await session.execute(activity_query)).all()

    per_area = Counter(task_by_id[task_id].area_id for task_id, _ in activity)
    per_category = Counter(area_by_id[task_by_id[task_id].area_id].category_id for task_id, _ in activity)
    per_day = Counter(completed_at.astimezone(tz).date().isoformat() for _, completed_at in activity)

    # Streaks always look at the full history, regardless of the `days` window.
    stats = await task_stats(session, tasks, tz, today)
    streaks = sorted(
        (
            schemas.StreakRow(
                task_id=t.id,
                task_title=t.title,
                area_name=area_by_id[t.area_id].name,
                category_id=area_by_id[t.area_id].category_id,
                frequency=t.frequency,
                current_streak=stats[t.id].current_streak,
                best_streak=stats[t.id].best_streak,
            )
            for t in tasks
            if t.frequency != "one_off" and stats[t.id].current_streak > 0
        ),
        key=lambda row: row.current_streak,
        reverse=True,
    )

    # Milestones (HLR-11): done first-time or not, due soonest first; no due date last.
    milestones = sorted(
        (
            schemas.MilestoneRow(
                task_id=t.id,
                task_title=t.title,
                category_name=category_by_id[area_by_id[t.area_id].category_id].name,
                area_name=area_by_id[t.area_id].name,
                due_at=t.due_at,
                state="done" if stats[t.id].completion_count else "overdue" if is_overdue(t, now) else "upcoming",
                silent=t.visibility == "silent",
            )
            for t in tasks
            if t.is_milestone and t.status != "archived"
        ),
        key=lambda row: (row.due_at is None, row.due_at or now),
    )

    everything = (await session.scalars(select(Reward).order_by(Reward.created_at))).all()
    # Ideas have no rule: counted per person, never as rewards (BR-R27).
    rewards = [r for r in everything if r.status not in {"idea", "closed"}]
    ideas = Counter(r.for_whom for r in everything if r.status == "idea")
    progress = (await reward_progress_map(session, rewards, tz, today)).progress

    decisions = dict(
        (await session.execute(select(Suggestion.decision, func.count()).group_by(Suggestion.decision))).all()
    )
    decided = sum(decisions.get(d, 0) for d in ("relevant", "not_relevant", "ignore"))

    return schemas.DashboardSummary(
        generated_at=now,
        window_days=days,
        totals=schemas.Totals(
            completions=len(activity),
            active_tasks=sum(1 for t in tasks if t.status == "active"),
            overdue_tasks=sum(1 for t in tasks if is_overdue(t, now)),
            active_streaks=len(streaks),
            rewards_unlocked=sum(1 for r in rewards if r.status == "unlocked"),
            rewards_claimed=sum(1 for r in rewards if r.status == "claimed"),
            ideas=sum(ideas.values()),
        ),
        completions_by_category=[
            schemas.CategoryCompletions(category_id=c.id, category_name=c.name, completions=per_category[c.id])
            for c in categories
        ],
        completions_by_area=[
            schemas.AreaCompletions(
                area_id=a.id,
                area_name=a.name,
                category_id=a.category_id,
                category_name=category_by_id[a.category_id].name,
                completions=per_area[a.id],
            )
            for a in areas
        ],
        completions_by_day=[schemas.DailyCompletions(date=d, completions=n) for d, n in sorted(per_day.items())],
        streaks=streaks,
        milestones=milestones,
        rewards=[
            schemas.RewardProgressRow(
                reward_id=r.id,
                title=r.title,
                status=r.status,
                rule_type=r.rule_type,
                current=progress[r.id].current,
                target=progress[r.id].target,
                percent=progress[r.id].percent,
            )
            for r in rewards
        ],
        ideas_by_person=[schemas.IdeasPerPerson(for_whom=p, ideas=n) for p, n in sorted(ideas.items())],
        suggestions=schemas.SuggestionStats(
            relevant=decisions.get("relevant", 0),
            not_relevant=decisions.get("not_relevant", 0),
            ignore=decisions.get("ignore", 0),
            pending=decisions.get("pending", 0),
            acceptance_rate=round(decisions.get("relevant", 0) / decided, 3) if decided else None,
        ),
    )
