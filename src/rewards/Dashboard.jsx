import { useEffect } from "react";
import { useGoals } from "./context.jsx";

export default function Dashboard({ onSelectGoal, onNewGoal }) {
  const { goals, rewards, loading, loadGoals } = useGoals();

  useEffect(() => { loadGoals(); }, []);

  const active = goals.filter(g => g.status === "active");
  const today = new Date().toISOString().slice(0, 10);
  const needsLog = active.filter(g => !g.logs?.some(l => l.date === today));
  const totalEarned = rewards.filter(r => ["earned", "claimed", "received"].includes(r.status)).length;

  // Group goals by title — active first within each group
  const groups = Object.values(
    goals.reduce((acc, g) => {
      const key = g.title.trim().toLowerCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(g);
      return acc;
    }, {})
  ).map(group => ({
    key: group[0].title,
    active: group.filter(g => g.status === "active"),
    past: group.filter(g => g.status !== "active"),
  })).sort((a, b) => b.active.length - a.active.length);

  if (loading) return <p style={{ color: "#9ca3af", padding: "1rem" }}>Loading...</p>;

  return (
    <div>
      {/* Summary bar */}
      <div style={summaryRow}>
        <SummaryCard icon="🎯" label="Active goals" value={active.length} />
        <SummaryCard icon="📝" label="Log today" value={needsLog.length} accent={needsLog.length > 0} />
        <SummaryCard icon="⭐" label="Rewards earned" value={totalEarned} />
      </div>

      {/* Pending logs */}
      {needsLog.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={sectionTitle}>Log today</h3>
          <div style={goalGrid}>
            {needsLog.map(g => <GoalCard key={g.id} goal={g} onClick={() => onSelectGoal(g.id)} highlight />)}
          </div>
        </div>
      )}

      {/* All goals grouped by title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <h3 style={{ ...sectionTitle, marginBottom: 0 }}>All goals</h3>
        <button onClick={onNewGoal} style={addBtn}>+ New goal</button>
      </div>

      {goals.length === 0 && (
        <div style={emptyState}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🌱</div>
          <p style={{ color: "var(--fg, #f0f0f0)", fontWeight: 600, margin: "0 0 0.4rem" }}>No goals yet</p>
          <p style={{ color: "#9ca3af", margin: "0 0 1.25rem", fontSize: "0.9rem" }}>Set your first goal and start building streaks.</p>
          <button onClick={onNewGoal} style={addBtn}>+ Create first goal</button>
        </div>
      )}

      <div style={goalGrid}>
        {groups.map(group => (
          <GoalStack key={group.key} group={group} onSelectGoal={onSelectGoal} />
        ))}
      </div>
    </div>
  );
}

function GoalStack({ group, onSelectGoal }) {
  const { active, past } = group;
  const primary = active[0] || past[0];
  const rest = [...active.slice(1), ...past];
  const totalRuns = active.length + past.length;

  return (
    <div style={{ position: "relative" }}>
      {/* Shadow cards underneath for stack effect */}
      {rest.length >= 2 && (
        <div style={{ ...stackShadow, bottom: -8, left: 8, right: 8, opacity: 0.35 }} />
      )}
      {rest.length >= 1 && (
        <div style={{ ...stackShadow, bottom: -4, left: 4, right: 4, opacity: 0.6 }} />
      )}

      {/* Primary (top) card */}
      <GoalCard goal={primary} onClick={() => onSelectGoal(primary.id)} totalRuns={totalRuns} />

      {/* Collapsed past runs */}
      {rest.length > 0 && (
        <div style={pastRuns}>
          {rest.map(g => (
            <button key={g.id} onClick={() => onSelectGoal(g.id)} style={pastRunBtn}>
              {g.status === "completed" ? "✅" : g.status === "active" ? "🔥" : "⏸"} Run {new Date(g.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, onClick, highlight, totalRuns }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayLogged = goal.logs?.some(l => l.date === today && l.didIt);
  const { currentStreak = 0, totalDone = 0 } = goal.streak || {};
  const progress = goal.targetDays ? Math.min(100, Math.round((currentStreak / Number(goal.targetDays)) * 100)) : null;
  const statusColor = goal.status === "completed" ? "#16a34a" : goal.status === "abandoned" ? "#6b7280" : null;

  return (
    <div onClick={onClick} style={{ ...goalCard, borderColor: highlight ? "var(--accent, #7c3aed)55" : statusColor ? statusColor + "55" : "var(--border, #333)", cursor: "pointer", position: "relative" }}>
      {totalRuns > 1 && (
        <span style={runsBadge}>×{totalRuns}</span>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
            {(goal.categories || (goal.category ? [goal.category] : [])).map(c => (
              <span key={c.id} style={catTag}>{c.icon} {c.name}</span>
            ))}
          </div>
          <p style={{ margin: "0.3rem 0 0.5rem", fontWeight: 600, color: "var(--fg, #f0f0f0)", lineHeight: 1.3, fontSize: "0.95rem" }}>{goal.title}</p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "0.75rem" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f59e0b" }}>{currentStreak}</div>
          <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>day streak</div>
        </div>
      </div>
      {progress !== null && (
        <div style={{ height: 5, background: "var(--border, #333)", borderRadius: 3, overflow: "hidden", marginBottom: "0.5rem" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: progress === 100 ? "#16a34a" : "var(--accent, #7c3aed)", borderRadius: 3 }} />
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
          {totalDone} days done{goal.targetDays ? ` / ${goal.targetDays}` : ""}
          {goal.status !== "active" && <span style={{ marginLeft: "0.4rem", color: statusColor || "var(--muted)" }}>· {goal.status}</span>}
        </span>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: todayLogged ? "#4ade80" : highlight ? "#f59e0b" : "#9ca3af" }}>
          {todayLogged ? "✓ done today" : highlight ? "⏳ log today" : ""}
        </span>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, accent }) {
  return (
    <div style={summaryCard}>
      <div style={{ fontSize: "1.5rem" }}>{icon}</div>
      <div style={{ fontSize: "1.6rem", fontWeight: 700, color: accent ? "#f59e0b" : "var(--fg, #f0f0f0)" }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{label}</div>
    </div>
  );
}

const summaryRow = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.75rem" };
const summaryCard = { background: "var(--card, #1a1a2e)", border: "1px solid var(--border, #333)", borderRadius: "0.75rem", padding: "1rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" };
const goalGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" };
const goalCard = { background: "var(--card, #1a1a2e)", border: "1px solid", borderRadius: "0.75rem", padding: "1rem", transition: "border-color 0.15s" };
const stackShadow = { position: "absolute", background: "var(--card, #1a1a2e)", border: "1px solid var(--border, #333)", borderRadius: "0.75rem", height: "100%" };
const runsBadge = { position: "absolute", top: "0.5rem", right: "0.5rem", fontSize: "0.7rem", background: "var(--border, #333)", color: "#9ca3af", padding: "0.1rem 0.45rem", borderRadius: 99 };
const pastRuns = { display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.4rem", paddingLeft: "0.25rem" };
const pastRunBtn = { background: "none", border: "1px solid var(--border, #333)", color: "#9ca3af", borderRadius: "0.4rem", cursor: "pointer", fontSize: "0.72rem", padding: "0.2rem 0.55rem" };
const catTag = { fontSize: "0.72rem", color: "#9ca3af", background: "var(--border, #222)", padding: "0.15rem 0.5rem", borderRadius: 99 };
const sectionTitle = { fontSize: "0.85rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 0.75rem", fontWeight: 700 };
const addBtn = { padding: "0.5rem 1.1rem", borderRadius: "0.5rem", background: "var(--accent, #7c3aed)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600 };
const emptyState = { border: "1px dashed var(--border, #444)", borderRadius: "1rem", padding: "2.5rem", textAlign: "center", marginTop: "0.5rem" };
