import { useState } from "react";
import { useRewards } from "../context.js";
import { useResource } from "../lib/useResource.js";
import DetailsPanel from "../components/details.jsx";
import { AreaRewardsPanel } from "../components/rewards.jsx";
import { PlanFields } from "../components/plan.jsx";
import {
  fromLocalInput,
  PlanBadges,
  Chips,
  Empty,
  ErrorState,
  FREQUENCIES,
  labelOf,
  Loading,
  PRIORITIES,
  PriorityBadge,
  RELEVANCE,
  Resource,
  ScreenHeader,
  STATUSES,
  StreakBadge,
  SubTabs,
  useAction,
} from "../components/ui.jsx";

const EMPTY_TASK = { title: "", notes: "", priority: "medium", frequency: "weekly", isMilestone: false, visibility: "announced", dueAt: "", targetDays: "" };
// Default view shows active tasks; that alone doesn't count as "filtered" for the empty state.
const DEFAULT_FILTERS = { priority: "", status: "active", relevance: "", milestone: "", due: "", sort: "priority" };
const MILESTONE_FILTER = [["true", "🏁 Milestones only"]];
const DUE_FILTERS = [
  ["overdue", "Overdue"],
  ["today", "Due today"],
  ["week", "Due this week"],
];
const SORTS = [
  ["priority", "By priority"],
  ["due", "By due date"],
];

function AddTaskForm({ areaId, onCreated }) {
  const { api, toast } = useRewards();
  const [task, setTask] = useState(EMPTY_TASK);
  const [showNotes, setShowNotes] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [busy, run] = useAction(toast);
  const set = (field) => (value) => setTask((t) => ({ ...t, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    const body = {
      ...task,
      title: task.title.trim(),
      dueAt: fromLocalInput(task.dueAt),
      targetDays: task.targetDays ? Number(task.targetDays) : null,
    };
    const created = await run(() => api.createTask(areaId, body), "Task added");
    if (created) {
      setTask((t) => ({ ...EMPTY_TASK, priority: t.priority, frequency: t.frequency, visibility: t.visibility }));
      setShowNotes(false);
      onCreated(created);
    }
  };

  return (
    <form className="rw-card rw-form" onSubmit={submit} aria-label="Add a task manually">
      <h3>Add a task</h3>
      <input aria-label="Task title" placeholder="e.g. Wipe the counters" value={task.title} onChange={(e) => set("title")(e.target.value)} maxLength={200} required />
      {showNotes ? (
        <textarea aria-label="Notes" placeholder="Notes (optional)" value={task.notes} onChange={(e) => set("notes")(e.target.value)} rows={2} maxLength={2000} />
      ) : (
        <button type="button" className="rw-link-btn" onClick={() => setShowNotes(true)}>
          + Add notes
        </button>
      )}
      <span className="rw-field-label">Priority</span>
      <Chips label="Priority" options={PRIORITIES} value={task.priority} onChange={set("priority")} />
      <span className="rw-field-label">How often</span>
      <Chips label="Frequency" options={FREQUENCIES} value={task.frequency} onChange={set("frequency")} />
      {showMore ? (
        <PlanFields value={task} onChange={(changes) => setTask((t) => ({ ...t, ...changes }))} />
      ) : (
        <button type="button" className="rw-link-btn" onClick={() => setShowMore(true)}>
          + More options: milestone, due date, silent
        </button>
      )}
      <button type="submit" className="rw-btn rw-btn--primary rw-btn--block" disabled={busy || !task.title.trim()}>
        {busy ? "Adding…" : "Add task"}
      </button>
    </form>
  );
}

function TaskRow({ task, onChanged }) {
  const { api, links, toast, completed } = useRewards();
  const [busy, run] = useAction(toast);

  const complete = async () => {
    const result = await run(() => api.completeTask(task.id, {}));
    if (result) {
      completed(result);
      onChanged();
    }
  };
  const reprioritise = async (priority) => {
    if (await run(() => api.updateTask(task.id, { priority }))) onChanged();
  };

  return (
    <li className={`rw-row rw-task rw-task--${task.status}`}>
      <a className="rw-row-main" href={links.task(task.id)}>
        <strong>{task.title}</strong>
        <small>
          {labelOf(FREQUENCIES, task.frequency)}
          {task.source === "ai" && " · AI"}
          {task.status !== "active" && ` · ${labelOf(STATUSES, task.status)}`}
          {task.relevance !== "relevant" && ` · ${labelOf(RELEVANCE, task.relevance)}`}
          {task.completionCount > 0 && ` · done ${task.completionCount}×`}
        </small>
        <PlanBadges task={task} />
      </a>
      <div className="rw-row-actions">
        <StreakBadge current={task.currentStreak} best={task.bestStreak} />
        <label className="rw-sr-only" htmlFor={`prio-${task.id}`}>
          Priority
        </label>
        <select id={`prio-${task.id}`} className={`rw-select rw-select--${task.priority}`} value={task.priority} disabled={busy} onChange={(e) => reprioritise(e.target.value)}>
          {PRIORITIES.map(([v, text]) => (
            <option key={v} value={v}>
              {text}
            </option>
          ))}
        </select>
        {task.status === "active" && (
          <button type="button" className="rw-btn rw-btn--done" disabled={busy} onClick={complete} aria-label={`Mark ${task.title} done`}>
            ✓
          </button>
        )}
      </div>
    </li>
  );
}

function TaskList({ areaId, filters, reloadKey, onCompleted }) {
  const { api } = useRewards();
  const tasks = useResource(
    () => api.areaTasks(areaId, filters),
    [api, areaId, filters.priority, filters.status, filters.relevance, filters.milestone, filters.due, filters.sort, reloadKey]
  );

  if (tasks.loading && tasks.data === undefined) return <Loading label="Loading tasks…" />;
  if (tasks.error && tasks.data === undefined) return <ErrorState error={tasks.error} onRetry={tasks.reload} />;
  const filtered =
    filters.priority || filters.relevance || filters.milestone || filters.due || (filters.status && filters.status !== DEFAULT_FILTERS.status);
  if (tasks.data.length === 0) {
    return filtered ? <Empty title="No tasks match these filters" /> : <Empty title="No tasks yet">Add one above to get started.</Empty>;
  }
  return (
    <ul className="rw-list" aria-busy={tasks.loading}>
      {tasks.data.map((t) => (
        <TaskRow key={t.id} task={t} onChanged={() => (tasks.refresh(), onCompleted())} />
      ))}
    </ul>
  );
}

export default function AreaScreen({ areaId, tab = "main", query = "" }) {
  const { api, links } = useRewards();
  const area = useResource(() => api.area(areaId), [api, areaId]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [reloadKey, setReloadKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const setFilter = (field) => (value) => setFilters((f) => ({ ...f, [field]: value }));

  return (
    <Resource resource={area} loadingLabel="Loading area…">
      {(a) => (
        <section>
          <ScreenHeader
            crumbs={[
              ["All tiles", links.tiles()],
              [a.category.name, links.category(a.category.id)],
            ]}
            title={a.name}
            subtitle={`${a.activeTaskCount} active task${a.activeTaskCount === 1 ? "" : "s"}`}
          />
          <SubTabs
            label={`${a.name} sections`}
            tabs={[
              ["Tasks", links.area(areaId), tab === "main"],
              ["Rewards", links.areaRewards(areaId), tab === "rewards"],
              ["Notes & contacts", links.areaDetails(areaId), tab === "details"],
            ]}
          />
          {tab === "details" ? (
            <DetailsPanel ownerType="area" ownerId={areaId} />
          ) : tab === "rewards" ? (
            <AreaRewardsPanel area={a} openForm={new URLSearchParams(query).get("new") === "1"} />
          ) : (
          <>
          {/* Phase 4: photo upload + AI suggestions panel goes here, running in parallel with the manual form. */}
          <AddTaskForm areaId={areaId} onCreated={() => (setReloadKey((k) => k + 1), area.refresh())} />

          <div className="rw-section-head">
            <h3>Tasks</h3>
            <button type="button" className="rw-link-btn" aria-expanded={showFilters} onClick={() => setShowFilters((s) => !s)}>
              {showFilters ? "Hide filters" : "Filter"}
            </button>
          </div>
          {showFilters && (
            <div className="rw-filters">
              <Chips label="Filter by priority" options={PRIORITIES} value={filters.priority} onChange={setFilter("priority")} allowNone />
              <Chips label="Filter by status" options={STATUSES} value={filters.status} onChange={setFilter("status")} allowNone />
              <Chips label="Filter by relevance" options={RELEVANCE} value={filters.relevance} onChange={setFilter("relevance")} allowNone />
              <Chips label="Milestones" options={MILESTONE_FILTER} value={filters.milestone} onChange={setFilter("milestone")} allowNone />
              <Chips label="Filter by due date" options={DUE_FILTERS} value={filters.due} onChange={setFilter("due")} allowNone />
              <Chips label="Sort" options={SORTS} value={filters.sort} onChange={setFilter("sort")} />
            </div>
          )}
          <TaskList areaId={areaId} filters={filters} reloadKey={reloadKey} onCompleted={area.refresh} />
          </>
          )}
        </section>
      )}
    </Resource>
  );
}
