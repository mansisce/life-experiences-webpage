import { useState } from "react";
import { useRewards } from "../context.js";
import { navigate } from "../lib/router.js";
import { useResource } from "../lib/useResource.js";
import { CompletionCalendar, dayKey, startOfDay } from "../components/calendar.jsx";
import { PlanFields } from "../components/plan.jsx";
import {
  fromLocalInput,
  PlanBadges,
  toLocalInput,
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

const timeNow = () => new Date().toTimeString().slice(0, 5); // "HH:MM", local

/** Pick a day on the calendar (and optionally a time), add a note, log it. */
function LogCompletion({ task, log, onLogged }) {
  const { api, toast, completed } = useRewards();
  const [day, setDay] = useState(() => startOfDay(new Date()));
  const [time, setTime] = useState(timeNow);
  const [note, setNote] = useState("");
  const [busy, run] = useAction(toast);

  const counts = {};
  for (const entry of log.data ?? []) {
    const key = dayKey(new Date(entry.completedAt));
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const isToday = dayKey(day) === dayKey(new Date());
  const dayText = isToday ? "today" : day.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

  if (task.status !== "active") {
    return (
      <div className="rw-card rw-form">
        <h3>Completions</h3>
        <CompletionCalendar counts={counts} selected={day} onSelect={setDay} />
        <p className="rw-muted">This task is {task.status}. Set it back to Active to log more completions.</p>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    const [hours, minutes] = time.split(":").map(Number);
    const when = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours || 0, minutes || 0);
    const completedAt = new Date(Math.min(when.getTime(), Date.now())).toISOString(); // never in the future
    const result = await run(() => api.completeTask(task.id, { note: note.trim(), completedAt }));
    if (result) {
      setNote("");
      setTime(timeNow());
      completed(result);
      onLogged();
    }
  };

  return (
    <form className="rw-card rw-form" onSubmit={submit} aria-label="Log a completion">
      <h3>Log a completion</h3>
      <CompletionCalendar counts={counts} selected={day} onSelect={setDay} />
      <div className="rw-log-when">
        <span>
          Done <strong>{dayText}</strong> at
        </span>
        <input type="time" aria-label="Time" value={time} onChange={(e) => setTime(e.target.value)} required />
        {!isToday && (
          <button type="button" className="rw-link-btn" onClick={() => (setDay(startOfDay(new Date())), setTime(timeNow()))}>
            Back to today
          </button>
        )}
      </div>
      <input aria-label="Note (optional)" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
      <button type="submit" className="rw-btn rw-btn--primary rw-btn--block" disabled={busy}>
        {busy ? "Logging…" : `✓ Done ${dayText}`}
      </button>
    </form>
  );
}

function ActivityLog({ log }) {
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

/** Milestone, announce/silent, due date/time and days to complete: all optional and independent (BR-R26). */
function PlanningCard({ task, onSaved }) {
  const { api, toast } = useRewards();
  const initial = {
    isMilestone: task.isMilestone,
    visibility: task.visibility,
    dueAt: toLocalInput(task.dueAt),
    targetDays: task.targetDays ? String(task.targetDays) : "",
  };
  const [plan, setPlan] = useState(initial);
  const [busy, run] = useAction(toast);
  const changed = JSON.stringify(plan) !== JSON.stringify(initial);
  const save = async () => {
    const body = { ...plan, dueAt: fromLocalInput(plan.dueAt), targetDays: plan.targetDays ? Number(plan.targetDays) : null };
    if (await run(() => api.updateTask(task.id, body), "Planning saved")) onSaved();
  };
  return (
    <div className="rw-card rw-form">
      <h3>Planning</h3>
      <PlanFields value={plan} onChange={(changes) => setPlan((p) => ({ ...p, ...changes }))} />
      <div className="rw-inline-form">
        <button type="button" className="rw-btn rw-btn--primary" disabled={busy || !changed} onClick={save}>
          {busy ? "Saving…" : "Save planning"}
        </button>
        {(plan.dueAt || plan.targetDays) && (
          <button type="button" className="rw-link-btn" onClick={() => setPlan((p) => ({ ...p, dueAt: "", targetDays: "" }))}>
            Clear dates
          </button>
        )}
      </div>
    </div>
  );
}

/** Edit a task's title and notes. */
function EditTaskForm({ task, onSaved, onCancel }) {
  const { api, toast } = useRewards();
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const [busy, run] = useAction(toast);
  const submit = async (e) => {
    e.preventDefault();
    if (await run(() => api.updateTask(task.id, { title: title.trim(), notes: notes.trim() }), "Saved")) onSaved();
  };
  return (
    <form className="rw-card rw-form" onSubmit={submit} aria-label="Edit task">
      <h3>Edit task</h3>
      <input aria-label="Task title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} autoFocus required />
      <textarea aria-label="Notes" placeholder="Notes (optional)" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
      <div className="rw-inline-form">
        <button type="submit" className="rw-btn rw-btn--primary" disabled={busy || !title.trim()}>
          {busy ? "Saving…" : "Save"}
        </button>
        <button type="button" className="rw-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Rewards this task counts towards; linking happens on the Link screen, with this task picked. */
function TaskRewards({ task }) {
  const { links } = useRewards();
  return (
    <div className="rw-card">
      <div className="rw-reward-head">
        <h3>Rewards</h3>
        <a className="rw-link-btn" href={links.link({ task: task.id })}>
          + Link to a reward
        </a>
      </div>
      {task.rewards.length === 0 ? (
        <p className="rw-muted">Not linked to any reward yet.</p>
      ) : (
        <ul className="rw-mini-list">
          {task.rewards.map((r) => (
            <li key={r.id}>
              <a href={links.reward(r.id)}>
                {r.title}
                {r.match === "scope" && <small className="rw-muted"> · Counts automatically</small>}
              </a>
              <span className={`rw-status rw-status--${r.status}`}>{r.status}</span>
              <ProgressBar percent={r.progressPercent} label={`${r.title} progress`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TaskScreen({ taskId }) {
  const { api, links, toast } = useRewards();
  const task = useResource(() => api.task(taskId), [api, taskId]);
  const log = useResource(() => api.activity(taskId), [api, taskId]);
  const [editing, setEditing] = useState(false);
  const [busy, run] = useAction(toast);

  const remove = async (t) => {
    const history = t.completionCount ? ` and its ${t.completionCount} completion${t.completionCount === 1 ? "" : "s"}` : "";
    if (!window.confirm(`Delete “${t.title}”${history}? Rewards it counted towards stay.`)) return;
    if (await run(async () => (await api.deleteTask(t.id), true), `Deleted ${t.title}`)) navigate(links.area(t.area.id));
  };

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
            actions={
              !editing && (
                <div className="rw-row-actions">
                  <button type="button" className="rw-icon-btn" aria-label={`Edit ${t.title}`} onClick={() => setEditing(true)}>
                    ✎
                  </button>
                  <button type="button" className="rw-icon-btn" aria-label={`Delete ${t.title}`} disabled={busy} onClick={() => remove(t)}>
                    🗑
                  </button>
                </div>
              )
            }
          />
          {editing ? (
            <EditTaskForm task={t} onCancel={() => setEditing(false)} onSaved={() => (setEditing(false), task.refresh())} />
          ) : (
            t.notes && <p className="rw-notes">{t.notes}</p>
          )}

          <PlanBadges task={t} detail />

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

          <LogCompletion task={t} log={log} onLogged={() => (task.refresh(), log.refresh())} />

          <TaskRewards task={t} />

          <PlanningCard key={`${t.isMilestone}-${t.visibility}-${t.dueAt}-${t.targetDays}`} task={t} onSaved={task.refresh} />

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
          <ActivityLog log={log} />
        </section>
      )}
    </Resource>
  );
}
