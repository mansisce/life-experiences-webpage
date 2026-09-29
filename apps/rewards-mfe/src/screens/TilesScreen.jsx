import { useState } from "react";
import { useRewards } from "../context.js";
import { useResource } from "../lib/useResource.js";
import { ErrorState, Loading, ScreenHeader, useAction } from "../components/ui.jsx";
import { TileForm } from "../components/tiles.jsx";
import { EditTilesButton, StarterButton, TileManager } from "../components/manage.jsx";
import { DetailsSearch } from "../components/details.jsx";

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

export default function TilesScreen() {
  const { api, links } = useRewards();
  const categories = useResource(() => api.categories(), [api]);
  const [editMode, setEditMode] = useState(false);

  if (categories.loading && categories.data === undefined) return <Loading label="Loading tiles…" />;
  if (categories.error && categories.data === undefined) return <ErrorState error={categories.error} onRetry={categories.reload} />;
  const tiles = categories.data;

  return (
    <section>
      <ScreenHeader
        title="Rewards"
        subtitle={tiles.length ? "Pick an area, do the work, earn the treat." : undefined}
        actions={tiles.length > 0 && <EditTilesButton editing={editMode} onToggle={() => setEditMode((on) => !on)} />}
      />

      {tiles.length === 0 ? (
        <FirstTile onChanged={categories.refresh} />
      ) : editMode ? (
        <TileManager tiles={tiles} onChanged={categories.refresh} />
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
    </section>
  );
}
