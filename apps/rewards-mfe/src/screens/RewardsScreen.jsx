import { useState } from "react";
import { useRewards } from "../context.js";
import { useResource } from "../lib/useResource.js";
import { Chips, Empty, ErrorState, Loading, ProgressBar, Resource, ScreenHeader, useAction } from "../components/ui.jsx";
import { MATCH_MODES, scopeLabel, tasksInScope } from "../components/rewardScope.js";
import { AreaManager, EditTilesButton, TileManager, useTileEditing } from "../components/manage.jsx";
import { navigate } from "../lib/router.js";

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
  const what = reward.matchMode === "all" ? "tasks here" : "tagged tasks";
  return reward.ruleType === "streak" ? `Reach a ${n}-period streak` : `Complete ${what} ${n} time${n === 1 ? "" : "s"}`;
}

/** Tile → area ("Whole tile" by default) → how tasks count (LLR-4.12). */
function ScopeFields({ tiles, scope, onChange }) {
  const tile = tiles.find((t) => t.id === scope.categoryId);
  return (
    <>
      <span className="rw-field-label">Where</span>
      <div className="rw-scope-fields">
        <select
          aria-label="Tile"
          className="rw-select"
          value={scope.categoryId ?? ""}
          onChange={(e) => onChange({ ...scope, categoryId: e.target.value || null, areaId: null })}
          required
        >
          <option value="">Pick a tile…</option>
          {tiles.map((t) => (
            <option key={t.id} value={t.id}>
              {t.icon} {t.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Area"
          className="rw-select"
          value={scope.areaId ?? ""}
          disabled={!tile}
          onChange={(e) => onChange({ ...scope, areaId: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">Whole tile</option>
          {tile?.areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <span className="rw-field-label">Which tasks count</span>
      <Chips label="Which tasks count" options={MATCH_MODES} value={scope.matchMode} onChange={(matchMode) => onChange({ ...scope, matchMode })} />
    </>
  );
}

/** Checkbox list of the active tasks inside the scope, grouped by area (LLR-4.11, 4.12). */
function TaskPicker({ tasks, scope, selected, onChange }) {
  if (tasks.loading && tasks.data === undefined) return <Loading label="Loading tasks…" />;
  if (tasks.error && tasks.data === undefined) return <ErrorState error={tasks.error} onRetry={tasks.reload} />;
  const inScope = tasksInScope(tasks.data, scope);
  if (inScope.length === 0) return <p className="rw-muted">No active tasks here yet. Add some in this area first, or count all tasks here instead.</p>;

  const byArea = Map.groupBy(inScope, (t) => t.areaName);
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

function AutoCountHint({ tasks, scope }) {
  const count = tasksInScope(tasks.data ?? [], scope).length;
  return (
    <p className="rw-muted">
      {count} active task{count === 1 ? "" : "s"} here count now, plus any you add later.
    </p>
  );
}

function CreateReward({ tiles, tasks, preset, onCreated, onCancel }) {
  const { api, toast, celebrate } = useRewards();
  const [reward, setReward] = useState({ title: "", description: "", imageUrl: "", ruleType: "completions", threshold: 3 });
  const [scope, setScope] = useState({ categoryId: preset.categoryId ?? tiles[0]?.id ?? null, areaId: preset.areaId ?? null, matchMode: "selected" });
  const [taskIds, setTaskIds] = useState([]);
  const [busy, run] = useAction(toast);
  const set = (field) => (value) => setReward((r) => ({ ...r, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    // Only tasks still inside the chosen scope, in case the scope changed after ticking some.
    const inScope = new Set(tasksInScope(tasks.data ?? [], scope).map((t) => t.id));
    const created = await run(
      () =>
        api.createReward({
          ...reward,
          ...scope,
          title: reward.title.trim(),
          imageUrl: reward.imageUrl.trim() || null,
          threshold: Number(reward.threshold),
          taskIds: scope.matchMode === "selected" ? taskIds.filter((id) => inScope.has(id)) : [],
        }),
      "Reward created"
    );
    if (created) {
      if (created.status === "unlocked") celebrate([created]);
      onCreated(created);
    }
  };

  return (
    <form className="rw-card rw-form" onSubmit={submit} aria-label="Create a reward">
      <h3>New reward</h3>
      <input aria-label="Reward title" placeholder="e.g. Coffee at my favourite café" value={reward.title} onChange={(e) => set("title")(e.target.value)} maxLength={200} required />
      <textarea aria-label="Description" placeholder="Description (optional)" rows={2} value={reward.description} onChange={(e) => set("description")(e.target.value)} maxLength={2000} />
      <input aria-label="Image URL" type="url" placeholder="Image URL (optional)" value={reward.imageUrl} onChange={(e) => set("imageUrl")(e.target.value)} maxLength={500} />
      <ScopeFields tiles={tiles} scope={scope} onChange={setScope} />
      <span className="rw-field-label">Unlock rule</span>
      <Chips label="Unlock rule" options={RULES} value={reward.ruleType} onChange={set("ruleType")} />
      <label className="rw-number">
        N =
        <input type="number" min={1} max={365} inputMode="numeric" value={reward.threshold} onChange={(e) => set("threshold")(e.target.value)} required />
      </label>
      {scope.categoryId &&
        (scope.matchMode === "selected" ? (
          <>
            <span className="rw-field-label">Tasks that count</span>
            <TaskPicker tasks={tasks} scope={scope} selected={taskIds} onChange={setTaskIds} />
          </>
        ) : (
          <AutoCountHint tasks={tasks} scope={scope} />
        ))}
      <div className="rw-inline-form">
        <button type="submit" className="rw-btn rw-btn--primary" disabled={busy || !reward.title.trim() || !scope.categoryId}>
          {busy ? "Creating…" : "Create reward"}
        </button>
        <button type="button" className="rw-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Change tile / area / match mode while locked; narrowing asks before untagging (LLR-4.16). */
function ScopeEditor({ reward, tiles, onSaved, onCancel }) {
  const { api, toast } = useRewards();
  const [scope, setScope] = useState({ categoryId: reward.categoryId, areaId: reward.areaId, matchMode: reward.matchMode });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      let updated;
      try {
        updated = await api.updateReward(reward.id, scope);
      } catch (error) {
        if (error.status !== 409 || !error.message.includes("untag") || !window.confirm(error.message)) throw error;
        updated = await api.updateReward(reward.id, { ...scope, untagOutside: true });
      }
      toast("Saved");
      onSaved(updated);
    } catch (error) {
      toast(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rw-form rw-scope-editor">
      <ScopeFields tiles={tiles} scope={scope} onChange={setScope} />
      <div className="rw-inline-form">
        <button type="button" className="rw-btn rw-btn--primary" disabled={busy || !scope.categoryId} onClick={save}>
          {busy ? "Saving…" : "Save"}
        </button>
        {!reward.needsTile && (
          <button type="button" className="rw-btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function RewardCard({ reward, tiles, tasks, onChanged }) {
  const { api, links, toast, celebrate } = useRewards();
  const [editing, setEditing] = useState(reward.needsTile ? "scope" : null); // null | "scope" | "tasks"
  const [selected, setSelected] = useState(() => reward.tasks.map((t) => t.id));
  const [busy, run] = useAction(toast);
  const locked = reward.status === "locked";

  const claim = async () => {
    if (await run(() => api.updateReward(reward.id, { status: "claimed" }), `Enjoy: ${reward.title} 🎁`)) onChanged();
  };
  const saveTags = async () => {
    const updated = await run(() => api.setRewardTasks(reward.id, selected), "Tasks updated");
    if (updated) {
      if (updated.status === "unlocked") celebrate([updated]);
      setEditing(null);
      onChanged();
    }
  };
  const scopeSaved = (updated) => {
    if (updated.status === "unlocked") celebrate([updated]);
    setEditing(null);
    onChanged();
  };

  return (
    <li className={`rw-card rw-reward rw-reward--${reward.status}`}>
      {reward.imageUrl && <img src={reward.imageUrl} alt="" loading="lazy" />}
      <div className="rw-reward-head">
        <h3>{reward.title}</h3>
        <span className={`rw-status rw-status--${reward.status}`}>{reward.status}</span>
      </div>
      <p className={`rw-scope${reward.needsTile ? " rw-scope--missing" : ""}`}>
        {reward.needsTile ? (
          "Needs a tile: its tasks come from different tiles. Pick where it belongs."
        ) : (
          <>
            <a href={reward.areaId ? links.area(reward.areaId) : links.category(reward.categoryId)}>{scopeLabel(reward)}</a>
            {" · "}
            {reward.matchMode === "all" ? "All tasks here count" : "Selected tasks"}
          </>
        )}
      </p>
      {reward.description && <p className="rw-muted">{reward.description}</p>}
      <p className="rw-rule">{ruleText(reward)}</p>
      <ProgressBar percent={reward.progress.percent} label={`${reward.title} progress`} />
      <small className="rw-muted">
        {reward.progress.current} / {reward.progress.target}
      </small>

      {editing === "scope" ? (
        <ScopeEditor reward={reward} tiles={tiles} onSaved={scopeSaved} onCancel={() => setEditing(null)} />
      ) : editing === "tasks" ? (
        <>
          <TaskPicker tasks={tasks} scope={reward} selected={selected} onChange={setSelected} />
          <div className="rw-inline-form">
            <button type="button" className="rw-btn rw-btn--primary" disabled={busy} onClick={saveTags}>
              Save tasks
            </button>
            <button type="button" className="rw-btn" onClick={() => (setEditing(null), setSelected(reward.tasks.map((t) => t.id)))}>
              Cancel
            </button>
          </div>
        </>
      ) : reward.matchMode === "all" ? (
        <p className="rw-muted">
          Counts {reward.matchedTaskCount} task{reward.matchedTaskCount === 1 ? "" : "s"} automatically, including new ones.
        </p>
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
        {locked && !editing && (
          <>
            <button type="button" className="rw-btn" onClick={() => setEditing("scope")}>
              Change where
            </button>
            {reward.matchMode === "selected" && (
              <button type="button" className="rw-btn" onClick={() => setEditing("tasks")}>
                Edit tasks
              </button>
            )}
          </>
        )}
      </div>
    </li>
  );
}

// ── Screens: tiles -> a tile's areas -> an area's rewards, mirroring the Areas tab ─────────

const ACTIVE = new Set(["locked", "unlocked"]);

/** "2 active · 🎁 1 to claim · 1 claimed", or "No rewards yet". */
function countsText(rewards) {
  if (rewards.length === 0) return "No rewards yet";
  const active = rewards.filter((r) => ACTIVE.has(r.status)).length;
  const ready = rewards.filter((r) => r.status === "unlocked").length;
  const claimed = rewards.length - active;
  return [`${active} active`, ready && `🎁 ${ready} to claim`, claimed && `${claimed} claimed`].filter(Boolean).join(" · ");
}

function RewardList({ rewards, tiles, tasks, onChanged, emptyTitle, emptyText }) {
  const [status, setStatus] = useState("");
  const shown = status ? rewards.filter((r) => r.status === status) : rewards;
  return (
    <>
      {rewards.length > 0 && <Chips label="Filter rewards" options={STATUS_FILTERS} value={status} onChange={setStatus} allowNone />}
      {shown.length === 0 ? (
        <Empty title={status ? `No ${status} rewards` : emptyTitle}>{!status && emptyText}</Empty>
      ) : (
        <ul className="rw-rewards">
          {shown.map((r) => (
            <RewardCard
              key={`${r.id}-${r.status}-${r.tasks.length}-${r.categoryId}-${r.areaId}-${r.matchMode}`}
              reward={r}
              tiles={tiles}
              tasks={tasks}
              onChanged={onChanged}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function NewButton({ onClick }) {
  return (
    <button type="button" className="rw-btn rw-btn--primary" onClick={onClick}>
      + New reward
    </button>
  );
}

/** Level 1: one card per tile, like the Areas tab, with reward counts and the same "Edit tiles" mode. */
function RewardTiles({ tiles, rewards, tasks, onChanged }) {
  const { links } = useRewards();
  const [editMode, setEditMode] = useState(false);
  const needsTile = rewards.filter((r) => r.needsTile);
  return (
    <section>
      <ScreenHeader
        title="Rewards"
        subtitle="Pick a tile to see what you can earn there."
        actions={<EditTilesButton editing={editMode} onToggle={() => setEditMode((on) => !on)} />}
      />
      {editMode ? (
        <TileManager tiles={tiles} onChanged={onChanged} />
      ) : (
      <>
      {needsTile.length > 0 && (
        <div className="rw-reward-group">
          <h3 className="rw-group-title">Needs a tile</h3>
          <RewardList rewards={needsTile} tiles={tiles} tasks={tasks} onChanged={onChanged} />
        </div>
      )}
      <div className="rw-tiles">
        {tiles.map((t) => (
          <a key={t.id} className="rw-tile" href={links.rewards({ tile: t.id })}>
            <span className="rw-tile-icon" aria-hidden="true">
              {t.icon}
            </span>
            <strong>{t.name}</strong>
            <small>{countsText(rewards.filter((r) => r.categoryId === t.id))}</small>
          </a>
        ))}
      </div>
      </>
      )}
    </section>
  );
}

/** Level 2: rewards for the whole tile, then one row per area (like a tile on the Areas tab). */
function RewardTile({ tile, rewards, tiles, tasks, onChanged, openForm }) {
  const { links } = useRewards();
  const [creating, setCreating] = useState(openForm);
  const tileEditing = useTileEditing(tile, { onSaved: onChanged, onDeleted: () => navigate(links.rewards()) });
  const inTile = rewards.filter((r) => r.categoryId === tile.id);
  return (
    <section>
      <ScreenHeader
        crumbs={[["All rewards", links.rewards()]]}
        title={`${tile.icon} ${tile.name}`}
        subtitle="Rewards for the whole tile, and for each area."
        actions={tileEditing.actions}
      />
      {tileEditing.panel}
      {!creating && (
        <div className="rw-inline-form">
          <NewButton onClick={() => setCreating(true)} />
        </div>
      )}
      {creating && (
        <CreateReward
          tiles={tiles}
          tasks={tasks}
          preset={{ categoryId: tile.id }}
          onCancel={() => setCreating(false)}
          onCreated={() => (setCreating(false), onChanged())}
        />
      )}
      <div className="rw-section-head">
        <h3>For all of {tile.name}</h3>
      </div>
      <RewardList
        rewards={inTile.filter((r) => !r.areaId)}
        tiles={tiles}
        tasks={tasks}
        onChanged={onChanged}
        emptyTitle="No whole-tile rewards"
        emptyText={`A reward here can count tasks from any area of ${tile.name}.`}
      />
      <div className="rw-section-head">
        <h3>By area</h3>
      </div>
      <AreaManager
        tile={tile}
        href={(a) => links.rewards({ area: a.id })}
        subtitle={(a) => countsText(inTile.filter((r) => r.areaId === a.id))}
        onChanged={onChanged}
      />
    </section>
  );
}

/** Level 3: rewards scoped to this area; whole-tile rewards that also count here are listed below. */
function RewardArea({ tile, area, rewards, tiles, tasks, onChanged, openForm }) {
  const { links } = useRewards();
  const [creating, setCreating] = useState(openForm);
  const here = rewards.filter((r) => r.areaId === area.id);
  const alsoHere = rewards.filter((r) => r.categoryId === tile.id && !r.areaId && ACTIVE.has(r.status));
  return (
    <section>
      <ScreenHeader
        crumbs={[
          ["All rewards", links.rewards()],
          [tile.name, links.rewards({ tile: tile.id })],
        ]}
        title={area.name}
        subtitle={
          <>
            Rewards for {area.name} tasks. <a href={links.area(area.id)}>See its tasks</a>
          </>
        }
        actions={!creating && <NewButton onClick={() => setCreating(true)} />}
      />
      {creating && (
        <CreateReward
          tiles={tiles}
          tasks={tasks}
          preset={{ categoryId: tile.id, areaId: area.id }}
          onCancel={() => setCreating(false)}
          onCreated={() => (setCreating(false), onChanged())}
        />
      )}
      <RewardList
        rewards={here}
        tiles={tiles}
        tasks={tasks}
        onChanged={onChanged}
        emptyTitle={`No rewards for ${area.name} yet`}
        emptyText="Create one and choose which of its tasks earn it."
      />
      {alsoHere.length > 0 && (
        <div className="rw-card rw-also">
          <h3>Also earnable here</h3>
          <p className="rw-muted">
            These {tile.name} rewards count tasks from every area, including {area.name}.
          </p>
          <ul className="rw-mini-list">
            {alsoHere.map((r) => (
              <li key={r.id}>
                <a href={links.rewards({ tile: tile.id })}>{r.title}</a>
                <span className={`rw-status rw-status--${r.status}`}>{r.status}</span>
                <ProgressBar percent={r.progress.percent} label={`${r.title} progress`} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function NotFound({ what }) {
  const { links } = useRewards();
  return (
    <Empty title={`${what} not found`}>
      It may have been removed. <a href={links.rewards()}>Back to all rewards</a>.
    </Empty>
  );
}

export default function RewardsScreen({ view = "rewards", param = null, query = "" }) {
  const { api, links } = useRewards();
  const tiles = useResource(() => api.categories(), [api]);
  const rewards = useResource(() => api.rewards(), [api]);
  const tasks = useResource(() => api.allTasks({ status: "active" }), [api]);
  const openForm = new URLSearchParams(query).get("new") === "1";

  return (
    <Resource resource={tiles} loadingLabel="Loading tiles…">
      {(tileList) => (
        <Resource resource={rewards} loadingLabel="Loading rewards…">
          {(rewardList) => {
            if (tileList.length === 0) {
              return (
                <Empty title="Create a tile first">
                  Rewards live in tiles and areas, like tasks do. <a href={links.tiles()}>Go to Areas</a>.
                </Empty>
              );
            }
            // Tile and area edits change both lists (e.g. deleting an area widens its rewards).
            const refreshAll = () => (tiles.refresh(), rewards.refresh());
            const shared = { rewards: rewardList, tiles: tileList, tasks, onChanged: refreshAll, openForm };
            if (view === "rewardsTile") {
              const tile = tileList.find((t) => t.id === param);
              return tile ? <RewardTile tile={tile} {...shared} /> : <NotFound what="Tile" />;
            }
            if (view === "rewardsArea") {
              const tile = tileList.find((t) => t.areas.some((a) => a.id === Number(param)));
              if (!tile) return <NotFound what="Area" />;
              return <RewardArea tile={tile} area={tile.areas.find((a) => a.id === Number(param))} {...shared} />;
            }
            return <RewardTiles {...shared} />;
          }}
        </Resource>
      )}
    </Resource>
  );
}
