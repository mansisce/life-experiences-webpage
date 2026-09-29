import { useState } from "react";
import { useRewards } from "../context.js";
import { groupByArea } from "../lib/groupByArea.js";
import { useResource } from "../lib/useResource.js";
import { Chips, Empty, ErrorState, FREQUENCIES, labelOf, Loading, PriorityBadge, ScreenHeader, STATUSES, useAction } from "../components/ui.jsx";

function TaskRow({ task, rewardCount, onChanged }) {
  const { api, links, toast, celebrate } = useRewards();
  const [busy, run] = useAction(toast);
  const complete = async () => {
    const result = await run(() => api.completeTask(task.id, {}), `Logged “${task.title}”`);
    if (result) {
      celebrate(result.unlockedRewards);
      onChanged();
    }
  };
  const details = [
    labelOf(FREQUENCIES, task.frequency),
    task.completionCount ? `done ${task.completionCount}×` : "not done yet",
    task.currentStreak > 0 && `🔥 ${task.currentStreak}`,
    rewardCount > 0 && `🎁 ${rewardCount}`,
    task.status !== "active" && labelOf(STATUSES, task.status),
  ].filter(Boolean);
  return (
    <li className={`rw-row rw-task rw-task--${task.status}`}>
      <a className="rw-row-main" href={links.task(task.id)}>
        <strong>{task.title}</strong>
        <small>{details.join(" · ")}</small>
      </a>
      <div className="rw-row-actions">
        <PriorityBadge priority={task.priority} />
        {task.status === "active" && (
          <button type="button" className="rw-btn rw-btn--done" disabled={busy} onClick={complete} aria-label={`Mark ${task.title} done`}>
            ✓
          </button>
        )}
      </div>
    </li>
  );
}

/** Every task, grouped under its tile › area. Tasks are added inside an area. */
export default function TasksListScreen() {
  const { api, links } = useRewards();
  const tasks = useResource(() => api.allTasks(), [api]);
  const tiles = useResource(() => api.categories(), [api]);
  const rewards = useResource(() => api.rewards(), [api]);
  const [status, setStatus] = useState("active");
  const [q, setQ] = useState("");

  if (tasks.loading && tasks.data === undefined) return <Loading label="Loading tasks…" />;
  if (tasks.error && tasks.data === undefined) return <ErrorState error={tasks.error} onRetry={tasks.reload} />;

  const rewardCount = {};
  for (const r of rewards.data ?? []) for (const t of r.tasks) rewardCount[t.id] = (rewardCount[t.id] ?? 0) + 1;
  const needle = q.trim().toLowerCase();
  const shown = tasks.data.filter(
    (t) => (!status || t.status === status) && (!needle || `${t.title} ${t.areaName}`.toLowerCase().includes(needle))
  );
  const groups = groupByArea(shown, tiles.data ?? [], (t) => t.areaId);
  const refresh = () => (tasks.refresh(), rewards.refresh());

  return (
    <section>
      <ScreenHeader title="Tasks" subtitle="Every task, grouped by area. Add new tasks inside an area." />
      {tasks.data.length > 0 && (
        <div className="rw-filters">
          {tasks.data.length > 5 && <input type="search" aria-label="Search tasks" placeholder="Search tasks" value={q} onChange={(e) => setQ(e.target.value)} />}
          <Chips label="Filter by status" options={STATUSES} value={status} onChange={setStatus} allowNone />
        </div>
      )}
      {tasks.data.length === 0 ? (
        <Empty title="No tasks yet">
          Open a tile on <a href={links.tiles()}>Tiles</a>, pick an area and add tasks there.
        </Empty>
      ) : groups.length === 0 ? (
        <Empty title={status ? `No ${labelOf(STATUSES, status).toLowerCase()} tasks` : "No tasks match"} />
      ) : (
        groups.map((g) => (
          <div key={g.key} className="rw-area-group">
            <h3 className="rw-group-title">
              <a href={links.area(g.area.id)}>
                <small>{g.tileLabel} ›</small> {g.area.name}
              </a>
            </h3>
            <ul className="rw-list" aria-busy={tasks.loading}>
              {g.items.map((t) => (
                <TaskRow key={t.id} task={t} rewardCount={rewardCount[t.id] ?? 0} onChanged={refresh} />
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
