import { useState } from "react";
import { useRewards } from "../context.js";
import { useResource } from "../lib/useResource.js";
import { ErrorState, Loading, ScreenHeader, useAction } from "../components/ui.jsx";
import { DeleteTileDialog, moveItem, TileForm } from "../components/tiles.jsx";
import { DetailsSearch } from "../components/details.jsx";

function StarterButton({ onAdded, primary = false }) {
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

function FirstTile({ onChanged }) {
  const { api, toast } = useRewards();
  const [busy, run] = useAction(toast);
  return (
    <div className="rw-onboarding">
      <div className="rw-state rw-state--empty">
        <strong>Create your first tile</strong>
        <p>Tiles are the big parts of your life, like Home, Work or Shiragi. Areas and tasks go inside them.</p>
      </div>
      <TileForm
        submitLabel="Create tile"
        busy={busy}
        onSubmit={async (tile) => (await run(() => api.createTile(tile), `Created ${tile.name}`)) && onChanged()}
      />
      <div className="rw-starter">
        <p className="rw-muted">Or start from suggestions: Career / Office / Work, Household (13 areas) and Fun. You can rename or delete any of them.</p>
        <StarterButton onAdded={onChanged} />
      </div>
    </div>
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

export default function TilesScreen() {
  const { api, links, toast } = useRewards();
  const categories = useResource(() => api.categories(), [api]);
  const [editMode, setEditMode] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, run] = useAction(toast);

  if (categories.loading && categories.data === undefined) return <Loading label="Loading tiles…" />;
  if (categories.error && categories.data === undefined) return <ErrorState error={categories.error} onRetry={categories.reload} />;
  const tiles = categories.data;

  const move = async (index, delta) => {
    const reordered = moveItem(tiles, index, delta);
    if (reordered !== tiles && (await run(() => api.reorderTiles(reordered.map((t) => t.id))))) categories.refresh();
  };
  const save = async (tile, changes) => {
    const ok = await run(() => api.updateTile(tile.id, changes), "Saved");
    if (ok) categories.refresh();
    return Boolean(ok);
  };
  const create = async (tile) => {
    if (await run(() => api.createTile(tile), `Created ${tile.name}`)) {
      setCreating(false);
      categories.refresh();
    }
  };

  return (
    <section>
      <ScreenHeader
        title="Rewards"
        subtitle={tiles.length ? "Pick an area, do the work, earn the treat." : undefined}
        actions={
          tiles.length > 0 && (
            <button type="button" className="rw-btn" aria-pressed={editMode} onClick={() => (setEditMode((on) => !on), setCreating(false))}>
              {editMode ? "Done" : "Edit tiles"}
            </button>
          )
        }
      />

      {tiles.length === 0 ? (
        <FirstTile onChanged={categories.refresh} />
      ) : editMode ? (
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
              <StarterButton onAdded={categories.refresh} />
            </div>
          )}
        </>
      ) : (
        <>
        <DetailsSearch />
        <div className="rw-tiles">
          {tiles.map((c) => {
            const active = c.areas.reduce((sum, a) => sum + a.activeTaskCount, 0);
            return (
              <a key={c.id} className="rw-tile" href={links.category(c.id)}>
                <span className="rw-tile-icon" aria-hidden="true">
                  {c.icon}
                </span>
                <strong>{c.name}</strong>
                <small>
                  {c.areas.length} areas · {active} active tasks
                </small>
              </a>
            );
          })}
        </div>
        </>
      )}

      {deleting && (
        <DeleteTileDialog
          tile={deleting}
          onCancel={() => setDeleting(null)}
          onDeleted={() => (setDeleting(null), categories.refresh())}
        />
      )}
    </section>
  );
}
