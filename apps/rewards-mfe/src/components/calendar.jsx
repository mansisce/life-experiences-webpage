// Month calendar for a task: marks the days it was done and lets you pick a day to log.
import { useState } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Local calendar day as "2026-09-29" (not UTC, so late-evening completions land on the right day). */
export function dayKey(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Cells for a Monday-first month grid: leading blanks (null), then each day. */
function monthCells(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const blanks = (first.getDay() + 6) % 7; // getDay(): Sunday = 0
  return [...Array(blanks).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
}

/**
 * `counts` maps dayKey -> completions that day. Future days can't be picked.
 * `selected` is a Date (start of day); `onSelect(date)` is called with the picked day.
 */
export function CompletionCalendar({ counts, selected, onSelect }) {
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const shift = (delta) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  const monthDone = monthCells(month).reduce((sum, d) => sum + (d ? counts[dayKey(d)] ?? 0 : 0), 0);

  return (
    <div className="rw-calendar">
      <div className="rw-calendar-head">
        <button type="button" className="rw-icon-btn" aria-label="Previous month" onClick={() => shift(-1)}>
          ‹
        </button>
        <strong aria-live="polite">
          {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          <small className="rw-muted"> · done {monthDone}×</small>
        </strong>
        <button type="button" className="rw-icon-btn" aria-label="Next month" disabled={isCurrentMonth} onClick={() => shift(1)}>
          ›
        </button>
      </div>
      <div className="rw-calendar-grid" role="grid">
        {WEEKDAYS.map((d) => (
          <span key={d} className="rw-calendar-weekday" aria-hidden="true">
            {d.slice(0, 2)}
          </span>
        ))}
        {monthCells(month).map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />;
          const key = dayKey(date);
          const done = counts[key] ?? 0;
          const future = date > today;
          const label = `${date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}${done ? `, done ${done} time${done === 1 ? "" : "s"}` : ""}`;
          return (
            <button
              key={key}
              type="button"
              className={["rw-day", done && "rw-day--done", key === dayKey(today) && "rw-day--today", key === dayKey(selected) && "is-selected"].filter(Boolean).join(" ")}
              aria-label={label}
              aria-pressed={key === dayKey(selected)}
              disabled={future}
              onClick={() => onSelect(date)}
            >
              {date.getDate()}
              {done > 1 && <small>{done}</small>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
