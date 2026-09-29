import { useState } from "react";
import { useRewards } from "../context.js";
import { useResource } from "../lib/useResource.js";
import {
  Chips,
  Empty,
  ErrorState,
  formatWhen,
  FREQUENCIES,
  Loading,
  PRIORITIES,
  ProgressBar,
  RELEVANCE,
  Resource,
  ScreenHeader,
  STATUSES,
  useAction,
} from "../components/ui.jsx";

const WHEN = [
  ["0", "Now"],
  ["1", "Yesterday"],
  ["2", "2 days ago"],
];

function LogCompletion({ task, onLogged }) {
  const { api, toast, celebrate } = useRewards();
  const [note, setNote] = useState("");
  const [daysAgo, setDaysAgo] = useState("0");
  const [busy, run] = useAction(toast);

  if (task.status !== "active") {
    return <p className="rw-muted rw-card">This task is {task.status}. Set it back to Active to log more completions.</p>;
  }

  const submit = async (e) => {
    e.preventDefault();
    // Backfill: "I did this yesterday" keeps the same time of day, one or two days back.
    const completedAt = daysAgo === "0" ? undefined : new Date(Date.now() - Number(daysAgo) * 86_400_000).toISOString();
    const result = await run(() => api.completeTask(task.id, { note: note.trim(), completedAt }), "Completion logged");
    if (result) {
      setNote("");
      setDaysAgo("0");
      celebrate(result.unlockedRewards);
      onLogged();
    }
  };

  return (
    <form className="rw-card rw-form" onSubmit={submit} aria-label="Log a completion">
      <h3>Log a completion</h3>
      <Chips label="When" options={WHEN} value={daysAgo} onChange={setDaysAgo} />
      <input aria-label="Note (optional)" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
      <button type="submit" className="rw-btn rw-btn--primary rw-btn--block" disabled={busy}>
        {busy ? "Logging…" : "✓ Done"}
      </button>
    </form>
  );
}

function ActivityLog({ taskId, reloadKey }) {
  const { api } = useRewards();
  const log = useResource(() => api.activity(taskId), [api, taskId, reloadKey]);
  if (log.loading && log.data === undefined) return <Loading label="Loading activity…" />;
  if (log.error && log.data === undefined) return <ErrorState error={log.error} onRetry={log.reload} />;
  if (log.data.length === 0) return <Empty title="No completions yet">Log the first one above.</Empty>;
  return (
    <ol className="rw-timeline">
      {log.data.map((entry) => (
        <li key={entry.id}>
          <time dateTime={entry.completedAt}>{formatWhen(entry.completedAt)}</time>
          {entry.note && <p>{entry.note}</p>}
        </li>
      ))}
    </ol>
  );
}

function TaskRewards({ task, onChanged }) {
  const { api, links, toast, celebrate } = useRewards();
  const { area } = task;
  // LLR-4.15: only locked "Selected tasks" rewards whose scope contains this task can be tagged.
  const rewards = useResource(() => api.rewards({ status: "locked", categoryId: area.categoryId }), [api, area.categoryId, task.rewards.length]);
  const [choice, setChoice] = useState("");
  const [busy, run] = useAction(toast);

  const linkedIds = new Set(task.rewards.map((r) => r.id));
  const available = (rewards.data ?? []).filter(
    (r) => !linkedIds.has(r.id) && r.matchMode === "selected" && (!r.areaId || r.areaId === area.id)
  );
  const newHere = links.rewards({ tile: area.categoryId, area: area.id, new: 1 });

  const tag = async () => {
    const reward = available.find((r) => String(r.id) === choice);
    if (!reward) return;
    const updated = await run(() => api.setRewardTasks(reward.id, [...reward.tasks.map((t) => t.id), task.id]), `Tagged to “${reward.title}”`);
    if (updated) {
      if (updated.status === "unlocked") celebrate([updated]);
      setChoice("");
      onChanged();
    }
  };

  return (
    <div className="rw-card">
      <h3>Rewards</h3>
      {task.rewards.length === 0 ? (
        <p className="rw-muted">Doesn't count towards any reward yet.</p>
      ) : (
        <ul className="rw-mini-list">
          {task.rewards.map((r) => (
            <li key={r.id}>
              <a href={links.rewards({ area: area.id })}>
                {r.title}
                {r.match === "scope" && <small className="rw-muted"> · Counts automatically</small>}
              </a>
              <span className={`rw-status rw-status--${r.status}`}>{r.status}</span>
              <ProgressBar percent={r.progressPercent} label={`${r.title} progress`} />
            </li>
          ))}
        </ul>
      )}
      {rewards.error ? (
        <ErrorState error={rewards.error} onRetry={rewards.reload} />
      ) : available.length > 0 ? (
        <div className="rw-inline-form">
          <select aria-label="Reward to tag" className="rw-select" value={choice} onChange={(e) => setChoice(e.target.value)}>
            <option value="">Tag to a reward…</option>
            {available.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
          <button type="button" className="rw-btn" disabled={!choice || busy} onClick={tag}>
            Tag
          </button>
        </div>
      ) : (
        !rewards.loading && (
          <p className="rw-muted">
            <a href={newHere}>{task.rewards.length ? "Create another reward" : "Create a reward"}</a> for {area.name} to work towards.
          </p>
        )
      )}
    </div>
  );
}

export default function TaskScreen({ taskId }) {
  const { api, links, toast } = useRewards();
  const task = useResource(() => api.task(taskId), [api, taskId]);
  const [logKey, setLogKey] = useState(0);
  const [busy, run] = useAction(toast);

  const update = async (changes) => {
    if (await run(() => api.updateTask(taskId, changes), "Saved")) task.refresh();
  };

  return (
    <Resource resource={task} loadingLabel="Loading task…">
      {(t) => (
        <section>
          <ScreenHeader
            crumbs={[
              ["All tiles", links.tiles()],
              [t.area.name, links.area(t.area.id)],
            ]}
            title={t.title}
            subtitle={t.source === "ai" ? "Suggested by AI" : "Added manually"}
          />
          {t.notes && <p className="rw-notes">{t.notes}</p>}

          <dl className="rw-stats">
            <div>
              <dt>Current streak</dt>
              <dd>🔥 {t.currentStreak}</dd>
            </div>
            <div>
              <dt>Best streak</dt>
              <dd>{t.bestStreak}</dd>
            </div>
            <div>
              <dt>Completions</dt>
              <dd>{t.completionCount}</dd>
            </div>
          </dl>

          <LogCompletion task={t} onLogged={() => (task.refresh(), setLogKey((k) => k + 1))} />

          <TaskRewards task={t} onChanged={task.refresh} />

          <div className="rw-card rw-form" aria-busy={busy}>
            <h3>Settings</h3>
            <span className="rw-field-label">Priority</span>
            <Chips label="Priority" options={PRIORITIES} value={t.priority} onChange={(priority) => update({ priority })} />
            <span className="rw-field-label">Frequency</span>
            <Chips label="Frequency" options={FREQUENCIES} value={t.frequency} onChange={(frequency) => update({ frequency })} />
            <span className="rw-field-label">Status</span>
            <Chips label="Status" options={STATUSES} value={t.status} onChange={(status) => update({ status })} />
            <span className="rw-field-label">Relevance</span>
            <Chips label="Relevance" options={RELEVANCE} value={t.relevance} onChange={(relevance) => update({ relevance })} />
          </div>

          <div className="rw-section-head">
            <h3>Activity log</h3>
          </div>
          <ActivityLog taskId={taskId} reloadKey={logKey} />
        </section>
      )}
    </Resource>
  );
}
