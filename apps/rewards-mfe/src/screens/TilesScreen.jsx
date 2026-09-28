import { useRewards } from "../context.js";
import { useResource } from "../lib/useResource.js";
import { Empty, Resource, ScreenHeader } from "../components/ui.jsx";

export default function TilesScreen() {
  const { api, links } = useRewards();
  const categories = useResource(() => api.categories(), [api]);

  return (
    <section>
      <ScreenHeader title="Rewards" subtitle="Pick an area, do the work, earn the treat." />
      <Resource resource={categories} loadingLabel="Loading tiles…">
        {(data) =>
          data.length === 0 ? (
            <Empty title="No tiles yet">The rewards service has no categories.</Empty>
          ) : (
            <div className="rw-tiles">
              {data.map((c) => {
                const active = c.areas.reduce((sum, a) => sum + a.activeTaskCount, 0);
                return (
                  <a key={c.id} className={`rw-tile rw-tile--${c.id}`} href={links.category(c.id)}>
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
          )
        }
      </Resource>
    </section>
  );
}
