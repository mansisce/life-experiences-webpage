import { useState } from "react";
import { useRewards } from "../context.js";
import { groupByArea } from "../lib/groupByArea.js";
import { useResource } from "../lib/useResource.js";
import { Chips, Empty, GroupTitle, Resource, ScreenHeader } from "../components/ui.jsx";
import { AddRewardOrIdea, areaOptions, RewardList, STATUS_FILTERS, usePeople } from "../components/rewards.jsx";

/**
 * Every reward and idea, grouped under the area it's kept in (tile › area order; "Not in an area" last).
 * Filter by status (💡 Ideas, Locked, …, Closed) and by who it's for, e.g. "Shiragi".
 */
export default function RewardsListScreen() {
  const { api, links } = useRewards();
  const rewards = useResource(() => api.rewards(), [api]);
  const tiles = useResource(() => api.categories(), [api]);
  const people = usePeople();
  const [status, setStatus] = useState("");
  const [person, setPerson] = useState("");
  const [q, setQ] = useState("");

  return (
    <section>
      <ScreenHeader title="Rewards" subtitle="Rewards and ideas, grouped by the area they're kept in. Link rewards to tasks on the Link screen." />
      <AddRewardOrIdea areas={areaOptions(tiles.data ?? [])} onCreated={rewards.refresh} />
      <Resource resource={rewards} loadingLabel="Loading rewards…">
        {(list) => {
          const needle = q.trim().toLowerCase();
          const shown = list.filter(
            (r) =>
              (status ? r.status === status : r.status !== "closed") &&
              (!person || r.forWhom === person) &&
              (!needle || `${r.title} ${r.areaName ?? ""} ${r.categoryName ?? ""} ${r.forWhom} ${r.whereSeen ?? ""}`.toLowerCase().includes(needle))
          );
          const groups = groupByArea(shown, tiles.data ?? [], (r) => r.areaId);
          const forWhomOptions = people.filter((p) => list.some((r) => r.forWhom === p)).map((p) => [p, p === "Me" ? "Me" : p]);
          return (
            <>
              {list.length > 0 && (
                <div className="rw-filters">
                  {list.length > 3 && <input type="search" aria-label="Search rewards" placeholder="Search rewards and ideas" value={q} onChange={(e) => setQ(e.target.value)} />}
                  <Chips label="Filter by status" options={STATUS_FILTERS} value={status} onChange={setStatus} allowNone />
                  {forWhomOptions.length > 1 && <Chips label="Filter by who it's for" options={forWhomOptions} value={person} onChange={setPerson} allowNone />}
                </div>
              )}
              {list.length === 0 ? (
                <Empty title="No rewards or ideas yet">Save an idea when something catches your eye, or add a reward and link it to tasks.</Empty>
              ) : groups.length === 0 ? (
                <Empty title="Nothing matches these filters" />
              ) : (
                groups.map((g) => (
                  <div key={g.key} className="rw-area-group">
                    <h3 className="rw-group-title">
                      {g.area.id ? (
                        <a href={links.place(g.area, "rewards")}>
                          <GroupTitle group={g} />
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
