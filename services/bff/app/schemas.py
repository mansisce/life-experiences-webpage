"""API shapes (what goes over the wire), validated by Pydantic.

Analogy: Pydantic models are like TypeScript interfaces that are also checked at runtime —
FastAPI uses them to validate request bodies (bad input -> automatic 422) and to shape responses.

Two families live here on purpose — the BFF principle:
- `ApiModel`: screen-shaped, camelCase JSON for the React MFE (and later Android).
- `FlatModel`: flat, snake_case records for Streamlit, which drops straight into pandas.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

Priority = Literal["high", "medium", "low"]
Frequency = Literal["daily", "weekly", "one_off"]
TaskStatus = Literal["active", "done", "archived"]
Relevance = Literal["relevant", "not_relevant", "ignore"]
Source = Literal["ai", "manual"]
RuleType = Literal["completions", "streak"]
RewardStatus = Literal["locked", "unlocked", "claimed"]

Name = Field(min_length=1, max_length=80)
Title = Field(min_length=1, max_length=200)


class ApiModel(BaseModel):
    # camelCase out, accept either casing in.
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class FlatModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ── Categories & areas ──────────────────────────────────────────────────────────


class AreaOut(ApiModel):
    id: int
    category_id: str
    name: str
    active_task_count: int = 0


class CategoryOut(ApiModel):
    id: str
    name: str
    icon: str
    areas: list[AreaOut]


class CategoryCreate(ApiModel):
    name: str = Field(min_length=1, max_length=40)
    icon: str = Field(default="📁", min_length=1, max_length=16)


class CategoryUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=1, max_length=40)
    icon: str | None = Field(default=None, min_length=1, max_length=16)


class OrderUpdate(ApiModel):
    """The complete list of ids in their new order."""

    ids: list[int | str] = Field(min_length=1)


class StarterResult(ApiModel):
    tiles_added: int
    areas_added: int


class DeletePreview(ApiModel):
    """What deleting a tile would remove, for the confirmation dialog (LLR-1.12)."""

    name: str
    areas: int
    tasks: int
    completions: int
    rewards_losing_tasks: int


class AreaCreate(ApiModel):
    category_id: str
    name: str = Name


class AreaUpdate(ApiModel):
    name: str = Name


class CategoryRef(ApiModel):
    id: str
    name: str
    icon: str


class AreaDetail(ApiModel):
    id: int
    name: str
    category: CategoryRef
    active_task_count: int


# ── Tasks & activity ────────────────────────────────────────────────────────────


class TaskCreate(ApiModel):
    title: str = Title
    notes: str = Field(default="", max_length=2000)
    priority: Priority = "medium"
    frequency: Frequency = "weekly"


class TaskUpdate(ApiModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    notes: str | None = Field(default=None, max_length=2000)
    priority: Priority | None = None
    frequency: Frequency | None = None
    status: TaskStatus | None = None
    relevance: Relevance | None = None


class TaskOut(ApiModel):
    id: int
    area_id: int
    title: str
    notes: str
    source: Source
    priority: Priority
    frequency: Frequency
    status: TaskStatus
    relevance: Relevance
    created_at: datetime
    completion_count: int
    current_streak: int
    best_streak: int
    last_completed_at: datetime | None


class ActivityOut(ApiModel):
    id: int
    task_id: int
    completed_at: datetime
    note: str


class CompleteRequest(ApiModel):
    note: str = Field(default="", max_length=1000)
    # Optional backfill ("I did this yesterday"). Defaults to now; future times are rejected.
    completed_at: datetime | None = None


class RewardRef(ApiModel):
    id: int
    title: str
    status: RewardStatus
    progress_percent: int


class AreaRef(ApiModel):
    id: int
    name: str
    category_id: str


class TaskWithArea(TaskOut):
    """Cross-area task list (e.g. the reward task picker) needs to say where each task lives."""

    area_name: str
    category_id: str


class TaskDetail(TaskOut):
    """Task detail screen: the task plus the context that screen needs, in one round trip."""

    area: AreaRef
    rewards: list[RewardRef]


# ── Rewards ─────────────────────────────────────────────────────────────────────


class RewardCreate(ApiModel):
    title: str = Title
    description: str = Field(default="", max_length=2000)
    image_url: str | None = Field(default=None, max_length=500)
    rule_type: RuleType
    threshold: int = Field(ge=1, le=365)
    task_ids: list[int] = []


class RewardUpdate(ApiModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    image_url: str | None = Field(default=None, max_length=500)
    rule_type: RuleType | None = None
    threshold: int | None = Field(default=None, ge=1, le=365)
    # Only "claimed" can be set by a client; locked -> unlocked happens on task completion.
    status: Literal["claimed"] | None = None


class RewardTasksUpdate(ApiModel):
    task_ids: list[int]


class ProgressOut(ApiModel):
    current: int
    target: int
    percent: int


class TaskRef(ApiModel):
    id: int
    title: str


class RewardOut(ApiModel):
    id: int
    title: str
    description: str
    image_url: str | None
    rule_type: RuleType
    threshold: int
    status: RewardStatus
    progress: ProgressOut
    tasks: list[TaskRef]
    unlocked_at: datetime | None
    claimed_at: datetime | None
    created_at: datetime


class CompleteResponse(ApiModel):
    activity: ActivityOut
    task: TaskOut
    # Rewards that unlocked because of this completion, so the UI can celebrate immediately.
    unlocked_rewards: list[RewardOut]


# ── Dashboard (Streamlit) ───────────────────────────────────────────────────────


class CategoryCompletions(FlatModel):
    category_id: str
    category_name: str
    completions: int


class AreaCompletions(FlatModel):
    area_id: int
    area_name: str
    category_id: str
    category_name: str
    completions: int


class DailyCompletions(FlatModel):
    date: str  # local ISO date
    completions: int


class StreakRow(FlatModel):
    task_id: int
    task_title: str
    area_name: str
    category_id: str
    frequency: Frequency
    current_streak: int
    best_streak: int


class RewardProgressRow(FlatModel):
    reward_id: int
    title: str
    status: RewardStatus
    rule_type: RuleType
    current: int
    target: int
    percent: int


class SuggestionStats(FlatModel):
    relevant: int
    not_relevant: int
    ignore: int
    pending: int
    acceptance_rate: float | None  # relevant / decided; None until something is decided


class Totals(FlatModel):
    completions: int
    active_tasks: int
    active_streaks: int
    rewards_unlocked: int
    rewards_claimed: int


class DashboardSummary(FlatModel):
    generated_at: datetime
    window_days: int | None
    totals: Totals
    completions_by_category: list[CategoryCompletions]
    completions_by_area: list[AreaCompletions]
    completions_by_day: list[DailyCompletions]
    streaks: list[StreakRow]
    rewards: list[RewardProgressRow]
    suggestions: SuggestionStats
