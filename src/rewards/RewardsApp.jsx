import { useState } from "react";
import { AuthProvider, GoalsProvider, useAuth } from "./context.jsx";
import AuthGate from "./AuthGate.jsx";
import Dashboard from "./Dashboard.jsx";
import GoalDetail from "./GoalDetail.jsx";
import GoalForm from "./GoalForm.jsx";
import RewardsList from "./RewardsList.jsx";

function RewardsInner() {
  const { verified, loading, logout } = useAuth();
  const [tab, setTab] = useState("goals");       // "goals" | "rewards"
  const [view, setView] = useState("dashboard"); // "dashboard" | "detail"
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [showNewGoal, setShowNewGoal] = useState(false);

  if (loading) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted, #888)" }}>Loading...</div>;
  }

  if (!verified) return <AuthGate />;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Top bar */}
      <div style={topBar}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.4rem", color: "var(--fg, #f0f0f0)" }}>🏆 Reward Goals</h1>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "var(--muted, #888)" }}>Build streaks. Earn rewards. Stay consistent.</p>
        </div>
        <button onClick={logout} style={lockBtn} title="Lock">🔒</button>
      </div>

      <GoalsProvider>
        {/* Tab bar — only show on top-level views, not inside goal detail */}
        {view !== "detail" && (
          <div style={tabBar}>
            <button onClick={() => setTab("goals")} style={{ ...tabBtn, ...(tab === "goals" ? tabActive : {}) }}>
              🎯 Goals
            </button>
            <button onClick={() => setTab("rewards")} style={{ ...tabBtn, ...(tab === "rewards" ? tabActive : {}) }}>
              🎁 Rewards
            </button>
          </div>
        )}

        {tab === "goals" && view === "dashboard" && (
          <Dashboard
            onSelectGoal={(id) => { setSelectedGoalId(id); setView("detail"); }}
            onNewGoal={() => setShowNewGoal(true)}
          />
        )}

        {tab === "goals" && view === "detail" && selectedGoalId && (
          <GoalDetail
            goalId={selectedGoalId}
            onBack={() => { setView("dashboard"); setSelectedGoalId(null); }}
          />
        )}

        {tab === "rewards" && <RewardsList />}

        {showNewGoal && (
          <GoalForm onClose={() => setShowNewGoal(false)} onSaved={() => setShowNewGoal(false)} />
        )}
      </GoalsProvider>
    </div>
  );
}

export default function RewardsApp() {
  return (
    <AuthProvider>
      <RewardsInner />
    </AuthProvider>
  );
}

const topBar = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid var(--border, #333)" };
const lockBtn = { background: "none", border: "1px solid var(--border, #444)", borderRadius: "0.4rem", cursor: "pointer", fontSize: "1rem", padding: "0.35rem 0.6rem", color: "var(--muted, #888)" };
const tabBar = { display: "flex", gap: "0.4rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border, #333)", paddingBottom: "0" };
const tabBtn = { padding: "0.55rem 1.25rem", borderRadius: "0.5rem 0.5rem 0 0", border: "none", background: "none", color: "var(--muted, #888)", cursor: "pointer", fontSize: "0.95rem", fontWeight: 500, marginBottom: "-1px", borderBottom: "2px solid transparent" };
const tabActive = { color: "var(--fg, #f0f0f0)", borderBottom: "2px solid var(--accent, #7c3aed)", fontWeight: 700 };
