// Reward cards, the add form and an area's Rewards tab. Rewards can be kept in an area to organise
// them, but linking them to tasks happens only on the Link screen (any task, any reward).
import { useState } from "react";
import { useRewards } from "../context.js";
import { useResource } from "../lib/useResource.js";
import { Chips, Empty, ProgressBar, Resource, useAction } from "./ui.jsx";

export const STATUS_FILTERS = [
  ["locked", "Locked"],
  ["unlocked", "Unlocked"],
  ["claimed", "Claimed"],
];
const ACTIVE = new Set(["locked", "unlocked"]);

/** How a reward can unlock. Task count needs N; Milestone completed needs every linked milestone done (BR-R25). */
export const RULES = [
  ["completions", "Task count"],
  ["milestone", "🏁 Milestone completed"],
];

/** "Unlocks after 5 completions of 2 linked tasks", or a nudge to link some. */
export function ruleText(reward) {
  const n = reward.threshold;
  if (reward.ruleType === "milestone") {
    const m = reward.progress.target;
    return m ? `Unlocks when all ${m} linked milestone${m === 1 ? " is" : "s are"} done` : "Unlocks when its linked milestones are done · no milestones linked yet";
  }
  if (reward.matchMode === "all") return `Unlocks after ${n} completions of any task in ${reward.areaName ?? "its area"}`;
  if (!reward.connected) return `Unlocks after ${n} completion${n === 1 ? "" : "s"} · no tasks linked yet`;
  const linked = `${reward.tasks.length} linked task${reward.tasks.length === 1 ? "" : "s"}`;
  return reward.ruleType === "streak" ? `Unlocks at a streak of ${n} on ${linked}` : `Unlocks after ${n} completion${n === 1 ? "" : "s"} of ${linked}`;
}

/** "🏠 Household › Kitchen", or "" for a reward not kept in an area. */
export function whereText(reward) {
  if (!reward.areaId) return "";
  return `${reward.categoryIcon ?? ""} ${reward.categoryName ?? ""} › ${reward.areaName}`.trim();
}

/** "2 rewards · 🎁 1 to claim · 1 claimed", or "" when there are none. */
export function rewardCounts(rewards) {
  if (rewards.length === 0) return "";
  const active = rewards.filter((r) => ACTIVE.has(r.status)).length;
  const ready = rewards.filter((r) => r.status === "unlocked").length;
  const claimed = rewards.length - active;
  return [`${active} reward${active === 1 ? "" : "s"}`, ready && `🎁 ${ready} to claim`, claimed && `${claimed} claimed`]
    .filter(Boolean)
    .join(" · ");
}

/** Tiles -> [{id, label}] for an area picker, e.g. "🏠 Household › Kitchen". */
export function areaOptions(tiles) {
  return tiles.flatMap((t) => t.areas.map((a) => ({ id: a.id, label: `${t.icon} ${t.name} › ${a.name}` })));
}

/**
 * The simple add form: a title and N (how many completions unlock it); a note and picture are optional.
 * `areaId` fixes the area (an area's Rewards tab); otherwise `areas` offers an optional area picker.
 */
export function NewRewardForm({ areaId = null, areas = null, onCreated, onCancel }) {
  const { api, toast } = useRewards();
  const [title, setTitle] = useState("");
  const [ruleType, setRuleType] = useState("completions");
  const [threshold, setThreshold] = useState(5);
  const [where, setWhere] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [more, setMore] = useState(false);
  const [busy, run] = useAction(toast);

  const submit = async (e) => {
    e.preventDefault();
    const created = await run(
      () =>
        api.createReward({
          title: title.trim(),
          ruleType,
          threshold: Number(threshold) || 1,
          areaId: areaId ?? (where ? Number(where) : null),
          description: description.trim(),
          imageUrl: imageUrl.trim() || null,
        }),
      "Reward added. Link it to tasks on the Link screen."
    );
    if (created) onCreated(created);
  };

  return (
    <form className="rw-card rw-form" onSubmit={submit} aria-label="New reward">
      <h3>New reward</h3>
      <input aria-label="Reward" placeholder="e.g. Coffee at my favourite café" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} autoFocus required />
      <Chips label="How it unlocks" options={RULES} value={ruleType} onChange={setRuleType} />
      {ruleType === "milestone" ? (
        <small className="rw-muted">Unlocks when every milestone task you link to it has been done.</small>
      ) : (
        <label className="rw-number">
          Unlocks after
          <input type="number" aria-label="Completions needed" min={1} max={365} inputMode="numeric" value={threshold} onChange={(e) => setThreshold(e.target.value)} required />
          completions of its linked tasks
        </label>
      )}
      {areas && (
        <select aria-label="Area (optional)" className="rw-select" value={where} onChange={(e) => setWhere(e.target.value)}>
          <option value="">No area</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      )}
      {more ? (
        <>
          <textarea aria-label="Note" placeholder="Note (optional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
          <input aria-label="Picture link" type="url" placeholder="Picture link (optional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} maxLength={500} />
        </>
      ) : (
        <button type="button" className="rw-link-btn" onClick={() => setMore(true)}>
          + Add a note or picture
        </button>
      )}
      <div className="rw-inline-form">
        <button type="submit" className="rw-btn rw-btn--primary" disabled={busy || !title.trim() || (ruleType !== "milestone" && !Number(threshold))}>
          {busy ? "Adding…" : "Add reward"}
        </button>
        <button type="button" className="rw-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function RewardCard({ reward, onChanged, showWhere = true }) {
  const { api, links, toast } = useRewards();
  const [busy, run] = useAction(toast);
  const claim = async () => {
    if (await run(() => api.updateReward(reward.id, { status: "claimed" }), `Enjoy: ${reward.title} 🎁`)) onChanged();
  };
  const where = showWhere && whereText(reward);
  return (
    <li className={`rw-card rw-reward rw-reward--${reward.status}${reward.connected ? "" : " rw-reward--unconnected"}`}>
      {reward.imageUrl && <img src={reward.imageUrl} alt="" loading="lazy" />}
      <div className="rw-reward-head">
        <h3>
          <a href={links.reward(reward.id)}>{reward.title}</a>
        </h3>
        <span className={`rw-status rw-status--${reward.status}`}>{reward.status}</span>
      </div>
      {where && <p className="rw-where">{where}</p>}
      <p className="rw-rule">{ruleText(reward)}</p>
      {reward.connected && (
        <>
          <ProgressBar percent={reward.progress.percent} label={`${reward.title} progress`} />
          <small className="rw-muted">
            {reward.progress.current} / {reward.progress.target}
          </small>
        </>
      )}
      <div className="rw-inline-form">
        {reward.status === "unlocked" && (
          <button type="button" className="rw-btn rw-btn--primary" disabled={busy} onClick={claim}>
            Claim 🎁
          </button>
        )}
        <a className="rw-btn" href={links.reward(reward.id)}>
          Details
        </a>
      </div>
    </li>
  );
}

export function RewardList({ rewards, onChanged, showWhere = true, filterable = true, emptyTitle, emptyText }) {
  const [status, setStatus] = useState("");
  const shown = status ? rewards.filter((r) => r.status === status) : rewards;
  return (
    <>
      {filterable && rewards.length > 1 && <Chips label="Filter rewards" options={STATUS_FILTERS} value={status} onChange={setStatus} allowNone />}
      {shown.length === 0 ? (
        <Empty title={status ? `No ${status} rewards` : emptyTitle}>{!status && emptyText}</Empty>
      ) : (
        <ul className="rw-rewards">
          {shown.map((r) => (
            <RewardCard key={`${r.id}-${r.status}-${r.tasks.length}`} reward={r} onChanged={onChanged} showWhere={showWhere} />
          ))}
        </ul>
      )}
    </>
  );
}

/** An area's Rewards tab: the rewards kept here, and a simple add. Linking happens on the Link screen. */
export function AreaRewardsPanel({ area, openForm = false }) {
  const { api, links } = useRewards();
  const rewards = useResource(() => api.rewards({ areaId: area.id }), [api, area.id]);
  const [creating, setCreating] = useState(openForm);

  return (
    <Resource resource={rewards} loadingLabel="Loading rewards…">
      {(list) => (
        <>
          {creating ? (
            <NewRewardForm areaId={area.id} onCancel={() => setCreating(false)} onCreated={() => (setCreating(false), rewards.refresh())} />
          ) : (
            <div className="rw-inline-form">
              <button type="button" className="rw-btn rw-btn--primary" onClick={() => setCreating(true)}>
                + New reward
              </button>
              <a className="rw-btn" href={links.link()}>
                Link rewards to tasks
              </a>
            </div>
          )}
          <RewardList
            rewards={list}
            onChanged={rewards.refresh}
            showWhere={false}
            emptyTitle={`No rewards kept in ${area.name} yet`}
            emptyText="Add one here, then link it to any tasks on the Link screen."
          />
        </>
      )}
    </Resource>
  );
}
