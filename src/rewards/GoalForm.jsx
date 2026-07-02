import { useState } from "react";
import { useGoals } from "./context.jsx";

export default function GoalForm({ onClose, onSaved }) {
  const { categories, createGoal, addCategory } = useGoals();
  const [form, setForm] = useState({
    title: "", description: "", type: "fixed",
    targetDays: "", categoryIds: [], breakResetDays: 1, startDate: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", icon: "⭐" });
  const [addingCat, setAddingCat] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function toggleCategory(id) {
    setForm(f => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter(c => c !== id)
        : [...f.categoryIds, id],
    }));
  }

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

          {/* Multi-select categories */}
          <div style={field}>
            <label style={label}>Categories</label>
            <div style={catGrid}>
              {categories.map(c => {
                const selected = form.categoryIds.includes(c.id);
                return (
                  <button key={c.id} type="button" onClick={() => toggleCategory(c.id)}
                    style={{ ...catChip, ...(selected ? catChipOn : {}) }}>
                    {c.icon} {c.name}
                    {selected && <span style={{ marginLeft: "0.3rem", fontSize: "0.7rem" }}>✓</span>}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => setShowNewCat(v => !v)} style={addCatBtn}>
              {showNewCat ? "Cancel" : "+ Add custom category"}
            </button>
            {showNewCat && (
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                <input style={{ ...input, flex: "0 0 52px", textAlign: "center", fontSize: "1.2rem", padding: "0.4rem" }}
                  placeholder="🏷️" value={newCat.icon} maxLength={2}
                  onChange={e => setNewCat(f => ({ ...f, icon: e.target.value }))} />
                <input style={{ ...input, flex: 1, minWidth: 120 }}
                  placeholder="Category name" value={newCat.name}
                  onChange={e => setNewCat(f => ({ ...f, name: e.target.value }))} />
                <button type="button" disabled={addingCat || !newCat.name.trim()} style={saveCatBtn}
                  onClick={async () => {
                    setAddingCat(true);
                    await addCategory({ name: newCat.name.trim(), icon: newCat.icon || "⭐" });
                    setNewCat({ name: "", icon: "⭐" });
                    setShowNewCat(false);
                    setAddingCat(false);
                  }}>
                  {addingCat ? "..." : "Save"}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={field}>
              <label style={label}>Start date</label>
              <input style={input} type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} />
            </div>
            <div style={field}>
              <label style={label}>Break reset (missed days)</label>
              <input style={input} type="number" min="1" max="30" value={form.breakResetDays} onChange={e => set("breakResetDays", Number(e.target.value))} />
            </div>
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
const catGrid = { display: "flex", flexWrap: "wrap", gap: "0.4rem" };
const catChip = { padding: "0.35rem 0.75rem", borderRadius: 99, border: "1px solid var(--border, #444)", background: "none", color: "var(--muted, #888)", cursor: "pointer", fontSize: "0.82rem" };
const catChipOn = { background: "var(--accent, #7c3aed)22", borderColor: "var(--accent, #7c3aed)", color: "var(--accent, #d8b4fe)" };
const closeBtn = { background: "none", border: "none", color: "var(--muted, #888)", fontSize: "1.2rem", cursor: "pointer", padding: "0.25rem" };
const cancelBtn = { padding: "0.6rem 1.25rem", borderRadius: "0.5rem", border: "1px solid var(--border, #444)", background: "none", color: "var(--fg, #f0f0f0)", cursor: "pointer", fontSize: "0.95rem" };
const saveBtn = { padding: "0.6rem 1.5rem", borderRadius: "0.5rem", background: "var(--accent, #7c3aed)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.95rem", fontWeight: 600 };
const addCatBtn = { background: "none", border: "none", color: "var(--accent, #7c3aed)", cursor: "pointer", fontSize: "0.8rem", padding: "0.2rem 0", textAlign: "left", marginTop: "0.25rem" };
const saveCatBtn = { padding: "0.45rem 0.9rem", borderRadius: "0.4rem", background: "var(--accent, #7c3aed)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 };
