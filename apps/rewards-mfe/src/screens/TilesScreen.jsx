import { useState } from "react";
import { useRewards } from "../context.js";
import { useResource } from "../lib/useResource.js";
import { ErrorState, Loading, ScreenHeader, useAction } from "../components/ui.jsx";
import { TileForm } from "../components/tiles.jsx";
import { EditTilesButton, StarterButton, TileManager } from "../components/manage.jsx";
import { DetailsSearch } from "../components/details.jsx";
import { rewardCounts } from "../components/rewards.jsx";

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
  const rewards = useResource(() => api.rewards(), [api]);
  const [editMode, setEditMode] = useState(false);

  if (categories.loading && categories.data === undefined) return <Loading label="Loading tiles…" />;
  if (categories.error && categories.data === undefined) return <ErrorState error={categories.error} onRetry={categories.reload} />;
  const tiles = categories.data;

  return (
    <section>
      <ScreenHeader
        title="Rewards"
        subtitle={tiles.length ? "Pick a tile, then an area: its tasks, rewards and contacts are inside." : undefined}
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
              const tileRewards = rewardCounts((rewards.data ?? []).filter((r) => r.categoryId === c.id));
              return (
                <a key={c.id} className="rw-tile" href={links.category(c.id)}>
                  <span className="rw-tile-icon" aria-hidden="true">
                    {c.icon}
                  </span>
                  <strong>{c.name}</strong>
                  <small>
                    {c.useAreas && `${c.areas.length} area${c.areas.length === 1 ? "" : "s"} · `}
                    {active} active task{active === 1 ? "" : "s"}
                    {tileRewards && <span className="rw-tile-rewards">{tileRewards}</span>}
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
