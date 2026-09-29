import { useEffect, useState } from "react";

// The host uses hash routing (#/rewards). The MFE owns everything below its basePath,
// e.g. #/rewards/a/12, so deep links and the browser back button work without the host
// knowing any of the MFE's routes.

function subPath(basePath) {
  const hash = window.location.hash.replace(/^#/, "");
  return hash.startsWith(basePath) ? hash.slice(basePath.length) || "/" : "/";
}

const ROUTES = [
  ["category", /^\/c\/([\w-]+)(\/details)?$/],
  ["area", /^\/a\/(\d+)(\/details)?$/],
  ["task", /^\/t\/(\d+)$/],
  ["rewards", /^\/my-rewards$/],
];

/** `tab` is "details" on a tile's or area's Notes & contacts tab, otherwise "main". */
export function matchRoute(path) {
  for (const [name, pattern] of ROUTES) {
    const match = path.match(pattern);
    if (match) return { name, param: match[1], tab: match[2] ? "details" : "main" };
  }
  return { name: "tiles", param: null, tab: "main" };
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
  return {
    tiles: () => `#${basePath}`,
    category: (id) => `#${basePath}/c/${id}`,
    categoryDetails: (id) => `#${basePath}/c/${id}/details`,
    area: (id) => `#${basePath}/a/${id}`,
    areaDetails: (id) => `#${basePath}/a/${id}/details`,
    details: (type, id) => `#${basePath}/${type === "area" ? "a" : "c"}/${id}/details`,
    task: (id) => `#${basePath}/t/${id}`,
    rewards: () => `#${basePath}/my-rewards`,
  };
}

export function navigate(href) {
  window.location.hash = href.replace(/^#/, "");
}
