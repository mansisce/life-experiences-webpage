import { useEffect, useState } from "react";

// The host uses hash routing (#/rewards). The MFE owns everything below its basePath,
// e.g. #/rewards/a/12, so deep links and the browser back button work without the host
// knowing any of the MFE's routes.

function subPath(basePath) {
  const hash = window.location.hash.replace(/^#/, "");
  return hash.startsWith(basePath) ? hash.slice(basePath.length) || "/" : "/";
}

// [name, pattern, fixed tab]. An area has three tabs: main (tasks), rewards, details. A tile shows its areas.
const ROUTES = [
  ["category", /^\/c\/([\w-]+)(?:\/(details|rewards))?$/],
  ["area", /^\/a\/(\d+)(?:\/(details|rewards))?$/],
  ["task", /^\/t\/(\d+)$/],
  ["reward", /^\/r\/(\d+)$/], // connect a reward to tasks
  ["tasksList", /^\/tasks$/], // every task, by area
  ["rewardsList", /^\/my-rewards$/], // every reward, by area
  ["link", /^\/link$/], // link any task to any reward
  // Links from before the Areas / Rewards tabs were merged.
  ["category", /^\/my-rewards\/c\/([\w-]+)$/, "rewards"],
  ["area", /^\/my-rewards\/a\/(\d+)$/, "rewards"],
];

/**
 * `tab` is "main", "rewards" or "details" on a tile or area.
 * `query` is anything after "?", e.g. "new=1" opens the new-reward form.
 */
export function matchRoute(fullPath) {
  const [path, query = ""] = fullPath.split("?");
  for (const [name, pattern, fixedTab] of ROUTES) {
    const match = path.match(pattern);
    if (match) return { name, param: match[1] ?? null, tab: fixedTab ?? match[2] ?? "main", query };
  }
  return { name: "tiles", param: null, tab: "main", query };
}

export function useHashRoute(basePath) {
  const [path, setPath] = useState(() => subPath(basePath));

  useEffect(() => {
    const onChange = () => setPath(subPath(basePath));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, [basePath]);

  return matchRoute(path);
}

export function makeLinks(basePath) {
  const tile = (id, tab = "") => `#${basePath}/c/${id}${tab && `/${tab}`}`;
  const area = (id, tab = "") => `#${basePath}/a/${id}${tab && `/${tab}`}`;
  return {
    tiles: () => `#${basePath}`,
    category: (id) => tile(id),
    area: (id) => area(id),
    areaRewards: (id) => area(id, "rewards"),
    areaDetails: (id) => area(id, "details"),
    // Older tile-level notes and contacts open the tile, which no longer has its own tabs.
    details: (type, id) => (type === "area" ? area(id, "details") : tile(id)),
    task: (id) => `#${basePath}/t/${id}`,
    reward: (id) => `#${basePath}/r/${id}`,
    tasksList: () => `#${basePath}/tasks`,
    rewardsList: () => `#${basePath}/my-rewards`,
    // The Link screen, optionally with a task and/or reward already picked.
    link: ({ task, reward } = {}) => {
      const params = new URLSearchParams(Object.entries({ task, reward }).filter(([, v]) => v != null));
      return `#${basePath}/link${params.size ? `?${params}` : ""}`;
    },
    // An area's Rewards tab (or a tile, which lists its areas); add new: 1 to open the new-reward form.
    rewards: ({ tile: tileId, area: areaId, new: open } = {}) => {
      const href = areaId ? area(areaId, "rewards") : tileId ? tile(tileId) : `#${basePath}`;
      return `${href}${open ? "?new=1" : ""}`;
    },
  };
}

export function navigate(href) {
  window.location.hash = href.replace(/^#/, "");
}
