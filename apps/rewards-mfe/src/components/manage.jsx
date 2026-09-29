// Tile and area management, shared by the Areas tab and the Rewards tab so both edit the same way.
import { useState } from "react";
import { useRewards } from "../context.js";
import { useAction } from "./ui.jsx";
import { DeleteTileDialog, moveItem, TileForm } from "./tiles.jsx";

export function StarterButton({ onAdded, primary = false }) {
  const { api, toast } = useRewards();
  const [busy, run] = useAction(toast);
  const add = async () => {
    const result = await run(() => api.addStarterSet());
    if (!result) return;
    toast(
      result.tilesAdded || result.areasAdded
        ? `Added ${result.tilesAdded} tiles and ${result.areasAdded} areas`
        : "You already have all the suggested tiles"
    );
    onAdded();
  };
  return (
    <button type="button" className={`rw-btn ${primary ? "rw-btn--primary" : ""}`} disabled={busy} onClick={add}>
      {busy ? "Adding…" : "Add suggested tiles"}
    </button>
  );
}

function EditableTileRow({ tile, index, count, busy, onMove, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <li>
        <TileForm
          initial={tile}
          submitLabel="Save"
          busy={busy}
          onCancel={() => setEditing(false)}
          onSubmit={async (changes) => (await onSave(tile, changes)) && setEditing(false)}
        />
      </li>
    );
  }
  return (
    <li className="rw-row">
      <span className="rw-row-main">
        <strong>
          {tile.icon} {tile.name}
        </strong>
        <small>{tile.areas.length} areas</small>
      </span>
      <div className="rw-row-actions">
        <button type="button" className="rw-icon-btn" aria-label={`Move ${tile.name} up`} disabled={busy || index === 0} onClick={() => onMove(index, -1)}>
          ↑
        </button>
        <button type="button" className="rw-icon-btn" aria-label={`Move ${tile.name} down`} disabled={busy || index === count - 1} onClick={() => onMove(index, 1)}>
          ↓
        </button>
        <button type="button" className="rw-icon-btn" aria-label={`Edit ${tile.name}`} onClick={() => setEditing(true)}>
          ✎
        </button>
        <button type="button" className="rw-icon-btn" aria-label={`Delete ${tile.name}`} onClick={() => onDelete(tile)}>
          🗑
        </button>
      </div>
    </li>
  );
}

/** "Edit tiles" mode: reorder, rename, change icon, delete, add a tile or the suggested set. */
export function TileManager({ tiles, onChanged }) {
  const { api, toast } = useRewards();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, run] = useAction(toast);

  const move = async (index, delta) => {
    const reordered = moveItem(tiles, index, delta);
    if (reordered !== tiles && (await run(() => api.reorderTiles(reordered.map((t) => t.id))))) onChanged();
  };
  const save = async (tile, changes) => {
    const ok = await run(() => api.updateTile(tile.id, changes), "Saved");
    if (ok) onChanged();
    return Boolean(ok);
  };
  const create = async (tile) => {
    if (await run(() => api.createTile(tile), `Created ${tile.name}`)) {
      setCreating(false);
      onChanged();
    }
  };

  return (
    <>
      <ul className="rw-list">
        {tiles.map((t, i) => (
          <EditableTileRow key={t.id} tile={t} index={i} count={tiles.length} busy={busy} onMove={move} onSave={save} onDelete={setDeleting} />
        ))}
      </ul>
      {creating ? (
        <TileForm submitLabel="Create tile" busy={busy} onSubmit={create} onCancel={() => setCreating(false)} />
      ) : (
        <div className="rw-inline-form">
          <button type="button" className="rw-btn rw-btn--primary" onClick={() => setCreating(true)}>
            + New tile
          </button>
          <StarterButton onAdded={onChanged} />
        </div>
      )}
      {deleting && <DeleteTileDialog tile={deleting} onCancel={() => setDeleting(null)} onDeleted={() => (setDeleting(null), onChanged())} />}
    </>
  );
}

/** The "Edit tiles" / "Done" toggle for a screen header. */
export function EditTilesButton({ editing, onToggle }) {
  return (
    <button type="button" className="rw-btn" aria-pressed={editing} onClick={onToggle}>
      {editing ? "Done" : "Edit tiles"}
    </button>
  );
}

/**
 * Edit / delete one tile from its own screen. Returns the header buttons and the panel
 * (form or delete dialog) separately, since they render in different places.
 */
export function useTileEditing(tile, { onSaved, onDeleted }) {
  const { api, toast } = useRewards();
  const [mode, setMode] = useState(null); // null | "edit" | "delete"
  const [busy, run] = useAction(toast);

  const save = async (changes) => {
    if (await run(() => api.updateTile(tile.id, changes), "Saved")) {
      setMode(null);
      onSaved();
    }
  };

  const actions = mode !== "edit" && (
    <div className="rw-row-actions">
      <button type="button" className="rw-icon-btn" aria-label={`Edit ${tile.name}`} onClick={() => setMode("edit")}>
        ✎
      </button>
      <button type="button" className="rw-icon-btn" aria-label={`Delete ${tile.name}`} onClick={() => setMode("delete")}>
        🗑
      </button>
    </div>
  );
  const panel =
    mode === "edit" ? (
      <TileForm initial={tile} submitLabel="Save" busy={busy} onSubmit={save} onCancel={() => setMode(null)} />
    ) : mode === "delete" ? (
      <DeleteTileDialog tile={tile} onCancel={() => setMode(null)} onDeleted={onDeleted} />
    ) : null;
  return { actions, panel };
}

function AreaRow({ area, href, subtitle, index, count, onMove, onRename, onDelete, busy }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(area.name);

  if (editing) {
    return (
      <li className="rw-row">
        <form
          className="rw-inline-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await onRename(area, name)) setEditing(false);
          }}
        >
          <input aria-label="Area name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus required />
          <button type="submit" className="rw-btn rw-btn--primary" disabled={busy}>
            Save
          </button>
          <button type="button" className="rw-btn" onClick={() => (setEditing(false), setName(area.name))}>
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="rw-row">
      <a className="rw-row-main" href={href}>
        <strong>{area.name}</strong>
        <small>{subtitle}</small>
      </a>
      <div className="rw-row-actions">
        <button type="button" className="rw-icon-btn" aria-label={`Move ${area.name} up`} disabled={busy || index === 0} onClick={() => onMove(index, -1)}>
          ↑
        </button>
        <button type="button" className="rw-icon-btn" aria-label={`Move ${area.name} down`} disabled={busy || index === count - 1} onClick={() => onMove(index, 1)}>
          ↓
        </button>
        <button type="button" className="rw-icon-btn" aria-label={`Rename ${area.name}`} onClick={() => setEditing(true)}>
          ✎
        </button>
        <button type="button" className="rw-icon-btn" aria-label={`Delete ${area.name}`} disabled={busy} onClick={() => onDelete(area)}>
          🗑
        </button>
      </div>
    </li>
  );
}

/**
 * A tile's areas with reorder / rename / delete, plus "add area".
 * `href(area)` and `subtitle(area)` let each tab link rows to its own screen and show its own counts.
 */
export function AreaManager({ tile, href, subtitle, onChanged, emptyText = "Add the first one below." }) {
  const { api, toast } = useRewards();
  const [newName, setNewName] = useState("");
  const [busy, run] = useAction(toast);

  const move = async (index, delta) => {
    const reordered = moveItem(tile.areas, index, delta);
    if (reordered !== tile.areas && (await run(() => api.reorderAreas(tile.id, reordered.map((a) => a.id))))) onChanged();
  };
  const add = async (e) => {
    e.preventDefault();
    if (await run(() => api.createArea(tile.id, newName.trim()), `Added ${newName.trim()}`)) {
      setNewName("");
      onChanged();
    }
  };
  const rename = async (area, name) => {
    const ok = await run(() => api.renameArea(area.id, name.trim()), "Renamed");
    if (ok) onChanged();
    return Boolean(ok);
  };
  const remove = async (area) => {
    const warning = area.activeTaskCount
      ? `Delete "${area.name}" and its ${area.activeTaskCount} active task(s), with all their history? Its rewards move to the whole tile.`
      : `Delete "${area.name}"? Its rewards move to the whole tile.`;
    if (!window.confirm(warning)) return;
    if (await run(async () => (await api.deleteArea(area.id), true), `Deleted ${area.name}`)) onChanged();
  };

  return (
    <>
      {tile.areas.length === 0 ? (
        <div className="rw-state rw-state--empty">
          <strong>No areas yet</strong>
          <p>{emptyText}</p>
        </div>
      ) : (
        <ul className="rw-list">
          {tile.areas.map((a, i) => (
            <AreaRow
              key={a.id}
              area={a}
              href={href(a)}
              subtitle={subtitle(a)}
              index={i}
              count={tile.areas.length}
              onMove={move}
              onRename={rename}
              onDelete={remove}
              busy={busy}
            />
          ))}
        </ul>
      )}
      <form className="rw-card rw-inline-form" onSubmit={add}>
        <input aria-label="New area name" placeholder="New area, e.g. Study corner" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={80} required />
        <button type="submit" className="rw-btn rw-btn--primary" disabled={busy || !newName.trim()}>
          Add area
        </button>
      </form>
    </>
  );
}
