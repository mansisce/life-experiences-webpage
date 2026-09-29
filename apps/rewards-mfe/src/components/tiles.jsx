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

/** Create or edit a tile: name plus an emoji icon (quick picks, or type any emoji). */
export function TileForm({ initial, submitLabel, busy, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "📁");

  return (
    <form
      className="rw-card rw-form"
      aria-label={initial ? `Edit ${initial.name}` : "New tile"}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name: name.trim(), icon: icon.trim() || "📁" });
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
            This removes {plural(preview.data.areas, "area")}, {plural(preview.data.tasks, "task")} and {plural(preview.data.completions, "completion")}
            {preview.data.rewardsLosingTasks > 0 && `; ${plural(preview.data.rewardsLosingTasks, "reward")} will lose tagged tasks`}. A backup is saved first.
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
