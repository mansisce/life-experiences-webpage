// Reward and idea cards, the add forms and an area's Rewards tab. Rewards can be kept in an area to
// organise them, but linking them to tasks happens only on the Link screen (any task, any reward).
// An *idea* (HLR-12) is a wishlist entry with no rule yet: turn it into a reward later, or close it.
import { useState } from "react";
import { useRewards } from "../context.js";
import { useResource } from "../lib/useResource.js";
import { Chips, Empty, ProgressBar, Resource, useAction } from "./ui.jsx";

export const STATUS_FILTERS = [
  ["idea", "💡 Ideas"],
  ["locked", "Locked"],
  ["unlocked", "Unlocked"],
  ["claimed", "Claimed"],
  ["closed", "Closed"],
];
const ACTIVE = new Set(["locked", "unlocked"]);
export const isIdea = (r) => r.status === "idea" || r.status === "closed";

/** How a reward can unlock. Task count needs N; Milestone completed needs every linked milestone done (BR-R25). */
export const RULES = [
  ["completions", "Task count"],
  ["milestone", "🏁 Milestone completed"],
];

/** "Unlocks after 5 completions of 2 linked tasks", or a nudge to link some. */
export function ruleText(reward) {
  if (reward.status === "idea") return "💡 Idea: no rule yet";
  if (reward.status === "closed") return `💡 Idea closed: ${reward.closedOutcome === "bought" ? "bought" : "dropped"}`;
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
  const tile = `${reward.categoryIcon ?? ""} ${reward.categoryName ?? ""}`.trim();
  return reward.areaHidden ? tile : `${tile} › ${reward.areaName}`;
}

/** "2 rewards · 🎁 1 to claim · 1 claimed · 💡 3 ideas", or "" when there are none. Ideas never count as rewards. */
export function rewardCounts(rewards) {
  const real = rewards.filter((r) => !isIdea(r));
  const ideas = rewards.filter((r) => r.status === "idea").length;
  const active = real.filter((r) => ACTIVE.has(r.status)).length;
  const ready = real.filter((r) => r.status === "unlocked").length;
  const claimed = real.length - active;
  return [
    active && `${active} reward${active === 1 ? "" : "s"}`,
    ready && `🎁 ${ready} to claim`,
    claimed && `${claimed} claimed`,
    ideas && `💡 ${ideas} idea${ideas === 1 ? "" : "s"}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Tiles -> [{id, label}] for an area picker, e.g. "🏠 Household › Kitchen". */
export function areaOptions(tiles) {
  // A tile without areas is one option, "💼 Office" (its hidden area, HLR-13).
  return tiles.flatMap((t) => t.areas.map((a) => ({ id: a.id, label: a.hidden ? `${t.icon} ${t.name}` : `${t.icon} ${t.name} › ${a.name}` })));
}

/** Everyone rewards are for, for suggestions and the filter ("Me" first). */
export function usePeople() {
  const { api } = useRewards();
  return useResource(() => api.rewardPeople(), [api]).data ?? ["Me"];
}

/** "For whom": free text with suggestions from earlier entries (Q25). */
export function PersonInput({ value, onChange, people, id = "rw-people" }) {
  return (
    <label className="rw-person">
      <span className="rw-field-label">For whom</span>
      <input aria-label="For whom" list={id} value={value} onChange={(e) => onChange(e.target.value)} maxLength={40} required />
      <datalist id={id}>
        {people.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </label>
  );
}

function AreaSelect({ areas, value, onChange }) {
  return (
    <select aria-label="Area (optional)" className="rw-select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">No area</option>
      {areas.map((a) => (
        <option key={a.id} value={a.id}>
          {a.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Quick capture of an idea, e.g. a book spotted at the library for Shiragi (LLR-12.1): only the title
 * is required; for whom and a cover photo are one tap each; the rest hides under "More".
 */
export function NewIdeaForm({ areaId = null, areas = null, onCreated, onCancel }) {
  const { api, toast } = useRewards();
  const people = usePeople();
  const [title, setTitle] = useState("");
  const [forWhom, setForWhom] = useState("Me");
  const [photo, setPhoto] = useState(null);
  const [more, setMore] = useState(false);
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [whereSeen, setWhereSeen] = useState("");
  const [where, setWhere] = useState("");
  const [busy, run] = useAction(toast);

  const submit = async (e) => {
    e.preventDefault();
    const created = await run(async () => {
      const idea = await api.createReward({
        status: "idea",
        title: title.trim(),
        forWhom: forWhom.trim() || "Me",
        description: description.trim(),
        link: link.trim() || null,
        whereSeen: whereSeen.trim() || null,
        areaId: areaId ?? (where ? Number(where) : null),
      });
      return photo ? api.setCover(idea.id, photo) : idea;
    }, "💡 Idea saved");
    if (created) onCreated(created);
  };

  return (
    <form className="rw-card rw-form" onSubmit={submit} aria-label="New idea">
      <h3>💡 New idea</h3>
      <input aria-label="Idea" placeholder="e.g. 101 Hilarious Jokes" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} autoFocus required />
      <PersonInput value={forWhom} onChange={setForWhom} people={people} id="rw-people-idea" />
      <label className="rw-photo-pick">
        <span className="rw-btn">{photo ? `📷 ${photo.name}` : "📷 Add a photo"}</span>
        <input type="file" accept="image/*" capture="environment" aria-label="Cover photo" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} hidden />
      </label>
      {more ? (
        <>
          <input aria-label="Where seen" placeholder="Where seen, e.g. City library" value={whereSeen} onChange={(e) => setWhereSeen(e.target.value)} maxLength={120} />
          <input aria-label="Link" type="url" placeholder="Link (optional)" value={link} onChange={(e) => setLink(e.target.value)} maxLength={500} />
          <textarea aria-label="Note" placeholder="Note (optional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
          {areas && <AreaSelect areas={areas} value={where} onChange={setWhere} />}
        </>
      ) : (
        <button type="button" className="rw-link-btn" onClick={() => setMore(true)}>
          + Where seen, link, note{areas ? ", area" : ""}
        </button>
      )}
      <small className="rw-muted">🔕 Ideas are private by default, so a surprise stays a surprise.</small>
      <div className="rw-inline-form">
        <button type="submit" className="rw-btn rw-btn--primary" disabled={busy || !title.trim()}>
          {busy ? "Saving…" : "Save idea"}
        </button>
        <button type="button" className="rw-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/**
 * The simple add form: a title, how it unlocks and for whom; area, note and picture are optional.
 * `areaId` fixes the area (an area's Rewards tab); otherwise `areas` offers an optional area picker.
 */
export function NewRewardForm({ areaId = null, areas = null, onCreated, onCancel }) {
  const { api, toast } = useRewards();
  const people = usePeople();
  const [title, setTitle] = useState("");
  const [ruleType, setRuleType] = useState("completions");
  const [threshold, setThreshold] = useState(5);
  const [forWhom, setForWhom] = useState("Me");
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
          forWhom: forWhom.trim() || "Me",
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
      <PersonInput value={forWhom} onChange={setForWhom} people={people} />
      {areas && <AreaSelect areas={areas} value={where} onChange={setWhere} />}
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

/** Cover photo (signed link) or picture URL, for/by line and 🔕, shared by reward and idea cards. */
function CardTop({ reward, showWhere }) {
  const { api, links } = useRewards();
  const picture = reward.coverUrl ? api.fileUrl(reward.coverUrl) : reward.imageUrl;
  const where = showWhere && whereText(reward);
  const meta = [reward.forWhom !== "Me" && `for ${reward.forWhom}`, where, reward.whereSeen && `seen at ${reward.whereSeen}`].filter(Boolean);
  return (
    <>
      {picture && <img src={picture} alt="" loading="lazy" />}
      <div className="rw-reward-head">
        <h3>
          <a href={links.reward(reward.id)}>{reward.title}</a>
        </h3>
        <span className="rw-plan">
          {reward.visibility === "silent" && (
            <span className="rw-chip" title="Private: hidden from visitors">
              🔕
            </span>
          )}
          <span className={`rw-status rw-status--${reward.status}`}>{reward.status}</span>
        </span>
      </div>
      {meta.length > 0 && <p className="rw-where">{meta.join(" · ")}</p>}
    </>
  );
}

/** "Turn into reward": pick how it unlocks; tasks are linked on the Link screen afterwards (BR-R28). */
function ActivateIdea({ idea, onDone, onCancel }) {
  const { api, toast } = useRewards();
  const [ruleType, setRuleType] = useState("completions");
  const [threshold, setThreshold] = useState(5);
  const [busy, run] = useAction(toast);
  const activate = async () => {
    const updated = await run(() => api.activateIdea(idea.id, { ruleType, threshold: Number(threshold) || 1 }), `🎁 “${idea.title}” is now a reward. Link tasks to it.`);
    if (updated) onDone(updated);
  };
  return (
    <div className="rw-form rw-activate">
      <Chips label="How it unlocks" options={RULES} value={ruleType} onChange={setRuleType} />
      {ruleType !== "milestone" && (
        <label className="rw-number">
          Unlocks after
          <input type="number" aria-label="Completions needed" min={1} max={365} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          completions
        </label>
      )}
      <div className="rw-inline-form">
        <button type="button" className="rw-btn rw-btn--primary" disabled={busy} onClick={activate}>
          Make it a reward
        </button>
        <button type="button" className="rw-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function IdeaCard({ idea, onChanged, showWhere = true }) {
  const { api, links, toast } = useRewards();
  const [activating, setActivating] = useState(false);
  const [busy, run] = useAction(toast);
  const close = async (outcome) => {
    if (await run(() => api.closeIdea(idea.id, outcome), outcome === "bought" ? `Bought: ${idea.title} 🛍️` : `Dropped: ${idea.title}`)) onChanged();
  };
  const reopen = async () => {
    if (await run(() => api.reopenIdea(idea.id), "Reopened")) onChanged();
  };
  const closedOn = idea.closedAt && new Date(idea.closedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  return (
    <li className={`rw-card rw-reward rw-idea rw-idea--${idea.status}`}>
      <CardTop reward={idea} showWhere={showWhere} />
      {idea.description && <p className="rw-muted">{idea.description}</p>}
      {idea.link && (
        <a className="rw-where" href={idea.link} target="_blank" rel="noreferrer">
          🔗 {idea.link.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60)}
        </a>
      )}
      {idea.status === "closed" ? (
        <div className="rw-inline-form">
          <span className="rw-muted">
            {idea.closedOutcome === "bought" ? "🛍️ Bought" : "Dropped"} on {closedOn}
          </span>
          <button type="button" className="rw-btn" disabled={busy} onClick={reopen}>
            Reopen
          </button>
        </div>
      ) : activating ? (
        <ActivateIdea idea={idea} onCancel={() => setActivating(false)} onDone={() => (setActivating(false), onChanged())} />
      ) : (
        <div className="rw-inline-form">
          <button type="button" className="rw-btn rw-btn--primary" onClick={() => setActivating(true)}>
            🎁 Turn into reward
          </button>
          <button type="button" className="rw-btn" disabled={busy} onClick={() => close("bought")}>
            Bought
          </button>
          <button type="button" className="rw-btn" disabled={busy} onClick={() => close("dropped")}>
            Dropped
          </button>
          <a className="rw-link-btn" href={links.reward(idea.id)}>
            Edit
          </a>
        </div>
      )}
    </li>
  );
}

export function RewardCard({ reward, onChanged, showWhere = true }) {
  const { api, links, toast } = useRewards();
  const [busy, run] = useAction(toast);
  const claim = async () => {
    if (await run(() => api.updateReward(reward.id, { status: "claimed" }), `Enjoy: ${reward.title} 🎁`)) onChanged();
  };
  return (
    <li className={`rw-card rw-reward rw-reward--${reward.status}${reward.connected ? "" : " rw-reward--unconnected"}`}>
      <CardTop reward={reward} showWhere={showWhere} />
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
  // Closed ideas are hidden by default here; a screen that filters itself (filterable=false) decides.
  const shown = status ? rewards.filter((r) => r.status === status) : filterable ? rewards.filter((r) => r.status !== "closed") : rewards;
  return (
    <>
      {filterable && rewards.length > 1 && <Chips label="Filter rewards" options={STATUS_FILTERS} value={status} onChange={setStatus} allowNone />}
      {shown.length === 0 ? (
        <Empty title={status ? `Nothing here (${status})` : emptyTitle}>{!status && emptyText}</Empty>
      ) : (
        <ul className="rw-rewards">
          {shown.map((r) =>
            isIdea(r) ? (
              <IdeaCard key={`${r.id}-${r.status}`} idea={r} onChanged={onChanged} showWhere={showWhere} />
            ) : (
              <RewardCard key={`${r.id}-${r.status}-${r.tasks.length}`} reward={r} onChanged={onChanged} showWhere={showWhere} />
            )
          )}
        </ul>
      )}
    </>
  );
}

/** "+ Idea" and "+ Reward" buttons with their forms, used on the Rewards list and an area's Rewards tab. */
export function AddRewardOrIdea({ areaId = null, areas = null, open = null, onCreated, extra = null }) {
  const [adding, setAdding] = useState(open); // null | "idea" | "reward"
  const done = (created) => (setAdding(null), onCreated(created));
  if (adding === "idea") return <NewIdeaForm areaId={areaId} areas={areas} onCreated={done} onCancel={() => setAdding(null)} />;
  if (adding === "reward") return <NewRewardForm areaId={areaId} areas={areas} onCreated={done} onCancel={() => setAdding(null)} />;
  return (
    <div className="rw-inline-form">
      <button type="button" className="rw-btn rw-btn--primary" onClick={() => setAdding("idea")}>
        💡 + Idea
      </button>
      <button type="button" className="rw-btn" onClick={() => setAdding("reward")}>
        🎁 + Reward
      </button>
      {extra}
    </div>
  );
}

/** An area's Rewards tab: the rewards and ideas kept here. Linking happens on the Link screen. */
export function AreaRewardsPanel({ area, openForm = false }) {
  const { api, links } = useRewards();
  const rewards = useResource(() => api.rewards({ areaId: area.id }), [api, area.id]);

  return (
    <Resource resource={rewards} loadingLabel="Loading rewards…">
      {(list) => (
        <>
          <AddRewardOrIdea
            areaId={area.id}
            open={openForm ? "reward" : null}
            onCreated={rewards.refresh}
            extra={
              <a className="rw-btn" href={links.link()}>
                Link to tasks
              </a>
            }
          />
          <RewardList
            rewards={list}
            onChanged={rewards.refresh}
            showWhere={false}
            emptyTitle={`No rewards or ideas kept in ${area.hidden ? area.category.name : area.name} yet`}
            emptyText="Add an idea or a reward here, then link rewards to any tasks on the Link screen."
          />
        </>
      )}
    </Resource>
  );
}
