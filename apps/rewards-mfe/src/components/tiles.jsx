import { useEffect, useRef, useState } from "react";
import { useRewards } from "../context.js";
import { useResource } from "../lib/useResource.js";
import { ErrorState, Loading, useAction } from "./ui.jsx";

const ICON_CHOICES = ["🏠", "💼", "🎉", "🧸", "📚", "🌿", "💪", "🧘", "🍳", "🚗", "💰", "📁"];

/** Returns a copy of `list` with the item at `index` moved by `delta` (-1 up, +1 down). */
export function moveItem(list, index, delta) {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * Create or edit a tile: name, an emoji icon (quick picks, or type any emoji) and whether it uses areas.
 * A tile without areas holds its tasks directly (HLR-13); it can only switch areas off while it has none.
 */
export function TileForm({ initial, submitLabel, busy, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "📁");
  const [useAreas, setUseAreas] = useState(initial?.useAreas ?? true);
  const visibleAreas = initial?.areas.filter((a) => !a.hidden).length ?? 0;
  const lockedOn = initial?.useAreas && visibleAreas > 0;

  return (
    <form
      className="rw-card rw-form"
      aria-label={initial ? `Edit ${initial.name}` : "New tile"}
      onSubmit={(e) => {
        e.preventDefault();
        const changes = { name: name.trim(), icon: icon.trim() || "📁" };
        onSubmit(useAreas === (initial?.useAreas ?? true) ? changes : { ...changes, useAreas });
      }}
    >
      <div className="rw-inline-form">
        <input aria-label="Tile icon" className="rw-icon-input" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={16} />
        <input aria-label="Tile name" placeholder="Tile name, e.g. Shiragi" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus required />
      </div>
      <div className="rw-chips" role="radiogroup" aria-label="Pick an icon">
        {ICON_CHOICES.map((choice) => (
          <button key={choice} type="button" role="radio" aria-checked={icon === choice} className={icon === choice ? "is-on" : ""} onClick={() => setIcon(choice)}>
            {choice}
          </button>
        ))}
      </div>
      <label className="rw-check">
        <input type="checkbox" checked={useAreas} disabled={lockedOn} onChange={(e) => setUseAreas(e.target.checked)} />
        Use areas (e.g. Household › Kitchen)
      </label>
      <small className="rw-muted">
        {lockedOn
          ? `To switch areas off, move or delete its ${visibleAreas} area${visibleAreas === 1 ? "" : "s"} first.`
          : useAreas
            ? initial && !initial.useAreas
              ? "Its tasks stay, in an area called General."
              : "Tasks go inside areas of this tile."
            : "No areas: tasks, rewards and notes go straight on the tile."}
      </small>
      <div className="rw-inline-form">
        <button type="submit" className="rw-btn rw-btn--primary" disabled={busy || !name.trim()}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="rw-btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** "2 areas, 5 tasks, 1 reward and 3 contacts" — always areas, tasks and completions; the rest only when present. */
function removedList(p) {
  const optional = [
    [p.rewards, "reward"],
    [p.notes, "note"],
    [p.contacts, "contact"],
    [p.files, "file"],
  ].filter(([n]) => n > 0);
  const parts = [[p.areas, "area"], [p.tasks, "task"], [p.completions, "completion"], ...optional].map(([n, word]) => plural(n, word));
  return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}

/** Deleting a tile removes everything under it, so it's previewed and needs the name typed (LLR-1.12). */
export function DeleteTileDialog({ tile, onCancel, onDeleted }) {
  const { api, toast } = useRewards();
  const preview = useResource(() => api.tileDeletePreview(tile.id), [api, tile.id]);
  const [typed, setTyped] = useState("");
  const [busy, run] = useAction(toast);
  const inputRef = useRef(null);
  const matches = typed.trim().toLowerCase() === tile.name.toLowerCase();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const confirm = async (e) => {
    e.preventDefault();
    const done = await run(async () => (await api.deleteTile(tile.id, typed.trim()), true), `Deleted ${tile.name}. A backup was saved first.`);
    if (done) onDeleted();
  };

  return (
    <div className="rw-overlay" role="presentation" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="rw-card rw-form rw-dialog" role="alertdialog" aria-modal="true" aria-labelledby="rw-delete-title" onSubmit={confirm}>
        <h3 id="rw-delete-title">
          Delete {tile.icon} {tile.name}?
        </h3>
        {preview.loading && preview.data === undefined ? (
          <Loading label="Counting what's inside…" />
        ) : preview.error ? (
          <ErrorState error={preview.error} onRetry={preview.reload} />
        ) : (
          <p>
            This removes {removedList(preview.data)}
            {preview.data.rewardsLosingTasks > 0 && `; ${plural(preview.data.rewardsLosingTasks, "reward")} elsewhere will lose tagged tasks`}. A backup is saved first.
          </p>
        )}
        <label className="rw-field-label" htmlFor="rw-delete-confirm">
          Type “{tile.name}” to confirm
        </label>
        <input id="rw-delete-confirm" ref={inputRef} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoFocus />
        <div className="rw-inline-form">
          <button type="submit" className="rw-btn rw-btn--danger" disabled={!matches || busy}>
            {busy ? "Deleting…" : "Delete tile"}
          </button>
          <button type="button" className="rw-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
