import { useState } from "react";
import { useRewards } from "../context.js";
import { useResource } from "../lib/useResource.js";
import { Chips, Empty, ErrorState, Loading, ProgressBar, Resource, ScreenHeader, useAction } from "../components/ui.jsx";

const RULES = [
  ["completions", "N completions"],
  ["streak", "Streak of N"],
];
const STATUS_FILTERS = [
  ["locked", "Locked"],
  ["unlocked", "Unlocked"],
  ["claimed", "Claimed"],
];

function ruleText(reward) {
  const n = reward.threshold;
  return reward.ruleType === "streak" ? `Reach a ${n}-period streak` : `Complete tagged tasks ${n} time${n === 1 ? "" : "s"}`;
}

/** Checkbox list of active tasks grouped by area. */
function TaskPicker({ tasks, selected, onChange }) {
  if (tasks.loading && tasks.data === undefined) return <Loading label="Loading tasks…" />;
  if (tasks.error && tasks.data === undefined) return <ErrorState error={tasks.error} onRetry={tasks.reload} />;
  if (tasks.data.length === 0) return <p className="rw-muted">No active tasks yet. Add some in an area first.</p>;

  const byArea = Map.groupBy(tasks.data, (t) => t.areaName);
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div className="rw-picker">
      {[...byArea].map(([areaName, areaTasks]) => (
        <fieldset key={areaName}>
          <legend>{areaName}</legend>
          {areaTasks.map((t) => (
            <label key={t.id} className="rw-check">
              <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggle(t.id)} />
              {t.title}
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}

const EMPTY_REWARD = { title: "", description: "", imageUrl: "", ruleType: "completions", threshold: 3, taskIds: [] };

function CreateReward({ tasks, onCreated, onCancel }) {
  const { api, toast, celebrate } = useRewards();
  const [reward, setReward] = useState(EMPTY_REWARD);
  const [busy, run] = useAction(toast);
  const set = (field) => (value) => setReward((r) => ({ ...r, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    const created = await run(
      () => api.createReward({ ...reward, title: reward.title.trim(), imageUrl: reward.imageUrl.trim() || null, threshold: Number(reward.threshold) }),
      "Reward created"
    );
    if (created) {
      if (created.status === "unlocked") celebrate([created]);
      onCreated();
    }
  };

  return (
    <form className="rw-card rw-form" onSubmit={submit} aria-label="Create a reward">
      <h3>New reward</h3>
      <input aria-label="Reward title" placeholder="e.g. Coffee at my favourite café" value={reward.title} onChange={(e) => set("title")(e.target.value)} maxLength={200} required />
      <textarea aria-label="Description" placeholder="Description (optional)" rows={2} value={reward.description} onChange={(e) => set("description")(e.target.value)} maxLength={2000} />
      <input aria-label="Image URL" type="url" placeholder="Image URL (optional)" value={reward.imageUrl} onChange={(e) => set("imageUrl")(e.target.value)} maxLength={500} />
      <span className="rw-field-label">Unlock rule</span>
      <Chips label="Unlock rule" options={RULES} value={reward.ruleType} onChange={set("ruleType")} />
      <label className="rw-number">
        N =
        <input type="number" min={1} max={365} inputMode="numeric" value={reward.threshold} onChange={(e) => set("threshold")(e.target.value)} required />
      </label>
      <span className="rw-field-label">Tagged tasks</span>
      <TaskPicker tasks={tasks} selected={reward.taskIds} onChange={set("taskIds")} />
      <div className="rw-inline-form">
        <button type="submit" className="rw-btn rw-btn--primary" disabled={busy || !reward.title.trim()}>
          {busy ? "Creating…" : "Create reward"}
        </button>
        <button type="button" className="rw-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function RewardCard({ reward, tasks, onChanged }) {
  const { api, links, toast, celebrate } = useRewards();
  const [editingTags, setEditingTags] = useState(false);
  const [selected, setSelected] = useState(() => reward.tasks.map((t) => t.id));
  const [busy, run] = useAction(toast);

  const claim = async () => {
    if (await run(() => api.updateReward(reward.id, { status: "claimed" }), `Enjoy: ${reward.title} 🎁`)) onChanged();
  };
  const saveTags = async () => {
    const updated = await run(() => api.setRewardTasks(reward.id, selected), "Tasks updated");
    if (updated) {
      if (reward.status === "locked" && updated.status === "unlocked") celebrate([updated]);
      setEditingTags(false);
      onChanged();
    }
  };

  return (
    <li className={`rw-card rw-reward rw-reward--${reward.status}`}>
      {reward.imageUrl && <img src={reward.imageUrl} alt="" loading="lazy" />}
      <div className="rw-reward-head">
        <h3>{reward.title}</h3>
        <span className={`rw-status rw-status--${reward.status}`}>{reward.status}</span>
      </div>
      {reward.description && <p className="rw-muted">{reward.description}</p>}
      <p className="rw-rule">{ruleText(reward)}</p>
      <ProgressBar percent={reward.progress.percent} label={`${reward.title} progress`} />
      <small className="rw-muted">
        {reward.progress.current} / {reward.progress.target}
      </small>

      {editingTags ? (
        <>
          <TaskPicker tasks={tasks} selected={selected} onChange={setSelected} />
          <div className="rw-inline-form">
            <button type="button" className="rw-btn rw-btn--primary" disabled={busy} onClick={saveTags}>
              Save tasks
            </button>
            <button type="button" className="rw-btn" onClick={() => (setEditingTags(false), setSelected(reward.tasks.map((t) => t.id)))}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <p className="rw-tags">
          {reward.tasks.length === 0 ? (
            <span className="rw-muted">No tasks tagged</span>
          ) : (
            reward.tasks.map((t) => (
              <a key={t.id} href={links.task(t.id)} className="rw-tag">
                {t.title}
              </a>
            ))
          )}
        </p>
      )}

      <div className="rw-inline-form">
        {reward.status === "unlocked" && (
          <button type="button" className="rw-btn rw-btn--primary" disabled={busy} onClick={claim}>
            Claim 🎁
          </button>
        )}
        {reward.status === "locked" && !editingTags && (
          <button type="button" className="rw-btn" onClick={() => setEditingTags(true)}>
            Edit tasks
          </button>
        )}
      </div>
    </li>
  );
}

export default function RewardsScreen() {
  const { api, links } = useRewards();
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);
  const rewards = useResource(() => api.rewards({ status }), [api, status]);
  const tasks = useResource(() => api.allTasks({ status: "active" }), [api]);

  return (
    <section>
      <ScreenHeader
        crumbs={[["All tiles", links.tiles()]]}
        title="Rewards"
        subtitle="Treats you unlock by keeping up with your tasks."
        actions={
          !creating && (
            <button type="button" className="rw-btn rw-btn--primary" onClick={() => setCreating(true)}>
              + New
            </button>
          )
        }
      />
      {creating && <CreateReward tasks={tasks} onCancel={() => setCreating(false)} onCreated={() => (setCreating(false), rewards.refresh())} />}
      <Chips label="Filter rewards" options={STATUS_FILTERS} value={status} onChange={setStatus} allowNone />
      <Resource resource={rewards} loadingLabel="Loading rewards…">
        {(data) =>
          data.length === 0 ? (
            <Empty title={status ? `No ${status} rewards` : "No rewards yet"}>{!status && "Create one and tag it to the tasks that earn it."}</Empty>
          ) : (
            <ul className="rw-rewards">
              {data.map((r) => (
                <RewardCard key={`${r.id}-${r.status}-${r.tasks.length}`} reward={r} tasks={tasks} onChanged={rewards.refresh} />
              ))}
            </ul>
          )
        }
      </Resource>
    </section>
  );
}
