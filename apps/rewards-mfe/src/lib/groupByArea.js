/**
 * Groups items under "🏠 Household › Kitchen" headings, in the tiles' and areas' own order.
 * Items whose area is missing (or unknown) go in a last group titled `noAreaTitle`.
 * Returns [{ key, tileLabel, area, items }], skipping empty groups.
 */
export function groupByArea(items, tiles, areaIdOf, noAreaTitle = "Not in an area") {
  const byArea = Map.groupBy(items, (item) => areaIdOf(item) ?? "none");
  const groups = [];
  for (const tile of tiles) {
    for (const area of tile.areas) {
      const inArea = byArea.get(area.id);
      if (inArea?.length) groups.push({ key: area.id, tileLabel: `${tile.icon} ${tile.name}`, area, items: inArea });
      byArea.delete(area.id);
    }
  }
  const rest = [...byArea.values()].flat();
  if (rest.length) groups.push({ key: "none", tileLabel: "", area: { id: null, name: noAreaTitle }, items: rest });
  return groups;
}
