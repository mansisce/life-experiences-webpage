import { useState } from "react";
import { useRewards } from "../context.js";
import { navigate } from "../lib/router.js";
import { useResource } from "../lib/useResource.js";
import { Chips, ProgressBar, Resource, ScreenHeader, useAction } from "../components/ui.jsx";
import { areaOptions, RULES, ruleText, whereText } from "../components/rewards.jsx";

function EditReward({ reward, tiles, onSaved, onCancel }) {
  const { api, toast } = useRewards();
  const [title, setTitle] = useState(reward.title);
  const [threshold, setThreshold] = useState(reward.threshold);
  const [ruleType, setRuleType] = useState(reward.ruleType);
  const [areaId, setAreaId] = useState(reward.areaId ?? "");
  const [description, setDescription] = useState(reward.description);
  const [imageUrl, setImageUrl] = useState(reward.imageUrl ?? "");
  const [busy, run] = useAction(toast);
  const submit = async (e) => {
    e.preventDefault();
    const changes = { title: title.trim(), description: description.trim(), imageUrl: imageUrl.trim() || null, areaId: areaId ? Number(areaId) : null };
    if (reward.status === "locked") Object.assign(changes, { ruleType, threshold: Number(threshold) || 1 });
    if (await run(() => api.updateReward(reward.id, changes), "Saved")) onSaved();
  };
  return (
    <form className="rw-card rw-form" onSubmit={submit} aria-label="Edit reward">
      <input aria-label="Reward" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} autoFocus required />
      {reward.status === "locked" && (
        <Chips label="How it unlocks" options={reward.ruleType === "streak" ? [...RULES, ["streak", "Streak"]] : RULES} value={ruleType} onChange={setRuleType} />
      )}
      {reward.status === "locked" && ruleType !== "milestone" && (
        <label className="rw-number">
          Unlocks after
          <input type="number" aria-label="Completions needed" min={1} max={365} value={threshold} onChange={(e) => setThreshold(e.target.value)} required />
          completions
        </label>
      )}
      <select aria-label="Area (optional)" className="rw-select" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
        <option value="">No area</option>
        {areaOptions(tiles).map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>
      <textarea aria-label="Note" placeholder="Note (optional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
      <input aria-label="Picture link" type="url" placeholder="Picture link (optional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} maxLength={500} />
      <div className="rw-inline-form">
        <button type="submit" className="rw-btn rw-btn--primary" disabled={busy || !title.trim()}>
          Save
        </button>
        <button type="button" className="rw-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function RewardView({ reward, tiles, onChanged }) {
  const { api, links, toast } = useRewards();
  const [editing, setEditing] = useState(false);
  const [busy, run] = useAction(toast);
  const where = whereText(reward);

  const remove = async () => {
    if (!window.confirm(`Delete the reward “${reward.title}”? Its tasks and their history stay.`)) return;
    if (await run(async () => (await api.deleteReward(reward.id), true), `Deleted ${reward.title}`)) navigate(links.rewardsList());
  };
  const unlink = async (task) => {
    if (await run(() => api.unlinkTask(reward.id, task.id), `Unlinked “${task.title}”`)) onChanged();
  };
  const claim = async () => {
    if (await run(() => api.updateReward(reward.id, { status: "claimed" }), `Enjoy: ${reward.title} 🎁`)) onChanged();
  };

  return (
    <section>
      <ScreenHeader
        crumbs={[["All rewards", links.rewardsList()], ...(reward.areaId ? [[reward.areaName, links.areaRewards(reward.areaId)]] : [])]}
        title={reward.title}
        subtitle={where || "Not kept in an area"}
        actions={
          !editing && (
            <div className="rw-row-actions">
              <button type="button" className="rw-icon-btn" aria-label={`Edit ${reward.title}`} onClick={() => setEditing(true)}>
                ✎
              </button>
              <button type="button" className="rw-icon-btn" aria-label={`Delete ${reward.title}`} disabled={busy} onClick={remove}>
                🗑
              </button>
            </div>
          )
        }
      />
      {editing ? (
        <EditReward reward={reward} tiles={tiles} onCancel={() => setEditing(false)} onSaved={() => (setEditing(false), onChanged())} />
      ) : (
        reward.description && <p className="rw-notes">{reward.description}</p>
      )}

      <div className={`rw-card rw-reward rw-reward--${reward.status}`}>
        {reward.imageUrl && <img src={reward.imageUrl} alt="" loading="lazy" />}
        <div className="rw-reward-head">
          <p className="rw-rule">{ruleText(reward)}</p>
          <span className={`rw-status rw-status--${reward.status}`}>{reward.status}</span>
        </div>
        <ProgressBar percent={reward.progress.percent} label={`${reward.title} progress`} />
        <small className="rw-muted">
          {reward.progress.current} / {reward.progress.target}
        </small>
        {reward.status === "unlocked" && (
          <button type="button" className="rw-btn rw-btn--primary" disabled={busy} onClick={claim}>
            Claim 🎁
          </button>
        )}
      </div>

      <div className="rw-section-head">
        <h3>Linked tasks</h3>
        <a className="rw-link-btn" href={links.link({ reward: reward.id })}>
          + Link tasks
        </a>
      </div>
      {reward.tasks.length === 0 ? (
        <p className="rw-muted">
          None yet. <a href={links.link({ reward: reward.id })}>Open the Link screen</a> to pick tasks from any tile or area.
        </p>
      ) : (
        <ul className="rw-list">
          {reward.tasks.map((t) => (
            <li key={t.id} className="rw-row">
              <a className="rw-row-main" href={links.task(t.id)}>
                <strong>{t.title}</strong>
              </a>
              <button type="button" className="rw-icon-btn" aria-label={`Unlink ${t.title}`} disabled={busy} onClick={() => unlink(t)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function RewardScreen({ rewardId }) {
  const { api } = useRewards();
  const reward = useResource(() => api.reward(rewardId), [api, rewardId]);
  const tiles = useResource(() => api.categories(), [api]);
  return (
    <Resource resource={reward} loadingLabel="Loading reward…">
      {(r) => <RewardView reward={r} tiles={tiles.data ?? []} onChanged={reward.refresh} />}
    </Resource>
  );
}
