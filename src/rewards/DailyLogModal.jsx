import { useState } from "react";
import { useGoals } from "./context.jsx";

export default function DailyLogModal({ goal, onClose }) {
  const { logDay } = useGoals();
  const today = new Date().toISOString().slice(0, 10);
  const todayLog = goal.logs?.find(l => l.date === today);

  const [form, setForm] = useState({
    didIt: todayLog ? todayLog.didIt : true,
    note: todayLog?.note || "",
    durationMinutes: todayLog?.durationMinutes || "",
    timeOfDay: todayLog?.timeOfDay || "",
    date: today,
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const r = await logDay(goal.id, { ...form, durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null });
    setResult(r);
    setDone(true);
    setSaving(false);
  }

  if (done) {
    return (
      <div style={overlay}>
        <div style={{ ...card, textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{form.didIt ? "🔥" : "💤"}</div>
          <h3 style={{ color: "var(--fg, #f0f0f0)", margin: "0 0 0.5rem" }}>
            {form.didIt ? "Logged!" : "Rest day logged"}
          </h3>
          {form.didIt && result?.streak != null && (
            <p style={{ color: "var(--muted, #999)", margin: "0 0 1.5rem" }}>
              Current streak: <strong style={{ color: "#f59e0b" }}>{result.streak} day{result.streak !== 1 ? "s" : ""}</strong>
            </p>
          )}
          <button onClick={onClose} style={saveBtn}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlay}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ margin: 0, color: "var(--fg, #f0f0f0)", fontSize: "1.1rem" }}>Log today</h3>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "var(--muted, #888)" }}>{goal.title}</p>
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={toggleRow}>
            <button
              type="button"
              onClick={() => set("didIt", true)}
              style={{ ...toggleBtn, ...(form.didIt ? toggleActive : {}) }}
            >
              ✓ Did it
            </button>
            <button
              type="button"
              onClick={() => set("didIt", false)}
              style={{ ...toggleBtn, ...(!form.didIt ? toggleMissed : {}) }}
            >
              ✕ Missed
            </button>
          </div>
          <div style={field}>
            <label style={lbl}>Note (optional)</label>
            <textarea style={{ ...inp, minHeight: 60, resize: "vertical" }} value={form.note} onChange={e => set("note", e.target.value)} placeholder="How did it go?" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={field}>
              <label style={lbl}>Duration (minutes)</label>
              <input style={inp} type="number" min="1" value={form.durationMinutes} onChange={e => set("durationMinutes", e.target.value)} placeholder="45" />
            </div>
            <div style={field}>
              <label style={lbl}>Time of day</label>
              <input style={inp} type="time" value={form.timeOfDay} onChange={e => set("timeOfDay", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={saving} style={saveBtn}>{saving ? "Saving..." : "Save log"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" };
const card = { background: "var(--card, #1a1a2e)", border: "1px solid var(--border, #333)", borderRadius: "1rem", padding: "1.75rem", width: "100%", maxWidth: 440 };
const field = { display: "flex", flexDirection: "column", gap: "0.3rem" };
const lbl = { fontSize: "0.8rem", color: "var(--muted, #888)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" };
const inp = { padding: "0.6rem 0.85rem", borderRadius: "0.5rem", border: "1px solid var(--border, #444)", background: "var(--bg2, #111)", color: "var(--fg, #f0f0f0)", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box" };
const toggleRow = { display: "flex", gap: "0.75rem" };
const toggleBtn = { flex: 1, padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border, #444)", background: "none", color: "var(--muted, #888)", cursor: "pointer", fontSize: "0.95rem", fontWeight: 600, transition: "all 0.15s" };
const toggleActive = { background: "#16a34a22", borderColor: "#16a34a", color: "#4ade80" };
const toggleMissed = { background: "#dc262622", borderColor: "#dc2626", color: "#f87171" };
const closeBtn = { background: "none", border: "none", color: "var(--muted, #888)", fontSize: "1.2rem", cursor: "pointer" };
const cancelBtn = { padding: "0.6rem 1.25rem", borderRadius: "0.5rem", border: "1px solid var(--border, #444)", background: "none", color: "var(--fg, #f0f0f0)", cursor: "pointer", fontSize: "0.9rem" };
const saveBtn = { padding: "0.6rem 1.5rem", borderRadius: "0.5rem", background: "var(--accent, #7c3aed)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 };
