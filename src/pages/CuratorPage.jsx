import { useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { API_BASE } from "../utils/weekendPicksApi";

// ─── Curator Page ──────────────────────────────────────────────────────────────

const PIN = "1234";

export default function CuratorPage() {
  const [unlocked, setUnlocked] = useLocalStorage("curator_unlocked", false);
  const [pin, setPin] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("all"); // all | pending | approved | skipped | starred
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (!unlocked) return;
    setLoading(true);
    fetch(`${API_BASE}/events/curate`)
      .then(r => r.json())
      .then(d => {
        const all = [
          ...(d.catalogue || []).map(e => ({ ...e, _type: "catalogue" })),
          ...(d.igEvents || []).map(e => ({ ...e, _type: "instagram", id: e.id || `ig-${e.name?.slice(0,20).replace(/\s+/g,"-")}` })),
        ];
        setEvents(all);
        setLoading(false);
      })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, [unlocked]);

  async function saveCuration(id, patch, igEvent) {
    setSaving(id);
    const ev = events.find(e => e.id === id);
    const merged = { ...(ev?._curation || {}), ...patch };
    const body = { ...merged };
    if (igEvent) body._igEvent = igEvent;
    try {
      await fetch(`${API_BASE}/events/curate/${encodeURIComponent(id)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
      });
      setEvents(prev => prev.map(e => e.id === id ? { ...e, _curation: merged } : e));
    } catch (e) { alert("Save failed: " + e.message); }
    setSaving(null);
  }

  function startEdit(ev) {
    const fixes = ev._curation?.fixes || {};
    setEditDraft({
      note: ev._curation?.note || "",
      date: fixes.date || ev.date || "",
      time: fixes.time || ev.time || "",
      venue: fixes.venue || ev.venue || "",
      price: fixes.price || ev.cost || ev.price || "",
    });
    setEditingId(ev.id);
  }

  function commitEdit(ev) {
    const { note, ...fixFields } = editDraft;
    const fixes = {};
    if (fixFields.date && fixFields.date !== ev.date) fixes.date = fixFields.date;
    if (fixFields.time && fixFields.time !== ev.time) fixes.time = fixFields.time;
    if (fixFields.venue && fixFields.venue !== ev.venue) fixes.venue = fixFields.venue;
    if (fixFields.price && fixFields.price !== (ev.cost || ev.price)) fixes.price = fixFields.price;
    saveCuration(ev.id, { note, fixes }, ev._type === "instagram" ? ev : null);
    setEditingId(null);
  }

  const filtered = useMemo(() => {
    return events.filter(e => {
      const s = e._curation?.status;
      const starred = e._curation?.starred;
      if (filter === "pending") return !s;
      if (filter === "approved") return s === "approved";
      if (filter === "skipped") return s === "skipped";
      if (filter === "starred") return starred;
      return true;
    });
  }, [events, filter]);

  const counts = useMemo(() => ({
    all: events.length,
    pending: events.filter(e => !e._curation?.status).length,
    approved: events.filter(e => e._curation?.status === "approved").length,
    skipped: events.filter(e => e._curation?.status === "skipped").length,
    starred: events.filter(e => e._curation?.starred).length,
  }), [events]);

  if (!unlocked) return (
    <main style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>🔒 Curator</p>
        <input type="password" placeholder="PIN" value={pin} onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (pin === PIN ? setUnlocked(true) : setPin(""))}
          style={{ padding: "10px 16px", borderRadius: 8, border: "1.5px solid var(--line)", fontSize: "1rem", textAlign: "center", width: 140 }} />
        <button onClick={() => pin === PIN ? setUnlocked(true) : setPin("")}
          style={{ padding: "10px 20px", background: "var(--leaf)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
          Unlock
        </button>
      </div>
    </main>
  );

  const chipStyle = (active) => ({
    padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
    border: `1.5px solid ${active ? "var(--leaf)" : "var(--line)"}`,
    background: active ? "var(--leaf)" : "var(--white)", color: active ? "#fff" : "var(--ink)",
  });

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Weekend Picks</p>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0 }}>Event Curator</h1>
        </div>
        <button onClick={() => setUnlocked(false)} style={{ fontSize: "0.75rem", color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}>Lock →</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {[
          { key: "all", label: `All (${counts.all})` },
          { key: "pending", label: `Pending (${counts.pending})` },
          { key: "approved", label: `✓ Approved (${counts.approved})` },
          { key: "skipped", label: `✗ Skipped (${counts.skipped})` },
          { key: "starred", label: `★ Starred (${counts.starred})` },
        ].map(({ key, label }) => (
          <button key={key} style={chipStyle(filter === key)} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>

      {loading && <p style={{ color: "var(--muted)" }}>Loading events…</p>}
      {err && <p style={{ color: "var(--danger)" }}>Error: {err}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(ev => {
          const cur = ev._curation || {};
          const isApproved = cur.status === "approved";
          const isSkipped = cur.status === "skipped";
          const isStarred = cur.starred;
          const isEditing = editingId === ev.id;
          const isSaving = saving === ev.id;
          const fixes = cur.fixes || {};
          const displayDate = fixes.date || ev.date || "";
          const displayTime = fixes.time || ev.time || "";
          const displayVenue = fixes.venue || ev.venue || "";
          const displayPrice = fixes.price || ev.cost || ev.price || "";

          const borderColor = isApproved ? "#16a34a" : isSkipped ? "#dc2626" : "var(--line)";
          const bgColor = isApproved ? "#f0fdf4" : isSkipped ? "#fff5f5" : "var(--white)";

          return (
            <div key={ev.id} style={{ border: `1.5px solid ${borderColor}`, borderRadius: 12, padding: "14px 16px", background: bgColor, transition: "all 0.15s" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                {/* Status buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 36 }}>
                  <button onClick={() => saveCuration(ev.id, { status: isApproved ? null : "approved", starred: cur.starred || false }, ev._type === "instagram" ? ev : null)}
                    title="Approve" disabled={isSaving}
                    style={{ width: 32, height: 32, borderRadius: 8, border: `2px solid ${isApproved ? "#16a34a" : "var(--line)"}`, background: isApproved ? "#16a34a" : "transparent", color: isApproved ? "#fff" : "var(--muted)", fontSize: "0.9rem", cursor: "pointer", fontWeight: 700 }}>
                    ✓
                  </button>
                  <button onClick={() => saveCuration(ev.id, { status: isSkipped ? null : "skipped", starred: cur.starred || false }, ev._type === "instagram" ? ev : null)}
                    title="Skip" disabled={isSaving}
                    style={{ width: 32, height: 32, borderRadius: 8, border: `2px solid ${isSkipped ? "#dc2626" : "var(--line)"}`, background: isSkipped ? "#dc2626" : "transparent", color: isSkipped ? "#fff" : "var(--muted)", fontSize: "0.9rem", cursor: "pointer", fontWeight: 700 }}>
                    ✗
                  </button>
                </div>

                {/* Event info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{ev.name}</span>
                    {isStarred && <span style={{ color: "#f59e0b", fontSize: "0.9rem" }}>★</span>}
                    <span style={{ fontSize: "0.68rem", padding: "1px 7px", borderRadius: 10, background: ev._type === "instagram" ? "#fce7f3" : "var(--band)", color: ev._type === "instagram" ? "#9d174d" : "var(--muted)", fontWeight: 600 }}>
                      {ev.source || ev._type}
                    </span>
                    {Object.keys(fixes).length > 0 && <span style={{ fontSize: "0.68rem", color: "#92400e", background: "#fef3c7", padding: "1px 7px", borderRadius: 10, fontWeight: 600 }}>edited</span>}
                  </div>

                  <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {displayDate && <span>📅 {displayDate}{displayTime ? ` · ${displayTime}` : ""}</span>}
                    {displayVenue && <span>📍 {displayVenue}</span>}
                    {displayPrice && <span>💰 {displayPrice}</span>}
                  </div>

                  {cur.note && !isEditing && (
                    <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#92400e", background: "#fef3c7", padding: "3px 8px", borderRadius: 6, display: "inline-block" }}>
                      📝 {cur.note}
                    </p>
                  )}

                  {isEditing && (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[
                          { key: "date", label: "Date", placeholder: "2026-06-28" },
                          { key: "time", label: "Time", placeholder: "10:00 AM" },
                          { key: "venue", label: "Venue", placeholder: "Koramangala, Bangalore" },
                          { key: "price", label: "Price", placeholder: "₹500" },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key}>
                            <label style={{ fontSize: "0.68rem", color: "var(--muted)", display: "block", marginBottom: 2 }}>{label}</label>
                            <input value={editDraft[key] || ""} onChange={e => setEditDraft(d => ({ ...d, [key]: e.target.value }))}
                              placeholder={placeholder}
                              style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: "1.5px solid var(--line)", fontSize: "0.8rem", boxSizing: "border-box" }} />
                          </div>
                        ))}
                      </div>
                      <div>
                        <label style={{ fontSize: "0.68rem", color: "var(--muted)", display: "block", marginBottom: 2 }}>Note</label>
                        <input value={editDraft.note || ""} onChange={e => setEditDraft(d => ({ ...d, note: e.target.value }))}
                          placeholder="e.g. outdoor, bring sunscreen · sold out as of Jun 25"
                          style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: "1.5px solid var(--line)", fontSize: "0.8rem", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => commitEdit(ev)} style={{ padding: "5px 14px", background: "var(--leaf)", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>Save</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: "5px 14px", background: "var(--band)", color: "var(--ink)", border: "none", borderRadius: 6, fontSize: "0.8rem", cursor: "pointer" }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right actions */}
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  <button onClick={() => saveCuration(ev.id, { status: cur.status || null, starred: !isStarred }, ev._type === "instagram" ? ev : null)}
                    title="Star" disabled={isSaving}
                    style={{ width: 32, height: 32, borderRadius: 8, border: `2px solid ${isStarred ? "#f59e0b" : "var(--line)"}`, background: isStarred ? "#fef9c3" : "transparent", color: isStarred ? "#f59e0b" : "var(--muted)", fontSize: "0.9rem", cursor: "pointer" }}>
                    ★
                  </button>
                  <button onClick={() => isEditing ? setEditingId(null) : startEdit(ev)}
                    title="Edit / add note" disabled={isSaving}
                    style={{ width: 32, height: 32, borderRadius: 8, border: `2px solid ${isEditing ? "var(--leaf)" : "var(--line)"}`, background: isEditing ? "var(--leaf)" : "transparent", color: isEditing ? "#fff" : "var(--muted)", fontSize: "0.85rem", cursor: "pointer" }}>
                    ✏
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <p style={{ textAlign: "center", color: "var(--muted)", marginTop: 48 }}>No events in this bucket.</p>
      )}
    </main>
  );
}
