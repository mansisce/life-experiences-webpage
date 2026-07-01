import { useState } from "react";
import { useGoals } from "./context.jsx";

export default function GoalForm({ onClose, onSaved }) {
  const { categories, createGoal } = useGoals();
  const [form, setForm] = useState({
    title: "", description: "", type: "fixed",
    targetDays: "", categoryId: "", breakResetDays: 1, startDate: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (form.type === "fixed" && !form.targetDays) { setError("Target days required for fixed goals."); return; }
    setSaving(true);
    try {
      await createGoal({ ...form, targetDays: form.targetDays ? Number(form.targetDays) : undefined });
      onSaved?.();
      onClose?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={overlay}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, color: "var(--fg, #f0f0f0)" }}>New goal</h3>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={field}>
            <label style={label}>Goal title *</label>
            <input style={input} value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Yoga every day for 30 days" autoFocus />
          </div>
          <div style={field}>
            <label style={label}>Description</label>
            <textarea style={{ ...input, minHeight: 70, resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Why this goal matters to you..." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={field}>
              <label style={label}>Goal type</label>
              <select style={input} value={form.type} onChange={e => set("type", e.target.value)}>
                <option value="fixed">Fixed (target days)</option>
                <option value="open">Open-ended</option>
              </select>
            </div>
            {form.type === "fixed" && (
              <div style={field}>
                <label style={label}>Target days *</label>
                <input style={input} type="number" min="1" value={form.targetDays} onChange={e => set("targetDays", e.target.value)} placeholder="30" />
              </div>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={field}>
              <label style={label}>Category</label>
              <select style={input} value={form.categoryId} onChange={e => set("categoryId", e.target.value)}>
                <option value="">No category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div style={field}>
              <label style={label}>Start date</label>
              <input style={input} type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} />
            </div>
          </div>
          <div style={field}>
            <label style={label}>Break reset after how many missed days?</label>
            <input style={{ ...input, maxWidth: 120 }} type="number" min="1" max="30" value={form.breakResetDays} onChange={e => set("breakResetDays", Number(e.target.value))} />
            <span style={{ fontSize: "0.8rem", color: "var(--muted, #888)", marginTop: "0.25rem" }}>Missing {form.breakResetDays} day{form.breakResetDays > 1 ? "s" : ""} in a row resets streak.</span>
          </div>
          {error && <p style={{ color: "#f87171", margin: 0, fontSize: "0.85rem" }}>{error}</p>}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={saving} style={saveBtn}>{saving ? "Saving..." : "Create goal"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" };
const card = { background: "var(--card, #1a1a2e)", border: "1px solid var(--border, #333)", borderRadius: "1rem", padding: "2rem", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" };
const field = { display: "flex", flexDirection: "column", gap: "0.35rem" };
const label = { fontSize: "0.82rem", color: "var(--muted, #888)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" };
const input = { padding: "0.6rem 0.85rem", borderRadius: "0.5rem", border: "1px solid var(--border, #444)", background: "var(--bg2, #111)", color: "var(--fg, #f0f0f0)", fontSize: "0.95rem", outline: "none", width: "100%", boxSizing: "border-box" };
const closeBtn = { background: "none", border: "none", color: "var(--muted, #888)", fontSize: "1.2rem", cursor: "pointer", padding: "0.25rem" };
const cancelBtn = { padding: "0.6rem 1.25rem", borderRadius: "0.5rem", border: "1px solid var(--border, #444)", background: "none", color: "var(--fg, #f0f0f0)", cursor: "pointer", fontSize: "0.95rem" };
const saveBtn = { padding: "0.6rem 1.5rem", borderRadius: "0.5rem", background: "var(--accent, #7c3aed)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.95rem", fontWeight: 600 };
