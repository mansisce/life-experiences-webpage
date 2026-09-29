"""API shapes (what goes over the wire), validated by Pydantic.

Analogy: Pydantic models are like TypeScript interfaces that are also checked at runtime —
FastAPI uses them to validate request bodies (bad input -> automatic 422) and to shape responses.

Two families live here on purpose — the BFF principle:
- `ApiModel`: screen-shaped, camelCase JSON for the React MFE (and later Android).
- `FlatModel`: flat, snake_case records for Streamlit, which drops straight into pandas.
"""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel

Priority = Literal["high", "medium", "low"]
Frequency = Literal["daily", "weekly", "one_off"]
TaskStatus = Literal["active", "done", "archived"]
Relevance = Literal["relevant", "not_relevant", "ignore"]
Source = Literal["ai", "manual"]
RuleType = Literal["completions", "streak", "milestone"]
Visibility = Literal["announced", "silent"]
TargetDays = Field(default=None, ge=1, le=3650)
RewardStatus = Literal["locked", "unlocked", "claimed"]
# selected: only tagged tasks count; all: every non-archived task in the reward's scope counts (HLR-9)
MatchMode = Literal["selected", "all"]

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
    rewards: int  # scoped to this tile, deleted with it
    rewards_losing_tasks: int  # scoped elsewhere ("Needs a tile") but tagged to tasks in this tile
    notes: int
    contacts: int
    files: int


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
    # Planning and visibility (HLR-11), all optional. A naive due date is in the user's timezone.
    is_milestone: bool = False
    visibility: Visibility = "announced"
    due_at: datetime | None = None
    target_days: int | None = TargetDays


class TaskUpdate(ApiModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    notes: str | None = Field(default=None, max_length=2000)
    is_milestone: bool | None = None
    visibility: Visibility | None = None
    due_at: datetime | None = None  # null clears it
    target_days: int | None = TargetDays  # null clears it
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
    is_milestone: bool
    visibility: Visibility
    due_at: datetime | None
    target_days: int | None
    overdue: bool  # active, has a due date, and it's in the past (BR-R22)
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
    match_mode: MatchMode
    # How this task counts towards the reward: tagged to it, or automatically by scope.
    match: Literal["tagged", "scope"]


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
    """A title is enough. It can belong to an area (for organising only); tasks are linked separately
    on the Link screen, and any task can be linked to any reward."""

    title: str = Title
    description: str = Field(default="", max_length=2000)
    image_url: str | None = Field(default=None, max_length=500)
    area_id: int | None = None  # optional home area; its tile comes from the area
    rule_type: RuleType = "completions"  # task count: linked tasks done N times in total
    threshold: int = Field(default=5, ge=1, le=365)
    task_ids: list[int] = []


class RewardUpdate(ApiModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    image_url: str | None = Field(default=None, max_length=500)
    rule_type: RuleType | None = None
    threshold: int | None = Field(default=None, ge=1, le=365)
    area_id: int | None = None  # move to another area, or null for no area; links are unaffected
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
    area_id: int


class RewardOut(ApiModel):
    id: int
    title: str
    description: str
    image_url: str | None
    rule_type: RuleType
    threshold: int
    status: RewardStatus
    # Where the reward is kept (optional; organising only, linking isn't limited by it).
    category_id: str | None
    category_name: str | None
    category_icon: str | None
    area_id: int | None
    area_name: str | None
    match_mode: MatchMode  # "all" only on older rewards that counted every task of an area
    connected: bool  # has linked tasks (or, for older rewards, "all tasks in the area")
    progress: ProgressOut
    tasks: list[TaskRef]  # linked tasks
    matched_task_count: int  # tasks that count towards progress
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


class MilestoneRow(FlatModel):
    task_id: int
    task_title: str
    category_name: str
    area_name: str
    due_at: datetime | None
    state: Literal["done", "overdue", "upcoming"]  # done = completed at least once
    silent: bool


class Totals(FlatModel):
    completions: int
    active_tasks: int
    overdue_tasks: int
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
    milestones: list[MilestoneRow]
    rewards: list[RewardProgressRow]
    suggestions: SuggestionStats


# ── Notes, contacts and files (HLR-10) ────────────────────────────────────────

ContactRole = Literal["customer_care", "service_executive", "technician", "vendor", "other"]
PhoneLabel = Literal["mobile", "landline", "toll_free", "other"]
OwnerType = Literal["category", "area"]
Topic = Field(default=None, max_length=60)


class Phone(ApiModel):
    number: str = Field(min_length=3, max_length=30, pattern=r"^[0-9+()\-\s]+$")
    label: PhoneLabel = "mobile"
    whatsapp: bool = False


class NoteCreate(ApiModel):
    topic: str | None = Topic
    title: str | None = Field(default=None, max_length=120)
    body: str = Field(min_length=1, max_length=5000)


class NoteUpdate(ApiModel):
    topic: str | None = Topic
    title: str | None = Field(default=None, max_length=120)
    body: str | None = Field(default=None, min_length=1, max_length=5000)


class NoteOut(ApiModel):
    id: int
    topic: str | None
    title: str | None
    body: str
    created_at: datetime
    updated_at: datetime


class ContactCreate(ApiModel):
    topic: str | None = Topic
    name: str = Field(min_length=1, max_length=80)
    organisation: str | None = Field(default=None, max_length=80)
    role: ContactRole = "other"
    phones: list[Phone] = Field(default_factory=list, max_length=3)
    email: EmailStr | None = None
    website: str | None = Field(default=None, max_length=500)
    last_visit: date | None = None
    notes: str = Field(default="", max_length=1000)


class ContactUpdate(ApiModel):
    topic: str | None = Topic
    name: str | None = Field(default=None, min_length=1, max_length=80)
    organisation: str | None = Field(default=None, max_length=80)
    role: ContactRole | None = None
    phones: list[Phone] | None = Field(default=None, max_length=3)
    email: EmailStr | None = None
    website: str | None = Field(default=None, max_length=500)
    last_visit: date | None = None
    notes: str | None = Field(default=None, max_length=1000)


class PhoneOut(Phone):
    tel: str  # dialable, e.g. "+919845012345" or "18002662345"
    whatsapp_url: str | None


class ContactOut(ApiModel):
    id: int
    topic: str | None
    name: str
    organisation: str | None
    role: ContactRole
    phones: list[PhoneOut]
    email: str | None
    website: str | None
    last_visit: date | None
    notes: str
    created_at: datetime
    updated_at: datetime


class FileUpdate(ApiModel):
    topic: str | None = Topic
    title: str | None = Field(default=None, min_length=1, max_length=120)
    doc_date: date | None = None
    amount: float | None = Field(default=None, ge=0, le=100_000_000)


class FileOut(ApiModel):
    id: int
    topic: str | None
    title: str
    doc_date: date | None
    amount: float | None
    original_name: str
    content_type: str
    size_bytes: int
    is_image: bool
    url: str  # signed, short-lived; works in <img src> and <a href>
    created_at: datetime


class TopicGroup(ApiModel):
    topic: str | None  # None = "General"
    last_executive: ContactOut | None
    contacts: list[ContactOut]
    files: list[FileOut]
    notes: list[NoteOut]


class DetailCounts(ApiModel):
    notes: int
    contacts: int
    files: int


class DetailsOut(ApiModel):
    """Everything on a tile's or area's Notes & contacts tab, grouped by topic, in one response."""

    owner_type: OwnerType
    owner_id: str
    path: str  # e.g. "Household › Kitchen"
    topics: list[TopicGroup]
    topic_names: list[str]  # suggestions for the topic field
    counts: DetailCounts


class SearchHit(ApiModel):
    kind: Literal["note", "contact", "file"]
    id: int
    title: str
    snippet: str
    topic: str | None
    owner_type: OwnerType
    owner_id: str
    path: str
