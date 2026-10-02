import { useRewards } from "../context.js";
import { navigate } from "../lib/router.js";
import { useResource } from "../lib/useResource.js";
import { Empty, Resource, ScreenHeader } from "../components/ui.jsx";
import { AreaManager, useTileEditing } from "../components/manage.jsx";
import { rewardCounts } from "../components/rewards.jsx";
import AreaScreen from "./AreaScreen.jsx";

/** A tile is just its areas; tasks, rewards and notes & contacts live inside each area. */
function CategoryView({ category, onChanged }) {
  const { api, links } = useRewards();
  const tileEditing = useTileEditing(category, { onSaved: onChanged, onDeleted: () => navigate(links.tiles()) });
  const rewards = useResource(() => api.rewards(), [api]);
  const list = rewards.data ?? [];
  const areaSubtitle = (a) =>
    [a.activeTaskCount ? `${a.activeTaskCount} active task${a.activeTaskCount === 1 ? "" : "s"}` : "No active tasks", rewardCounts(list.filter((r) => r.areaId === a.id))]
      .filter(Boolean)
      .join(" · ");

  return (
    <section>
      <ScreenHeader
        crumbs={[["All tiles", links.tiles()]]}
        title={`${category.icon} ${category.name}`}
        subtitle="Tap an area for its tasks, rewards and contacts."
        actions={tileEditing.actions}
      />
      {tileEditing.panel}
      <AreaManager tile={category} href={(a) => links.area(a.id)} subtitle={areaSubtitle} onChanged={onChanged} />
      <p className="rw-muted">Don't need areas here? Edit the tile (✎) and switch off “Use areas” once it has none.</p>
    </section>
  );
}

export default function CategoryScreen({ categoryId, tab = "main", query = "" }) {
  const { api } = useRewards();
  const categories = useResource(() => api.categories(), [api]);

  return (
    <Resource resource={categories} loadingLabel="Loading areas…">
      {(data) => {
        const category = data.find((c) => c.id === categoryId);
        if (!category) return <Empty title="Tile not found">It may have been removed. Go back to all tiles.</Empty>;
        // A tile without areas opens straight to its tasks, rewards and notes (HLR-13).
        const hidden = category.areas.find((a) => a.hidden);
        if (hidden) return <AreaScreen key={hidden.id} areaId={hidden.id} tab={tab} query={query} tile={category} onTileChanged={categories.refresh} />;
        return <CategoryView category={category} onChanged={categories.refresh} />;
      }}
    </Resource>
  );
}
