import { useRewards } from "../context.js";
import { navigate } from "../lib/router.js";
import { useResource } from "../lib/useResource.js";
import { Empty, Resource, ScreenHeader, SubTabs } from "../components/ui.jsx";
import { AreaManager, useTileEditing } from "../components/manage.jsx";
import DetailsPanel from "../components/details.jsx";

function CategoryView({ category, tab, onChanged }) {
  const { links } = useRewards();
  const tileEditing = useTileEditing(category, { onSaved: onChanged, onDeleted: () => navigate(links.tiles()) });
  return (
    <section>
      <ScreenHeader
        crumbs={[["All tiles", links.tiles()]]}
        title={`${category.icon} ${category.name}`}
        subtitle="Tap an area to see and add tasks."
        actions={tileEditing.actions}
      />
      {tileEditing.panel}
      <SubTabs
        label={`${category.name} sections`}
        tabs={[
          ["Areas", links.category(category.id), tab !== "details"],
          ["Notes & contacts", links.categoryDetails(category.id), tab === "details"],
        ]}
      />
      {tab === "details" ? (
        <DetailsPanel ownerType="category" ownerId={category.id} />
      ) : (
        <AreaManager
          tile={category}
          href={(a) => links.area(a.id)}
          subtitle={(a) => (a.activeTaskCount ? `${a.activeTaskCount} active` : "No active tasks")}
          onChanged={onChanged}
        />
      )}
    </section>
  );
}

export default function CategoryScreen({ categoryId, tab = "main" }) {
  const { api } = useRewards();
  const categories = useResource(() => api.categories(), [api]);

  return (
    <Resource resource={categories} loadingLabel="Loading areas…">
      {(data) => {
        const category = data.find((c) => c.id === categoryId);
        if (!category) return <Empty title="Tile not found">It may have been removed. Go back to all tiles.</Empty>;
        return <CategoryView category={category} tab={tab} onChanged={categories.refresh} />;
      }}
    </Resource>
  );
}
