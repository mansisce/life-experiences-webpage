import { useState } from "react";

export const PRIORITIES = [
  ["high", "High"],
  ["medium", "Med"],
  ["low", "Low"],
];
export const FREQUENCIES = [
  ["daily", "Daily"],
  ["weekly", "Weekly"],
  ["one_off", "One-off"],
];
export const STATUSES = [
  ["active", "Active"],
  ["done", "Done"],
  ["archived", "Archived"],
];
export const RELEVANCE = [
  ["relevant", "Relevant"],
  ["not_relevant", "Not relevant"],
  ["ignore", "Ignored"],
];

export const labelOf = (options, value) => options.find(([v]) => v === value)?.[1] ?? value;

export function Loading({ label = "Loading…" }) {
  return (
    <div className="rw-state" role="status" aria-live="polite">
      <span className="rw-spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="rw-state rw-state--error" role="alert">
      <p>{error?.message || "Something went wrong."}</p>
      {onRetry && (
        <button type="button" className="rw-btn" onClick={() => onRetry()}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="rw-state rw-state--empty">
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}

/** Renders loading / error / content for a useResource() result. */
export function Resource({ resource, loadingLabel, children }) {
  if (resource.loading && resource.data === undefined) return <Loading label={loadingLabel} />;
  if (resource.error && resource.data === undefined) return <ErrorState error={resource.error} onRetry={resource.reload} />;
  return children(resource.data);
}

export function PriorityBadge({ priority }) {
  return <span className={`rw-badge rw-badge--${priority}`}>{labelOf(PRIORITIES, priority)}</span>;
}

export function StreakBadge({ current, best }) {
  if (!current && !best) return null;
  return (
    <span className="rw-streak" title={`Current streak ${current}, best ${best}`}>
      🔥 {current}
      {best > current && <small> / best {best}</small>}
    </span>
  );
}

export function ProgressBar({ percent, label }) {
  return (
    <div className="rw-progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}

export function ScreenHeader({ crumbs = [], title, subtitle, actions }) {
  return (
    <header className="rw-screen-header">
      {crumbs.length > 0 && (
        <nav className="rw-crumbs" aria-label="Breadcrumb">
          {crumbs.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
      )}
      <div className="rw-screen-title">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions}
      </div>
    </header>
  );
}

/** Link tabs within a screen (each tab has its own URL, so it can be deep-linked). */
export function SubTabs({ tabs, label }) {
  return (
    <nav className="rw-subtabs" aria-label={label}>
      {tabs.map(([text, href, current]) => (
        <a key={href} href={href} aria-current={current ? "page" : undefined}>
          {text}
        </a>
      ))}
    </nav>
  );
}

/** Segmented single-choice control; `allowNone` adds an "All" option for filters. */
export function Chips({ options, value, onChange, allowNone = false, label }) {
  const all = allowNone ? [["", "All"], ...options] : options;
  return (
    <div className="rw-chips" role="radiogroup" aria-label={label}>
      {all.map(([v, text]) => (
        <button
          key={v || "all"}
          type="button"
          role="radio"
          aria-checked={(value || "") === v}
          className={(value || "") === v ? "is-on" : ""}
          onClick={() => onChange(v)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/** Wraps an async action with a pending flag and error toast, so buttons can't double-submit. */
export function useAction(toast) {
  const [pending, setPending] = useState(false);
  const run = async (fn, successMessage) => {
    if (pending) return undefined;
    setPending(true);
    try {
      const result = await fn();
      if (successMessage) toast(successMessage);
      return result;
    } catch (error) {
      toast(error.message, "error");
      return undefined;
    } finally {
      setPending(false);
    }
  };
  return [pending, run];
}

/** Toasts dismiss on tap; one can carry a link, e.g. "Share on WhatsApp". */
export function Toasts({ items, onDismiss }) {
  return (
    <div className="rw-toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`rw-toast rw-toast--${t.kind}`}>
          <button type="button" className="rw-toast-text" onClick={() => onDismiss(t.id)}>
            {t.message}
          </button>
          {t.action && (
            <a className="rw-toast-action" href={t.action.href} target="_blank" rel="noreferrer" onClick={() => onDismiss(t.id)}>
              {t.action.label}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Task planning (HLR-11) ──────────────────────────────────────────────────────

const DAY_MS = 86_400_000;
const startOfLocalDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Due chip text and tone: "Overdue", "Due today", "Due in 3 days" (within a week) or "Due 31 Oct". */
export function dueInfo(task, now = new Date()) {
  if (!task.dueAt) return null;
  const due = new Date(task.dueAt);
  if (task.overdue) return { text: "Overdue", tone: "overdue" };
  if (task.status !== "active") return { text: `Due ${due.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`, tone: "plain" };
  const days = Math.round((startOfLocalDay(due) - startOfLocalDay(now)) / DAY_MS);
  if (days <= 0) return { text: `Due today, ${due.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`, tone: "soon" };
  if (days < 7) return { text: `Due in ${days} day${days === 1 ? "" : "s"}`, tone: "soon" };
  return { text: `Due ${due.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`, tone: "plain" };
}

/** "Day 4 of 30", counted from the day the task was created (LLR-11.9). */
export function planDay(task, now = new Date()) {
  if (!task.targetDays) return null;
  const day = Math.floor((startOfLocalDay(now) - startOfLocalDay(new Date(task.createdAt))) / DAY_MS) + 1;
  return `Day ${Math.max(1, day)} of ${task.targetDays}`;
}

/** 🏁 milestone, 🔕 silent, due chip and planned days, for task rows and task detail. */
export function PlanBadges({ task, detail = false }) {
  const due = dueInfo(task);
  const planned = task.targetDays && `Planned: ${task.targetDays} days${detail ? ` · ${planDay(task)}` : ""}`;
  if (!task.isMilestone && task.visibility !== "silent" && !due && !planned) return null;
  return (
    <span className="rw-plan">
      {task.isMilestone && <span className="rw-chip rw-chip--milestone">🏁 Milestone</span>}
      {task.visibility === "silent" && (
        <span className="rw-chip" title="Silent: completed quietly, not celebrated">
          🔕 Silent
        </span>
      )}
      {due && <span className={`rw-chip rw-chip--${due.tone}`}>{due.text}</span>}
      {planned && <span className="rw-chip">{planned}</span>}
    </span>
  );
}

/** "2026-10-31T18:00" for <input type="datetime-local"> from an ISO string (local time). */
export function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** A datetime-local value is the browser's local time; send it as an ISO instant. */
export const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);

export function formatWhen(iso) {
  return new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
