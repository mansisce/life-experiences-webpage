import { useState } from "react";
import { useAuth } from "./context.jsx";

export default function AuthGate() {
  const { isNewUser, error, setup, verify } = useAuth();
  const [passcode, setPasscode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");
    if (isNewUser) {
      if (passcode.length < 4) { setLocalError("Passcode must be at least 4 characters."); return; }
      if (passcode !== confirm) { setLocalError("Passcodes do not match."); return; }
    }
    setSubmitting(true);
    const fn = isNewUser ? setup : verify;
    await fn(passcode);
    setSubmitting(false);
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.icon}>🔐</div>
        <h2 style={styles.title}>{isNewUser ? "Set up your passcode" : "Enter passcode"}</h2>
        <p style={styles.sub}>
          {isNewUser
            ? "This protects your reward goals. Choose a passcode only you know."
            : "Your reward goals are private. Enter your passcode to continue."}
        </p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            placeholder="Passcode"
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            style={styles.input}
            autoFocus
          />
          {isNewUser && (
            <input
              type="password"
              placeholder="Confirm passcode"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={styles.input}
            />
          )}
          {(localError || error) && <p style={styles.error}>{localError || error}</p>}
          <button type="submit" disabled={submitting} style={styles.btn}>
            {submitting ? "..." : isNewUser ? "Create passcode" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" },
  card: { background: "var(--card, #1a1a2e)", border: "1px solid var(--border, #333)", borderRadius: "1rem", padding: "2.5rem", maxWidth: 380, width: "100%", textAlign: "center" },
  icon: { fontSize: "2.5rem", marginBottom: "1rem" },
  title: { margin: "0 0 0.5rem", fontSize: "1.3rem", color: "var(--fg, #f0f0f0)" },
  sub: { margin: "0 0 1.5rem", fontSize: "0.9rem", color: "#9ca3af", lineHeight: 1.5 },
  form: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  input: { padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--border, #444)", background: "var(--bg2, #111)", color: "var(--fg, #f0f0f0)", fontSize: "1rem", outline: "none" },
  error: { color: "#f87171", fontSize: "0.85rem", margin: 0 },
  btn: { padding: "0.75rem", borderRadius: "0.5rem", background: "var(--accent, #7c3aed)", color: "#fff", border: "none", cursor: "pointer", fontSize: "1rem", fontWeight: 600 },
};
