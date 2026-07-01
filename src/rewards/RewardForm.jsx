import { useState } from "react";
import { useGoals } from "./context.jsx";

export default function RewardForm({ existing, onClose, onSaved }) {
  const { categories, createReward, updateReward } = useGoals();
  const [form, setForm] = useState({
    title: existing?.title || "",
    description: existing?.description || "",
    costValue: existing?.costValue || "",
    categoryId: existing?.categoryId || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    try {
      if (existing) {
        await updateReward(existing.id, { ...form, costValue: form.costValue ? Number(form.costValue) : null });
      } else {
        await createReward({ ...form, costValue: form.costValue ? Number(form.costValue) : null });
      }
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
          <h3 style={{ margin: 0, color: "var(--fg, #f0f0f0)" }}>{existing ? "Edit reward" : "New reward"}</h3>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={field}>
            <label style={lbl}>Reward title *</label>
            <input style={inp} value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="e.g. New yoga outfit" autoFocus />
          </div>
          <div style={field}>
            <label style={lbl}>Description</label>
            <textarea style={{ ...inp, minHeight: 60, resize: "vertical" }}
              value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="What exactly is this reward? Where will you get it?" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={field}>
              <label style={lbl}>Cost / value (₹)</label>
              <input style={inp} type="number" min="0" value={form.costValue}
                onChange={e => set("costValue", e.target.value)} placeholder="2000" />
            </div>
            <div style={field}>
              <label style={lbl}>Category</label>
              <select style={inp} value={form.categoryId} onChange={e => set("categoryId", e.target.value)}>
                <option value="">No category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p style={{ color: "#f87171", margin: 0, fontSize: "0.85rem" }}>{error}</p>}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={saving} style={saveBtn}>
              {saving ? "Saving..." : existing ? "Save changes" : "Add reward"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" };
const card = { background: "var(--card, #1a1a2e)", border: "1px solid var(--border, #333)", borderRadius: "1rem", padding: "2rem", width: "100%", maxWidth: 480 };
const field = { display: "flex", flexDirection: "column", gap: "0.35rem" };
const lbl = { fontSize: "0.82rem", color: "var(--muted, #888)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" };
const inp = { padding: "0.6rem 0.85rem", borderRadius: "0.5rem", border: "1px solid var(--border, #444)", background: "var(--bg2, #111)", color: "var(--fg, #f0f0f0)", fontSize: "0.95rem", outline: "none", width: "100%", boxSizing: "border-box" };
const closeBtn = { background: "none", border: "none", color: "var(--muted, #888)", fontSize: "1.2rem", cursor: "pointer" };
const cancelBtn = { padding: "0.6rem 1.25rem", borderRadius: "0.5rem", border: "1px solid var(--border, #444)", background: "none", color: "var(--fg, #f0f0f0)", cursor: "pointer", fontSize: "0.95rem" };
const saveBtn = { padding: "0.6rem 1.5rem", borderRadius: "0.5rem", background: "var(--accent, #7c3aed)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.95rem", fontWeight: 600 };
