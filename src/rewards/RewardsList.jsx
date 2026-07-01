import { useState } from "react";
import { useGoals } from "./context.jsx";
import RewardForm from "./RewardForm.jsx";

const STATUS_COLOR = { locked: "#6b7280", earned: "#f59e0b", claimed: "#3b82f6", received: "#16a34a" };
const STATUS_LABEL = { locked: "🔒 Locked", earned: "⭐ Earned", claimed: "📦 Claimed", received: "✅ Received" };

export default function RewardsList() {
  const { rewards, goals, claimReward, receiveReward, deleteReward, linkReward, unlinkReward, loadGoals } = useGoals();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [linkingId, setLinkingId] = useState(null);
  const [linkGoalId, setLinkGoalId] = useState("");
  const [filter, setFilter] = useState("all"); // all | locked | earned | claimed | received

  const filtered = filter === "all" ? rewards : rewards.filter(r => r.status === filter);

  async function handleClaim(id) {
    await claimReward(id);
  }

  async function handleReceive(id) {
    await receiveReward(id);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this reward?")) return;
    await deleteReward(id);
  }

  async function handleLink(rewardId) {
    if (!linkGoalId) return;
    await linkReward(rewardId, { goalId: linkGoalId });
    setLinkingId(null);
    setLinkGoalId("");
  }

  async function handleUnlink(rewardId, goalId) {
    await unlinkReward(rewardId, { goalId });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {["all", "locked", "earned", "claimed", "received"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ ...filterBtn, ...(filter === f ? filterActive : {}) }}>
              {f === "all" ? `All (${rewards.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} style={addBtn}>+ New reward</button>
      </div>

      {filtered.length === 0 && (
        <div style={emptyState}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎁</div>
          <p style={{ color: "var(--fg, #f0f0f0)", fontWeight: 600, margin: "0 0 0.4rem" }}>No rewards yet</p>
          <p style={{ color: "var(--muted, #888)", margin: "0 0 1.25rem", fontSize: "0.9rem" }}>
            Add things you want to gift yourself when you hit your goals.
          </p>
          <button onClick={() => setShowForm(true)} style={addBtn}>+ Add first reward</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {filtered.map(reward => (
          <div key={reward.id} style={{ ...rewardCard, borderLeftColor: STATUS_COLOR[reward.status] }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, color: "var(--fg, #f0f0f0)", fontSize: "1rem" }}>{reward.title}</span>
                  {reward.costValue && (
                    <span style={costBadge}>₹{reward.costValue}</span>
                  )}
                  <span style={{ fontSize: "0.75rem", color: STATUS_COLOR[reward.status] }}>
                    {STATUS_LABEL[reward.status]}
                  </span>
                </div>
                {reward.description && (
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--muted, #888)" }}>{reward.description}</p>
                )}

                {/* Linked goals */}
                {reward.linkedGoals?.length > 0 && (
                  <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {reward.linkedGoals.map(g => (
                      <span key={g.id} style={linkedTag}>
                        🎯 {g.title}
                        <button onClick={() => handleUnlink(reward.id, g.id)} style={unlinkBtn} title="Unlink">✕</button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Link to goal */}
                {linkingId === reward.id ? (
                  <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
                    <select style={smallSelect} value={linkGoalId} onChange={e => setLinkGoalId(e.target.value)}>
                      <option value="">Pick a goal...</option>
                      {goals.filter(g => g.status === "active" && !reward.linkedGoals?.some(lg => lg.id === g.id)).map(g => (
                        <option key={g.id} value={g.id}>{g.title}</option>
                      ))}
                    </select>
                    <button onClick={() => handleLink(reward.id)} disabled={!linkGoalId} style={smallSaveBtn}>Link</button>
                    <button onClick={() => { setLinkingId(null); setLinkGoalId(""); }} style={smallCancelBtn}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setLinkingId(reward.id)} style={linkGoalBtn}>+ Link to goal</button>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexShrink: 0 }}>
                {reward.status === "earned" && (
                  <button onClick={() => handleClaim(reward.id)} style={actionBtn("#f59e0b")}>Claim</button>
                )}
                {reward.status === "claimed" && (
                  <button onClick={() => handleReceive(reward.id)} style={actionBtn("#16a34a")}>Received</button>
                )}
                <button onClick={() => { setEditing(reward); setShowForm(true); }} style={iconBtn} title="Edit">✏️</button>
                <button onClick={() => handleDelete(reward.id)} style={iconBtn} title="Delete">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <RewardForm
          existing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); loadGoals(); }}
        />
      )}
    </div>
  );
}

const addBtn = { padding: "0.5rem 1.1rem", borderRadius: "0.5rem", background: "var(--accent, #7c3aed)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600 };
const filterBtn = { padding: "0.35rem 0.75rem", borderRadius: 99, border: "1px solid var(--border, #444)", background: "none", color: "var(--muted, #888)", cursor: "pointer", fontSize: "0.8rem" };
const filterActive = { background: "var(--accent, #7c3aed)22", borderColor: "var(--accent, #7c3aed)", color: "var(--accent, #7c3aed)" };
const emptyState = { border: "1px dashed var(--border, #444)", borderRadius: "1rem", padding: "2.5rem", textAlign: "center" };
const rewardCard = { background: "var(--card, #1a1a2e)", border: "1px solid var(--border, #333)", borderLeft: "3px solid", borderRadius: "0.75rem", padding: "1rem 1.1rem" };
const costBadge = { fontSize: "0.75rem", background: "var(--border, #222)", color: "var(--muted, #aaa)", padding: "0.15rem 0.5rem", borderRadius: 99 };
const linkedTag = { display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", background: "var(--border, #222)", color: "var(--muted, #aaa)", padding: "0.15rem 0.5rem 0.15rem 0.6rem", borderRadius: 99 };
const unlinkBtn = { background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.65rem", padding: 0, lineHeight: 1 };
const linkGoalBtn = { background: "none", border: "none", color: "var(--accent, #7c3aed)", cursor: "pointer", fontSize: "0.78rem", padding: "0.3rem 0 0", display: "block" };
const smallSelect = { padding: "0.4rem 0.6rem", borderRadius: "0.4rem", border: "1px solid var(--border, #444)", background: "var(--bg2, #111)", color: "var(--fg, #f0f0f0)", fontSize: "0.83rem", outline: "none" };
const smallSaveBtn = { padding: "0.35rem 0.8rem", borderRadius: "0.4rem", background: "var(--accent, #7c3aed)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.83rem", fontWeight: 600 };
const smallCancelBtn = { padding: "0.35rem 0.8rem", borderRadius: "0.4rem", border: "1px solid var(--border, #444)", background: "none", color: "var(--muted, #888)", cursor: "pointer", fontSize: "0.83rem" };
const iconBtn = { background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", padding: "0.2rem" };
function actionBtn(color) {
  return { padding: "0.3rem 0.75rem", borderRadius: "0.35rem", background: color + "22", border: `1px solid ${color}`, color, cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 };
}
