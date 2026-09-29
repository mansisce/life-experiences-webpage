// The four optional planning fields (HLR-11), shared by the add-task form and task detail.
// `value` uses form values: dueAt as a datetime-local string, targetDays as a string ("" = none).
import { Chips } from "./ui.jsx";

export const VISIBILITY = [
  ["announced", "📣 Announce"],
  ["silent", "🔕 Keep silent"],
];

export function PlanFields({ value, onChange }) {
  return (
    <div className="rw-plan-fields">
      <label className="rw-check">
        <input type="checkbox" checked={value.isMilestone} onChange={(e) => onChange({ isMilestone: e.target.checked })} />
        🏁 Milestone: a big checkpoint, celebrated more
      </label>
      <span className="rw-field-label">When I finish it</span>
      <Chips label="Announce or keep silent" options={VISIBILITY} value={value.visibility} onChange={(visibility) => onChange({ visibility })} />
      <small className="rw-muted">
        {value.visibility === "silent" ? "Completed quietly: no celebration or share prompt." : "Celebrated, with a prompt to share on WhatsApp."}
      </small>
      <div className="rw-plan-row">
        <label>
          <span className="rw-field-label">Due by (optional)</span>
          <input type="datetime-local" aria-label="Due date and time" value={value.dueAt} onChange={(e) => onChange({ dueAt: e.target.value })} />
        </label>
        <label>
          <span className="rw-field-label">Days to complete (optional)</span>
          <input
            type="number"
            aria-label="Days to complete"
            min={1}
            max={3650}
            inputMode="numeric"
            placeholder="e.g. 30"
            value={value.targetDays}
            onChange={(e) => onChange({ targetDays: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}
