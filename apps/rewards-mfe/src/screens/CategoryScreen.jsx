import { useState } from "react";
import { useRewards } from "../context.js";
import { navigate } from "../lib/router.js";
import { useResource } from "../lib/useResource.js";
import { Empty, Resource, ScreenHeader, SubTabs, useAction } from "../components/ui.jsx";
import { DeleteTileDialog, moveItem, TileForm } from "../components/tiles.jsx";
import DetailsPanel from "../components/details.jsx";

function AreaRow({ area, index, count, onMove, onRename, onDelete, busy }) {
  const { links } = useRewards();
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
      <a className="rw-row-main" href={links.area(area.id)}>
        <strong>{area.name}</strong>
        <small>{area.activeTaskCount ? `${area.activeTaskCount} active` : "No active tasks"}</small>
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

export default function CategoryScreen({ categoryId, tab = "main" }) {
  const { api, links, toast } = useRewards();
  const categories = useResource(() => api.categories(), [api]);
  const [newName, setNewName] = useState("");
  const [editingTile, setEditingTile] = useState(false);
  const [deletingTile, setDeletingTile] = useState(false);
  const [busy, run] = useAction(toast);

  const moveArea = async (areas, index, delta) => {
    const reordered = moveItem(areas, index, delta);
    if (reordered !== areas && (await run(() => api.reorderAreas(categoryId, reordered.map((a) => a.id))))) categories.refresh();
  };

  const saveTile = async (changes) => {
    if (await run(() => api.updateTile(categoryId, changes), "Saved")) {
      setEditingTile(false);
      categories.refresh();
    }
  };

  const add = async (e) => {
    e.preventDefault();
    const created = await run(() => api.createArea(categoryId, newName.trim()), `Added ${newName.trim()}`);
    if (created) {
      setNewName("");
      categories.refresh();
    }
  };

  const rename = async (area, name) => {
    const ok = await run(() => api.renameArea(area.id, name.trim()), "Renamed");
    if (ok) categories.refresh();
    return Boolean(ok);
  };

  const remove = async (area) => {
    const warning = area.activeTaskCount
      ? `Delete "${area.name}" and its ${area.activeTaskCount} active task(s), with all their history?`
      : `Delete "${area.name}"?`;
    if (!window.confirm(warning)) return;
    const done = await run(async () => (await api.deleteArea(area.id), true), `Deleted ${area.name}`);
    if (done) categories.refresh();
  };

  return (
    <Resource resource={categories} loadingLabel="Loading areas…">
      {(data) => {
        const category = data.find((c) => c.id === categoryId);
        if (!category) return <Empty title="Tile not found">It may have been removed. Go back to all tiles.</Empty>;
        return (
          <section>
            <ScreenHeader
              crumbs={[["All tiles", links.tiles()]]}
              title={`${category.icon} ${category.name}`}
              subtitle="Tap an area to see and add tasks."
              actions={
                !editingTile && (
                  <div className="rw-row-actions">
                    <button type="button" className="rw-icon-btn" aria-label={`Edit ${category.name}`} onClick={() => setEditingTile(true)}>
                      ✎
                    </button>
                    <button type="button" className="rw-icon-btn" aria-label={`Delete ${category.name}`} onClick={() => setDeletingTile(true)}>
                      🗑
                    </button>
                  </div>
                )
              }
            />
            {editingTile && <TileForm initial={category} submitLabel="Save" busy={busy} onSubmit={saveTile} onCancel={() => setEditingTile(false)} />}
            <SubTabs
              label={`${category.name} sections`}
              tabs={[
                ["Areas", links.category(categoryId), tab !== "details"],
                ["Notes & contacts", links.categoryDetails(categoryId), tab === "details"],
              ]}
            />
            {tab === "details" ? (
              <DetailsPanel ownerType="category" ownerId={categoryId} />
            ) : (
            <>
            {category.areas.length === 0 ? (
              <Empty title="No areas yet">Add the first one below.</Empty>
            ) : (
              <ul className="rw-list">
                {category.areas.map((a, i) => (
                  <AreaRow
                    key={a.id}
                    area={a}
                    index={i}
                    count={category.areas.length}
                    onMove={(index, delta) => moveArea(category.areas, index, delta)}
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
            )}
            {deletingTile && (
              <DeleteTileDialog tile={category} onCancel={() => setDeletingTile(false)} onDeleted={() => navigate(links.tiles())} />
            )}
          </section>
        );
      }}
    </Resource>
  );
}
