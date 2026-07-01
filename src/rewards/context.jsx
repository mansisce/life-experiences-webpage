import { createContext, useContext, useEffect, useReducer, useState } from "react";

const API = "/api/rewards";

// ─── Auth Context ─────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [verified, setVerified] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if passcode is set up
    fetch(`${API}/auth/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passcode: "__probe__" }) })
      .then(r => r.json())
      .then(d => {
        if (d.error === "not_setup") setIsNewUser(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function setup(passcode) {
    setError("");
    const r = await fetch(`${API}/auth/setup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passcode }) });
    const d = await r.json();
    if (!r.ok) { setError(d.error || "Setup failed"); return false; }
    setVerified(true);
    setIsNewUser(false);
    return true;
  }

  async function verify(passcode) {
    setError("");
    const r = await fetch(`${API}/auth/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passcode }) });
    const d = await r.json();
    if (!r.ok) { setError("Wrong passcode. Try again."); return false; }
    setVerified(true);
    return true;
  }

  function logout() { setVerified(false); }

  return (
    <AuthContext.Provider value={{ verified, isNewUser, loading, error, setup, verify, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }

// ─── Goals Context ────────────────────────────────────────────────────────────

const GoalsContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case "SET_GOALS": return { ...state, goals: action.goals, loading: false };
    case "SET_CATEGORIES": return { ...state, categories: action.categories };
    case "SET_REWARDS": return { ...state, rewards: action.rewards };
    case "SET_LOADING": return { ...state, loading: action.loading };
    case "SET_ERROR": return { ...state, error: action.error };
    default: return state;
  }
}

export function GoalsProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { goals: [], categories: [], rewards: [], loading: true, error: null });

  async function loadGoals() {
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const [gr, cr, rr] = await Promise.all([
        fetch(`${API}/goals`).then(r => r.json()),
        fetch(`${API}/categories`).then(r => r.json()),
        fetch(`${API}/rewards`).then(r => r.json()),
      ]);
      dispatch({ type: "SET_GOALS", goals: Array.isArray(gr) ? gr : [] });
      dispatch({ type: "SET_CATEGORIES", categories: Array.isArray(cr) ? cr : [] });
      dispatch({ type: "SET_REWARDS", rewards: Array.isArray(rr) ? rr : [] });
    } catch (e) {
      dispatch({ type: "SET_ERROR", error: e.message });
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }

  async function createGoal(data) {
    const r = await fetch(`${API}/goals`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error((await r.json()).error);
    await loadGoals();
  }

  async function updateGoal(id, data) {
    await fetch(`${API}/goals/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    await loadGoals();
  }

  async function deleteGoal(id) {
    await fetch(`${API}/goals/${id}`, { method: "DELETE" });
    await loadGoals();
  }

  async function logDay(goalId, data) {
    const r = await fetch(`${API}/goals/${goalId}/log`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const d = await r.json();
    await loadGoals();
    return d;
  }

  async function addMilestone(goalId, data) {
    await fetch(`${API}/goals/${goalId}/milestones`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    await loadGoals();
  }

  async function deleteMilestone(id) {
    await fetch(`${API}/milestones/${id}`, { method: "DELETE" });
    await loadGoals();
  }

  async function createReward(data) {
    const r = await fetch(`${API}/rewards`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error((await r.json()).error);
    await loadGoals();
  }

  async function updateReward(id, data) {
    await fetch(`${API}/rewards/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    await loadGoals();
  }

  async function deleteReward(id) {
    await fetch(`${API}/rewards/${id}`, { method: "DELETE" });
    await loadGoals();
  }

  async function linkReward(rewardId, { goalId, milestoneId }) {
    await fetch(`${API}/rewards/${rewardId}/link`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goalId, milestoneId }) });
    await loadGoals();
  }

  async function unlinkReward(rewardId, { goalId, milestoneId }) {
    await fetch(`${API}/rewards/${rewardId}/link`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goalId, milestoneId }) });
    await loadGoals();
  }

  async function claimReward(id) {
    await fetch(`${API}/rewards/${id}/claim`, { method: "PUT" });
    await loadGoals();
  }

  async function receiveReward(id) {
    await fetch(`${API}/rewards/${id}/receive`, { method: "PUT" });
    await loadGoals();
  }

  async function addCategory(data) {
    await fetch(`${API}/categories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const cr = await fetch(`${API}/categories`).then(r => r.json());
    dispatch({ type: "SET_CATEGORIES", categories: Array.isArray(cr) ? cr : [] });
  }

  async function getGoalDetail(id) {
    const r = await fetch(`${API}/goals/${id}`);
    return r.json();
  }

  return (
    <GoalsContext.Provider value={{ ...state, loadGoals, createGoal, updateGoal, deleteGoal, logDay, addMilestone, deleteMilestone, createReward, updateReward, deleteReward, linkReward, unlinkReward, claimReward, receiveReward, addCategory, getGoalDetail }}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() { return useContext(GoalsContext); }
