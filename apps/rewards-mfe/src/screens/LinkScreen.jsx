import { useState } from "react";
import { useRewards } from "../context.js";
import { groupByArea } from "../lib/groupByArea.js";
import { useResource } from "../lib/useResource.js";
import { Empty, ErrorState, Loading, ScreenHeader, useAction } from "../components/ui.jsx";

const matches = (text, q) => text.toLowerCase().includes(q.trim().toLowerCase());

/** Pick one row from a searchable list. `rows` are {id, title, sub, group, badge}. */
function PickList({ label, rows, selected, onSelect, empty }) {
  const [q, setQ] = useState("");
  const shown = q.trim() ? rows.filter((r) => matches(`${r.title} ${r.sub ?? ""} ${r.group ?? ""}`, q)) : rows;
  const groups = Map.groupBy(shown, (r) => r.group ?? "");
  return (
    <div className="rw-card rw-picklist">
      <h3>{label}</h3>
      {rows.length === 0 ? (
        <p className="rw-muted">{empty}</p>
      ) : (
        <>
          <input type="search" aria-label={`Search ${label.toLowerCase()}`} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="rw-picklist-rows" role="listbox" aria-label={label}>
            {shown.length === 0 && <p className="rw-muted">Nothing matches.</p>}
            {[...groups].map(([group, items]) => (
              <div key={group || "none"}>
                {group && <p className="rw-picklist-group">{group}</p>}
                {items.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    role="option"
                    aria-selected={r.id === selected}
                    className={`rw-pick${r.id === selected ? " is-selected" : ""}`}
                    onClick={() => onSelect(r.id === selected ? null : r.id)}
                  >
                    <span>
                      <strong>{r.title}</strong>
                      {r.sub && <small>{r.sub}</small>}
                    </span>
                    {r.badge && <span className="rw-pick-badge">{r.badge}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function LinkScreen({ query = "" }) {
  const { api, links, toast, celebrate } = useRewards();
  const params = new URLSearchParams(query);
  const tasks = useResource(() => api.allTasks(), [api]);
  const rewards = useResource(() => api.rewards(), [api]);
  const tiles = useResource(() => api.categories(), [api]);
  const [taskId, setTaskId] = useState(() => Number(params.get("task")) || null);
  const [rewardId, setRewardId] = useState(() => Number(params.get("reward")) || null);
  const [busy, run] = useAction(toast);

  for (const r of [tasks, rewards, tiles]) {
    if (r.loading && r.data === undefined) return <Loading label="Loading tasks and rewards…" />;
    if (r.error && r.data === undefined) return <ErrorState error={r.error} onRetry={r.reload} />;
  }

  // Both lists grouped by tile › area, in the same order as the Tasks and Rewards screens.
  const grouped = (items, toRow) =>
    groupByArea(items, tiles.data ?? [], (x) => x.areaId).flatMap((g) =>
      g.items.map((x) => ({ ...toRow(x), group: g.area.id ? `${g.tileLabel} › ${g.area.name}` : g.area.name }))
    );
  const linksOf = (id) => rewards.data.filter((r) => r.tasks.some((t) => t.id === id));
  const taskRows = grouped(
    tasks.data.filter((t) => t.status !== "archived"),
    (t) => {
      const n = linksOf(t.id).length;
      return {
        id: t.id,
        title: t.title,
        sub: `done ${t.completionCount}×${t.status !== "active" ? ` · ${t.status}` : ""}`,
        badge: n ? `🎁 ${n}` : null,
      };
    }
  );
  const rewardRows = grouped(rewards.data, (r) => ({
    id: r.id,
    title: r.title,
    sub: [`needs ${r.threshold}`, r.status !== "locked" && r.status].filter(Boolean).join(" · "),
    badge: taskId && r.tasks.some((t) => t.id === taskId) ? "✓ linked" : r.tasks.length ? `${r.tasks.length} task${r.tasks.length === 1 ? "" : "s"}` : null,
  }));

  const task = tasks.data.find((t) => t.id === taskId);
  const reward = rewards.data.find((r) => r.id === rewardId);
  const linked = Boolean(task && reward && reward.tasks.some((t) => t.id === task.id));

  const toggle = async (r = reward, t = task) => {
    const isLinked = r.tasks.some((x) => x.id === t.id);
    const updated = await run(
      () => (isLinked ? api.unlinkTask(r.id, t.id) : api.linkTask(r.id, t.id)),
      isLinked ? `Unlinked “${t.title}” from ${r.title}` : `Linked “${t.title}” to ${r.title}`
    );
    if (updated) {
      if (r.status === "locked" && updated.status === "unlocked") celebrate([updated]);
      rewards.refresh();
    }
  };

  const withLinks = rewards.data.filter((r) => r.tasks.length > 0);

  return (
    <section>
      <ScreenHeader title="Link rewards to tasks" subtitle="Pick any task and any reward, then link them. A reward unlocks when its linked tasks are done enough times." />

      <div className="rw-link-grid">
        <PickList label="1. Task" rows={taskRows} selected={taskId} onSelect={setTaskId} empty="No tasks yet. Add some inside an area." />
        <PickList
          label="2. Reward"
          rows={rewardRows}
          selected={rewardId}
          onSelect={setRewardId}
          empty={
            <>
              No rewards yet. <a href={links.rewardsList()}>Add one</a>.
            </>
          }
        />
      </div>

      <div className="rw-card rw-link-bar" aria-live="polite">
        {task && reward ? (
          <>
            <p>
              <strong>{task.title}</strong> {linked ? "is linked to" : "→"} <strong>🎁 {reward.title}</strong>
            </p>
            <button type="button" className={`rw-btn ${linked ? "rw-btn--danger" : "rw-btn--primary"}`} disabled={busy} onClick={() => toggle()}>
              {linked ? "Unlink" : "Link"}
            </button>
          </>
        ) : (
          <p className="rw-muted">Pick a task and a reward to link them.</p>
        )}
      </div>

      <div className="rw-section-head">
        <h3>Current links</h3>
      </div>
      {withLinks.length === 0 ? (
        <Empty title="No links yet">Pick a task and a reward above.</Empty>
      ) : (
        <ul className="rw-list">
          {withLinks.map((r) => (
            <li key={r.id} className="rw-card rw-link-row">
              <a href={links.reward(r.id)}>
                <strong>🎁 {r.title}</strong>
              </a>
              <small className="rw-muted">
                {r.progress.current} / {r.progress.target} · {r.status}
              </small>
              <p className="rw-tags">
                {r.tasks.map((t) => (
                  <span key={t.id} className="rw-tag">
                    <a href={links.task(t.id)}>{t.title}</a>
                    <button type="button" className="rw-tag-x" aria-label={`Unlink ${t.title} from ${r.title}`} disabled={busy} onClick={() => toggle(r, t)}>
                      ✕
                    </button>
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
