import { useEffect, useState } from "react";
import { useGoals } from "./context.jsx";
import DailyLogModal from "./DailyLogModal.jsx";

export default function GoalDetail({ goalId, onBack }) {
  const { getGoalDetail, addMilestone, deleteMilestone, addReward, claimReward, receiveReward, updateGoal, createGoal } = useGoals();
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [rewardForm, setRewardForm] = useState({ title: "", description: "", costValue: "", milestoneId: "" });
  const [msForm, setMsForm] = useState({ dayNumber: "", title: "" });

  async function reload() {
    setLoading(true);
    const d = await getGoalDetail(goalId);
    setGoal(d);
    setLoading(false);
  }

  useEffect(() => { reload(); }, [goalId]);

  if (loading) return <div style={{ padding: "2rem", color: "#9ca3af" }}>Loading...</div>;
  if (!goal) return <div style={{ padding: "2rem", color: "#f87171" }}>Goal not found.</div>;

  const { currentStreak = 0, longestStreak = 0, totalDone = 0 } = goal.streak || {};
  const today = new Date().toISOString().slice(0, 10);
  const todayLogged = goal.logs?.some(l => l.date === today);
  const progress = goal.targetDays ? Math.min(100, Math.round((currentStreak / Number(goal.targetDays)) * 100)) : null;

  const earnedRewards = [
    ...(goal.rewards || []),
    ...(goal.milestones || []).flatMap(m => m.rewards || []),
  ].filter(r => r.status === "earned" || r.status === "claimed" || r.status === "received");

  async function handleRepeat() {
    const today = new Date().toISOString().slice(0, 10);
    await createGoal({
      title: goal.title,
      description: goal.description || "",
      type: goal.type,
      targetDays: goal.targetDays ? Number(goal.targetDays) : undefined,
      categoryId: goal.category?.id,
      breakResetDays: Number(goal.breakResetDays) || 1,
      startDate: today,
    });
    onBack();
  }

  async function handleAddReward(e) {
    e.preventDefault();
    await addReward(goalId, { ...rewardForm, costValue: rewardForm.costValue ? Number(rewardForm.costValue) : null, milestoneId: rewardForm.milestoneId || null });
    setRewardForm({ title: "", description: "", costValue: "", milestoneId: "" });
    setShowAddReward(false);
    reload();
  }

  async function handleAddMilestone(e) {
    e.preventDefault();
    await addMilestone(goalId, msForm);
    setMsForm({ dayNumber: "", title: "" });
    setShowAddMilestone(false);
    reload();
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <button onClick={onBack} style={backBtn}>← All goals</button>

      {/* Header */}
      <div style={headerCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {(goal.categories || (goal.category ? [goal.category] : [])).map(c => (
                <span key={c.id} style={catBadge}>{c.icon} {c.name}</span>
              ))}
            </div>
            <h2 style={{ margin: "0.5rem 0 0.25rem", color: "var(--fg, #f0f0f0)" }}>{goal.title}</h2>
            {goal.description && <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.9rem" }}>{goal.description}</p>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
            <button
              onClick={() => setShowLog(true)}
              style={{ ...logBtn, opacity: todayLogged ? 0.6 : 1 }}
            >
              {todayLogged ? "✓ Logged today" : "+ Log today"}
            </button>
            <button onClick={handleRepeat} style={repeatBtn}>↩ Repeat goal</button>
          </div>
        </div>

        {/* Stats */}
        <div style={statsRow}>
          <Stat label="Current streak" value={`${currentStreak}d 🔥`} accent />
          <Stat label="Longest streak" value={`${longestStreak}d`} />
          <Stat label="Total done" value={`${totalDone} days`} />
          {goal.targetDays && <Stat label="Target" value={`${goal.targetDays} days`} />}
        </div>

        {progress !== null && (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.35rem" }}>
              <span>Progress</span><span>{progress}%</span>
            </div>
            <div style={{ height: 8, background: "var(--border, #333)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: progress === 100 ? "#16a34a" : "var(--accent, #7c3aed)", borderRadius: 4, transition: "width 0.5s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Recent logs */}
      <Section title="Recent logs">
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {getLast30Days().map(d => {
            const log = goal.logs?.find(l => l.date === d);
            const isToday = d === today;
            let bg = "var(--border, #333)";
            if (log?.didIt) bg = "#16a34a";
            else if (log && !log.didIt) bg = "#dc2626";
            return (
              <div key={d} title={`${d}${log?.note ? ` — ${log.note}` : ""}`} style={{ width: 18, height: 18, borderRadius: 3, background: bg, border: isToday ? "2px solid #f59e0b" : "none", flexShrink: 0 }} />
            );
          })}
        </div>
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.6rem", fontSize: "0.77rem", color: "#9ca3af" }}>
          <span>🟢 Done</span><span>🔴 Missed</span><span style={{ border: "1px solid #f59e0b", padding: "0 4px", borderRadius: 2 }}>Today</span>
        </div>
      </Section>

      {/* Milestones */}
      <Section
        title="Milestones"
        action={<button onClick={() => setShowAddMilestone(!showAddMilestone)} style={smallBtn}>+ Add</button>}
      >
        {showAddMilestone && (
          <form onSubmit={handleAddMilestone} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <input style={{ ...sInput, flex: "0 0 90px" }} type="number" min="1" placeholder="Day #" value={msForm.dayNumber} onChange={e => setMsForm(f => ({ ...f, dayNumber: e.target.value }))} required />
            <input style={{ ...sInput, flex: 1, minWidth: 140 }} placeholder="Milestone title" value={msForm.title} onChange={e => setMsForm(f => ({ ...f, title: e.target.value }))} required />
            <button style={saveBtn} type="submit">Save</button>
          </form>
        )}
        {goal.milestones?.length === 0 && <p style={empty}>No milestones yet.</p>}
        {goal.milestones?.map(m => (
          <MilestoneRow key={m.id} milestone={m} currentStreak={currentStreak} goalId={goalId}
            onDelete={async () => { await deleteMilestone(m.id); reload(); }}
            onAddReward={async (data) => { await addReward(goalId, { ...data, milestoneId: m.id }); reload(); }}
            onClaim={async (rid) => { await claimReward(rid); reload(); }}
            onReceive={async (rid) => { await receiveReward(rid); reload(); }}
          />
        ))}
      </Section>

      {/* Goal rewards */}
      <Section
        title="Completion reward"
        action={<button onClick={() => setShowAddReward(!showAddReward)} style={smallBtn}>+ Add</button>}
      >
        {showAddReward && (
          <form onSubmit={handleAddReward} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
            <input style={sInput} placeholder="Reward title *" value={rewardForm.title} onChange={e => setRewardForm(f => ({ ...f, title: e.target.value }))} required />
            <input style={sInput} placeholder="Description" value={rewardForm.description} onChange={e => setRewardForm(f => ({ ...f, description: e.target.value }))} />
            <input style={sInput} type="number" placeholder="Cost value (optional)" value={rewardForm.costValue} onChange={e => setRewardForm(f => ({ ...f, costValue: e.target.value }))} />
            <button style={saveBtn} type="submit">Add reward</button>
          </form>
        )}
        {goal.rewards?.length === 0 && <p style={empty}>Add a reward you'll give yourself when you complete this goal.</p>}
        {goal.rewards?.map(r => (
          <RewardRow key={r.id} reward={r}
            onClaim={async () => { await claimReward(r.id); reload(); }}
            onReceive={async () => { await receiveReward(r.id); reload(); }}
          />
        ))}
      </Section>

      {showLog && <DailyLogModal goal={goal} onClose={() => { setShowLog(false); reload(); }} />}
    </div>
  );
}

function MilestoneRow({ milestone, currentStreak, onDelete, onAddReward, onClaim, onReceive }) {
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [rf, setRf] = useState({ title: "", costValue: "" });
  const reached = currentStreak >= milestone.dayNumber;

  return (
    <div style={{ ...msCard, borderColor: reached ? "#16a34a55" : "var(--border, #333)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "0.78rem", color: reached ? "#4ade80" : "#9ca3af" }}>Day {milestone.dayNumber} {reached ? "✓" : ""}</span>
          <p style={{ margin: "0.2rem 0 0", color: "var(--fg, #f0f0f0)", fontWeight: 500 }}>{milestone.title}</p>
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button onClick={() => setShowRewardForm(!showRewardForm)} style={tinyBtn}>+ Reward</button>
          <button onClick={onDelete} style={{ ...tinyBtn, color: "#f87171" }}>✕</button>
        </div>
      </div>
      {showRewardForm && (
        <form onSubmit={async e => { e.preventDefault(); await onAddReward(rf); setShowRewardForm(false); }} style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
          <input style={{ ...sInput, flex: 1, minWidth: 140 }} placeholder="Reward title *" value={rf.title} onChange={e => setRf(f => ({ ...f, title: e.target.value }))} required />
          <input style={{ ...sInput, flex: "0 0 100px" }} type="number" placeholder="₹ cost" value={rf.costValue} onChange={e => setRf(f => ({ ...f, costValue: e.target.value }))} />
          <button style={saveBtn} type="submit">Add</button>
        </form>
      )}
      {milestone.rewards?.map(r => (
        <RewardRow key={r.id} reward={r} onClaim={() => onClaim(r.id)} onReceive={() => onReceive(r.id)} compact />
      ))}
    </div>
  );
}

function RewardRow({ reward, onClaim, onReceive, compact }) {
  const statusColor = { locked: "#888", earned: "#f59e0b", claimed: "#3b82f6", received: "#16a34a" };
  const statusLabel = { locked: "🔒 Locked", earned: "⭐ Earned", claimed: "📦 Claimed", received: "✅ Received" };
  return (
    <div style={{ ...rewardCard, marginTop: compact ? "0.5rem" : "0.75rem", borderColor: statusColor[reward.status] + "55" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <div>
          <span style={{ fontWeight: 600, color: "var(--fg, #f0f0f0)" }}>{reward.title}</span>
          {reward.costValue && <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "#9ca3af" }}>₹{reward.costValue}</span>}
          {reward.description && <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "#9ca3af" }}>{reward.description}</p>}
        </div>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.78rem", color: statusColor[reward.status] }}>{statusLabel[reward.status]}</span>
          {reward.status === "earned" && <button onClick={onClaim} style={actionBtn}>Claim</button>}
          {reward.status === "claimed" && <button onClick={onReceive} style={{ ...actionBtn, background: "#16a34a22", borderColor: "#16a34a", color: "#4ade80" }}>Mark received</button>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, action }) {
  return (
    <div style={{ marginTop: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <h3 style={{ margin: 0, fontSize: "0.95rem", color: "var(--fg, #f0f0f0)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "1.4rem", fontWeight: 700, color: accent ? "#f59e0b" : "var(--fg, #f0f0f0)" }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.2rem" }}>{label}</div>
    </div>
  );
}

function getLast30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

const backBtn = { background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "0.9rem", padding: "0 0 1rem", display: "block" };
const headerCard = { background: "var(--card, #1a1a2e)", border: "1px solid var(--border, #333)", borderRadius: "1rem", padding: "1.5rem", marginTop: "0.5rem" };
const catBadge = { fontSize: "0.78rem", color: "#9ca3af", background: "var(--border, #222)", padding: "0.2rem 0.6rem", borderRadius: 99 };
const statsRow = { display: "flex", gap: "1.5rem", justifyContent: "flex-start", flexWrap: "wrap", marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border, #333)" };
const logBtn = { padding: "0.55rem 1.1rem", borderRadius: "0.5rem", background: "var(--accent, #7c3aed)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", whiteSpace: "nowrap" };
const repeatBtn = { padding: "0.4rem 0.9rem", borderRadius: "0.5rem", background: "none", border: "1px solid var(--border, #444)", color: "#9ca3af", cursor: "pointer", fontSize: "0.82rem", whiteSpace: "nowrap" };
const smallBtn = { background: "none", border: "1px solid var(--border, #444)", color: "#9ca3af", borderRadius: "0.4rem", cursor: "pointer", fontSize: "0.8rem", padding: "0.3rem 0.7rem" };
const saveBtn = { padding: "0.5rem 1rem", borderRadius: "0.4rem", background: "var(--accent, #7c3aed)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 };
const tinyBtn = { background: "none", border: "1px solid var(--border, #444)", color: "#9ca3af", borderRadius: "0.3rem", cursor: "pointer", fontSize: "0.75rem", padding: "0.2rem 0.5rem" };
const sInput = { padding: "0.5rem 0.75rem", borderRadius: "0.4rem", border: "1px solid var(--border, #444)", background: "var(--bg2, #111)", color: "var(--fg, #f0f0f0)", fontSize: "0.88rem", outline: "none", boxSizing: "border-box" };
const empty = { color: "#9ca3af", fontSize: "0.85rem", margin: 0 };
const msCard = { border: "1px solid", borderRadius: "0.6rem", padding: "0.85rem 1rem", marginBottom: "0.6rem", background: "var(--bg2, #0d0d1a)" };
const rewardCard = { border: "1px solid", borderRadius: "0.5rem", padding: "0.75rem 1rem", background: "var(--bg2, #0d0d1a)" };
const actionBtn = { padding: "0.3rem 0.75rem", borderRadius: "0.35rem", background: "#f59e0b22", borderColor: "#f59e0b", border: "1px solid", color: "#f59e0b", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 };
