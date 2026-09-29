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

export function Toasts({ items, onDismiss }) {
  return (
    <div className="rw-toasts" aria-live="polite">
      {items.map((t) => (
        <button key={t.id} type="button" className={`rw-toast rw-toast--${t.kind}`} onClick={() => onDismiss(t.id)}>
          {t.message}
        </button>
      ))}
    </div>
  );
}

export function formatWhen(iso) {
  return new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
