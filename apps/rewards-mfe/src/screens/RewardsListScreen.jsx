import { useState } from "react";
import { useRewards } from "../context.js";
import { groupByArea } from "../lib/groupByArea.js";
import { useResource } from "../lib/useResource.js";
import { Chips, Empty, Resource, ScreenHeader } from "../components/ui.jsx";
import { areaOptions, NewRewardForm, RewardList, STATUS_FILTERS } from "../components/rewards.jsx";

/** Every reward, grouped under the area it's kept in (tile › area order); "Not in an area" last. */
export default function RewardsListScreen() {
  const { api, links } = useRewards();
  const rewards = useResource(() => api.rewards(), [api]);
  const tiles = useResource(() => api.categories(), [api]);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  return (
    <section>
      <ScreenHeader
        title="Rewards"
        subtitle="Every reward, grouped by the area it's kept in. Link them to tasks on the Link screen."
        actions={
          !creating && (
            <button type="button" className="rw-btn rw-btn--primary" onClick={() => setCreating(true)}>
              + New
            </button>
          )
        }
      />
      {creating && (
        <NewRewardForm
          areas={areaOptions(tiles.data ?? [])}
          onCancel={() => setCreating(false)}
          onCreated={() => (setCreating(false), rewards.refresh())}
        />
      )}
      <Resource resource={rewards} loadingLabel="Loading rewards…">
        {(list) => {
          const needle = q.trim().toLowerCase();
          const shown = list.filter(
            (r) => (!status || r.status === status) && (!needle || `${r.title} ${r.areaName ?? ""} ${r.categoryName ?? ""}`.toLowerCase().includes(needle))
          );
          const groups = groupByArea(shown, tiles.data ?? [], (r) => r.areaId);
          return (
            <>
              {list.length > 0 && (
                <div className="rw-filters">
                  {list.length > 3 && <input type="search" aria-label="Search rewards" placeholder="Search rewards" value={q} onChange={(e) => setQ(e.target.value)} />}
                  <Chips label="Filter rewards" options={STATUS_FILTERS} value={status} onChange={setStatus} allowNone />
                </div>
              )}
              {list.length === 0 ? (
                <Empty title="No rewards yet">Add one above, or on an area's Rewards tab, then link it to tasks.</Empty>
              ) : groups.length === 0 ? (
                <Empty title="No rewards match" />
              ) : (
                groups.map((g) => (
                  <div key={g.key} className="rw-area-group">
                    <h3 className="rw-group-title">
                      {g.area.id ? (
                        <a href={links.areaRewards(g.area.id)}>
                          <small>{g.tileLabel} ›</small> {g.area.name}
                        </a>
                      ) : (
                        g.area.name
                      )}
                    </h3>
                    <RewardList rewards={g.items} onChanged={rewards.refresh} showWhere={false} filterable={false} />
                  </div>
                ))
              )}
            </>
          );
        }}
      </Resource>
    </section>
  );
}
