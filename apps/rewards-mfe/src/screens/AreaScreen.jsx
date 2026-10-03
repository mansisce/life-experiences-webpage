import { useState } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRewards } from "../context.js";
import { navigate, redirect } from "../lib/router.js";
import { useResource } from "../lib/useResource.js";
import { useTileEditing } from "../components/manage.jsx";
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
  RELEVANCE,
  Resource,
  ScreenHeader,
  STATUSES,
  StreakBadge,
  SubTabs,
  useAction,
} from "../components/ui.jsx";

const EMPTY_TASK = { title: "", notes: "", frequency: "weekly", isMilestone: false, visibility: "announced", dueAt: "", targetDays: "" };
// Default view shows active tasks; that alone doesn't count as "filtered" for the empty state.
const DEFAULT_FILTERS = { status: "active", relevance: "", milestone: "", due: "", sort: "order" };
const MILESTONE_FILTER = [["true", "🏁 Milestones only"]];
const DUE_FILTERS = [
  ["overdue", "Overdue"],
  ["today", "Due today"],
  ["week", "Due this week"],
];
const SORTS = [
  ["order", "My order"],
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
      setTask((t) => ({ ...EMPTY_TASK, frequency: t.frequency, visibility: t.visibility }));
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

/** One task. With `sortable`, a ⠿ handle drags it (mouse, touch, or keyboard: Space, arrows, Space). */
function TaskRow({ task, onChanged, sortable }) {
  const drag = useSortable({ id: task.id, disabled: !sortable });
  const { api, links, toast, completed } = useRewards();
  const [busy, run] = useAction(toast);

  const complete = async () => {
    const result = await run(() => api.completeTask(task.id, {}));
    if (result) {
      completed(result);
      onChanged();
    }
  };

  return (
    <li
      ref={drag.setNodeRef}
      style={{ transform: CSS.Transform.toString(drag.transform), transition: drag.transition }}
      className={`rw-row rw-task rw-task--${task.status}${drag.isDragging ? " is-dragging" : ""}`}
    >
      {sortable && (
        <button type="button" className="rw-drag" aria-label={`Reorder ${task.title}`} {...drag.attributes} {...drag.listeners}>
          ⠿
        </button>
      )}
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
        {task.status === "active" && (
          <button type="button" className="rw-btn rw-btn--done" disabled={busy} onClick={complete} aria-label={`Mark ${task.title} done`}>
            ✓
          </button>
        )}
      </div>
    </li>
  );
}

const isDefaultView = (f) => Object.keys(DEFAULT_FILTERS).every((k) => f[k] === DEFAULT_FILTERS[k]);

/** The area's tasks in the user's order: top = most important (D16). Drag only in the default view (LLR-2.11). */
function TaskList({ areaId, filters, reloadKey, onCompleted }) {
  const { api, toast } = useRewards();
  const tasks = useResource(
    () => api.areaTasks(areaId, filters),
    [api, areaId, filters.status, filters.relevance, filters.milestone, filters.due, filters.sort, reloadKey]
  );
  const [pendingIds, setPendingIds] = useState(null); // shown while a new order is being saved
  const [, run] = useAction(toast);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (tasks.loading && tasks.data === undefined) return <Loading label="Loading tasks…" />;
  if (tasks.error && tasks.data === undefined) return <ErrorState error={tasks.error} onRetry={tasks.reload} />;
  const sortable = isDefaultView(filters);
  if (tasks.data.length === 0) {
    return sortable ? <Empty title="No tasks yet">Add one above to get started.</Empty> : <Empty title="No tasks match these filters" />;
  }
  const byId = new Map(tasks.data.map((t) => [t.id, t]));
  const shown = pendingIds ? pendingIds.map((id) => byId.get(id)).filter(Boolean) : tasks.data;

  const onDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const ids = shown.map((t) => t.id);
    const next = arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id));
    setPendingIds(next);
    if (await run(() => api.reorderTasks(areaId, next))) await tasks.refresh();
    setPendingIds(null);
  };

  return (
    <>
      {!sortable && shown.length > 1 && <p className="rw-muted">Clear filters and sort to reorder by dragging.</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={shown.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <ul className="rw-list" aria-busy={tasks.loading}>
            {shown.map((t) => (
              <TaskRow key={t.id} task={t} sortable={sortable && shown.length > 1} onChanged={() => (tasks.refresh(), onCompleted())} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </>
  );
}

/**
 * An area's Tasks | Rewards | Notes & contacts. With `tile`, it's the hidden area of a tile without
 * areas (HLR-13) and the screen is the tile's own: tile title, tile links and tile edit/delete.
 */
export default function AreaScreen({ areaId, tab = "main", query = "", tile = null, onTileChanged }) {
  const { api, links } = useRewards();
  const area = useResource(() => api.area(areaId), [api, areaId]);
  const tileEditing = useTileEditing(tile ?? { name: "" }, { onSaved: () => onTileChanged?.(), onDeleted: () => navigate(links.tiles()) });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [reloadKey, setReloadKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const setFilter = (field) => (value) => setFilters((f) => ({ ...f, [field]: value }));

  return (
    <Resource resource={area} loadingLabel="Loading area…">
      {(a) => {
        const place = { id: a.id, categoryId: a.category.id, hidden: a.hidden };
        const tabLink = (t) => links.place(place, t === "main" ? "" : t);
        // Old links to the hidden area (e.g. from search) open the tile instead.
        if (a.hidden && !tile) {
          redirect(tabLink(tab));
          return <Loading label="Opening tile…" />;
        }
        return (
        <section>
          <ScreenHeader
            crumbs={a.hidden ? [["All tiles", links.tiles()]] : [["All tiles", links.tiles()], [a.category.name, links.category(a.category.id)]]}
            title={a.hidden ? `${a.category.icon} ${a.category.name}` : a.name}
            subtitle={`${a.activeTaskCount} active task${a.activeTaskCount === 1 ? "" : "s"}`}
            actions={tile && tileEditing.actions}
          />
          {tile && tileEditing.panel}
          <SubTabs
            label={`${a.hidden ? a.category.name : a.name} sections`}
            tabs={[
              ["Tasks", tabLink("main"), tab === "main"],
              ["Rewards", tabLink("rewards"), tab === "rewards"],
              ["Notes & contacts", tabLink("details"), tab === "details"],
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
        );
      }}
    </Resource>
  );
}
