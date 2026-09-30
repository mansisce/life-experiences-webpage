import { useState } from "react";
import { useRewards } from "../context.js";
import { navigate } from "../lib/router.js";
import { useResource } from "../lib/useResource.js";
import { Chips, ProgressBar, Resource, ScreenHeader, useAction } from "../components/ui.jsx";
import { VISIBILITY } from "../components/plan.jsx";
import { areaOptions, IdeaCard, isIdea, PersonInput, RULES, ruleText, usePeople, whereText } from "../components/rewards.jsx";

const PRIVACY = VISIBILITY.map(([v, label]) => [v, v === "silent" ? "🔕 Private" : label]);

function EditReward({ reward, tiles, onSaved, onCancel }) {
  const { api, toast } = useRewards();
  const people = usePeople();
  const [form, setForm] = useState({
    title: reward.title,
    threshold: reward.threshold,
    ruleType: reward.ruleType,
    areaId: reward.areaId ?? "",
    forWhom: reward.forWhom,
    visibility: reward.visibility,
    link: reward.link ?? "",
    whereSeen: reward.whereSeen ?? "",
    description: reward.description,
    imageUrl: reward.imageUrl ?? "",
  });
  const [busy, run] = useAction(toast);
  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));
  const setFrom = (field) => (e) => set(field)(e.target.value);

  const submit = async (e) => {
    e.preventDefault();
    const changes = {
      title: form.title.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim() || null,
      areaId: form.areaId ? Number(form.areaId) : null,
      forWhom: form.forWhom.trim() || "Me",
      visibility: form.visibility,
      link: form.link.trim() || null,
      whereSeen: form.whereSeen.trim() || null,
    };
    if (reward.status === "locked") Object.assign(changes, { ruleType: form.ruleType, threshold: Number(form.threshold) || 1 });
    if (await run(() => api.updateReward(reward.id, changes), "Saved")) onSaved();
  };

  return (
    <form className="rw-card rw-form" onSubmit={submit} aria-label="Edit reward">
      <input aria-label="Title" value={form.title} onChange={setFrom("title")} maxLength={200} autoFocus required />
      {reward.status === "locked" && (
        <Chips label="How it unlocks" options={reward.ruleType === "streak" ? [...RULES, ["streak", "Streak"]] : RULES} value={form.ruleType} onChange={set("ruleType")} />
      )}
      {reward.status === "locked" && form.ruleType !== "milestone" && (
        <label className="rw-number">
          Unlocks after
          <input type="number" aria-label="Completions needed" min={1} max={365} value={form.threshold} onChange={setFrom("threshold")} required />
          completions
        </label>
      )}
      <PersonInput value={form.forWhom} onChange={set("forWhom")} people={people} id="rw-people-edit" />
      <Chips label="Who can see it" options={PRIVACY} value={form.visibility} onChange={set("visibility")} />
      <select aria-label="Area (optional)" className="rw-select" value={form.areaId} onChange={setFrom("areaId")}>
        <option value="">No area</option>
        {areaOptions(tiles).map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>
      <input aria-label="Where seen" placeholder="Where seen (optional)" value={form.whereSeen} onChange={setFrom("whereSeen")} maxLength={120} />
      <input aria-label="Link" type="url" placeholder="Link (optional)" value={form.link} onChange={setFrom("link")} maxLength={500} />
      <textarea aria-label="Note" placeholder="Note (optional)" rows={2} value={form.description} onChange={setFrom("description")} maxLength={2000} />
      {!reward.coverUrl && <input aria-label="Picture link" type="url" placeholder="Picture link (optional)" value={form.imageUrl} onChange={setFrom("imageUrl")} maxLength={500} />}
      <div className="rw-inline-form">
        <button type="submit" className="rw-btn rw-btn--primary" disabled={busy || !form.title.trim()}>
          Save
        </button>
        <button type="button" className="rw-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Add, replace or remove the cover photo (camera or gallery). */
function CoverPhoto({ reward, onChanged }) {
  const { api, toast } = useRewards();
  const [busy, run] = useAction(toast);
  const upload = async (file) => {
    if (file && (await run(() => api.setCover(reward.id, file), "Photo saved"))) onChanged();
  };
  const remove = async () => {
    if (await run(() => api.removeCover(reward.id), "Photo removed")) onChanged();
  };
  return (
    <div className="rw-inline-form">
      <label className="rw-photo-pick">
        <span className="rw-btn">{busy ? "Uploading…" : reward.coverUrl ? "📷 Change photo" : "📷 Add a photo"}</span>
        <input type="file" accept="image/*" capture="environment" aria-label="Cover photo" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} hidden />
      </label>
      {reward.coverUrl && (
        <button type="button" className="rw-link-btn" disabled={busy} onClick={remove}>
          Remove photo
        </button>
      )}
    </div>
  );
}

function RewardView({ reward, tiles, onChanged }) {
  const { api, links, toast } = useRewards();
  const [editing, setEditing] = useState(false);
  const [busy, run] = useAction(toast);
  const where = whereText(reward);
  const idea = isIdea(reward);
  const picture = reward.coverUrl ? api.fileUrl(reward.coverUrl) : reward.imageUrl;

  const remove = async () => {
    if (!window.confirm(`Delete “${reward.title}”? ${idea ? "" : "Its tasks and their history stay."}`)) return;
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
        title={`${idea ? "💡 " : ""}${reward.title}`}
        subtitle={[reward.forWhom !== "Me" && `For ${reward.forWhom}`, where || "Not kept in an area", reward.visibility === "silent" && "🔕 Private"].filter(Boolean).join(" · ")}
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
        <CoverPhoto reward={reward} onChanged={onChanged} />
      )}

      {idea ? (
        // Ideas: the same card as in lists, with Turn into reward / Bought / Dropped / Reopen.
        <ul className="rw-rewards">
          <IdeaCard key={reward.status} idea={reward} onChanged={onChanged} showWhere={false} />
        </ul>
      ) : (
        <>
          {!editing && reward.description && <p className="rw-notes">{reward.description}</p>}
          <div className={`rw-card rw-reward rw-reward--${reward.status}`}>
            {picture && <img src={picture} alt="" loading="lazy" />}
            <div className="rw-reward-head">
              <p className="rw-rule">{ruleText(reward)}</p>
              <span className={`rw-status rw-status--${reward.status}`}>{reward.status}</span>
            </div>
            <ProgressBar percent={reward.progress.percent} label={`${reward.title} progress`} />
            <small className="rw-muted">
              {reward.progress.current} / {reward.progress.target}
            </small>
            {reward.link && (
              <a className="rw-where" href={reward.link} target="_blank" rel="noreferrer">
                🔗 {reward.link.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60)}
              </a>
            )}
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
        </>
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
