/**
 * Groups items under "🏠 Household › Kitchen" headings, in the tiles' and areas' own order.
 * A tile without areas is just "💼 Office" (its one area is hidden, HLR-13).
 * Items whose area is missing (or unknown) go in a last group titled `noAreaTitle`.
 * Returns [{ key, tileLabel, area, title, items }], skipping empty groups.
 */
export function groupByArea(items, tiles, areaIdOf, noAreaTitle = "Not in an area") {
  const byArea = Map.groupBy(items, (item) => areaIdOf(item) ?? "none");
  const groups = [];
  for (const tile of tiles) {
    for (const area of tile.areas) {
      const inArea = byArea.get(area.id);
      const tileLabel = `${tile.icon} ${tile.name}`;
      const title = area.hidden ? tileLabel : `${tileLabel} › ${area.name}`;
      if (inArea?.length) groups.push({ key: area.id, tileLabel, area, title, items: inArea });
      byArea.delete(area.id);
    }
  }
  const rest = [...byArea.values()].flat();
  if (rest.length) groups.push({ key: "none", tileLabel: "", area: { id: null, name: noAreaTitle }, title: noAreaTitle, items: rest });
  return groups;
}
