// Reward scope helpers (HLR-9): a reward lives in a tile, optionally narrowed to one area.

export const MATCH_MODES = [
  ["selected", "Selected tasks"],
  ["all", "All tasks here"],
];

/** "🏠 Household › Kitchen", or "Needs a tile" for rewards migrated without one. */
export function scopeLabel(reward) {
  if (reward.needsTile) return "Needs a tile";
  return `${reward.categoryIcon ?? ""} ${reward.categoryName}${reward.areaName ? ` › ${reward.areaName}` : ""}`.trim();
}

/** Tasks (from GET /tasks, which carry categoryId and areaId) inside a scope — mirrors BR-R12 on the BFF. */
export function tasksInScope(tasks, { categoryId, areaId }) {
  return tasks.filter((t) => t.categoryId === categoryId && (!areaId || t.areaId === areaId));
}
