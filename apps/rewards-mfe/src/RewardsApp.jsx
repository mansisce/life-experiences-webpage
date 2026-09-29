import { Component, useCallback, useInsertionEffect, useMemo, useRef, useState } from "react";
import css from "./rewards.css?inline";
import { createApi } from "./api.js";
import { RewardsContext } from "./context.js";
import { makeLinks, useHashRoute } from "./lib/router.js";
import { Toasts } from "./components/ui.jsx";
import TilesScreen from "./screens/TilesScreen.jsx";
import CategoryScreen from "./screens/CategoryScreen.jsx";
import AreaScreen from "./screens/AreaScreen.jsx";
import TaskScreen from "./screens/TaskScreen.jsx";
import RewardsScreen from "./screens/RewardsScreen.jsx";

const DEFAULT_BFF_URL = import.meta.env.VITE_BFF_URL || "http://localhost:8000";
const DEFAULT_TOKEN = import.meta.env.VITE_BFF_TOKEN || "demo-token";

// The MFE brings its own styles as a string and injects them once, scoped under .rw-app,
// so it works the same whether it's loaded by the host or standalone.
function useScopedStyles() {
  useInsertionEffect(() => {
    if (document.getElementById("rewards-mfe-styles")) return;
    const style = document.createElement("style");
    style.id = "rewards-mfe-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }, []);
}

class ScreenBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="rw-state rw-state--error" role="alert">
        <p>This screen hit an unexpected error.</p>
        <button type="button" className="rw-btn" onClick={() => this.setState({ error: null })}>
          Try again
        </button>
      </div>
    );
  }
}

function Screen({ route }) {
  switch (route.name) {
    case "category":
      return <CategoryScreen key={route.param} categoryId={route.param} tab={route.tab} />;
    case "area":
      return <AreaScreen key={route.param} areaId={Number(route.param)} tab={route.tab} />;
    case "task":
      return <TaskScreen key={route.param} taskId={Number(route.param)} />;
    case "rewards":
      return <RewardsScreen />;
    default:
      return <TilesScreen />;
  }
}

/**
 * Public contract of the microfrontend (exposed as "rewardsMfe/RewardsApp").
 * All props are optional: by default it talks to the BFF configured at its own build time.
 */
export default function RewardsApp({ apiBaseUrl = DEFAULT_BFF_URL, token = DEFAULT_TOKEN, basePath = "/rewards" }) {
  useScopedStyles();
  const route = useHashRoute(basePath);
  const links = useMemo(() => makeLinks(basePath), [basePath]);
  const api = useMemo(() => createApi({ baseUrl: apiBaseUrl.replace(/\/$/, ""), token }), [apiBaseUrl, token]);

  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const dismiss = useCallback((id) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);
  const toast = useCallback(
    (message, kind = "info") => {
      const id = ++nextId.current;
      setToasts((ts) => [...ts.slice(-2), { id, message, kind }]);
      setTimeout(() => dismiss(id), kind === "celebrate" ? 6000 : 3500);
    },
    [dismiss]
  );
  const celebrate = useCallback(
    (rewards = []) => rewards.forEach((r) => toast(`🎉 Reward unlocked: ${r.title}`, "celebrate")),
    [toast]
  );

  const context = useMemo(() => ({ api, links, toast, celebrate }), [api, links, toast, celebrate]);
  const onRewards = route.name === "rewards";

  return (
    <RewardsContext.Provider value={context}>
      <div className="rw-app">
        <nav className="rw-tabs" aria-label="Rewards sections">
          <a href={links.tiles()} aria-current={!onRewards ? "page" : undefined}>
            Areas
          </a>
          <a href={links.rewards()} aria-current={onRewards ? "page" : undefined}>
            Rewards
          </a>
        </nav>
        <ScreenBoundary resetKey={`${route.name}/${route.param}`}>
          <Screen route={route} />
        </ScreenBoundary>
        <Toasts items={toasts} onDismiss={dismiss} />
      </div>
    </RewardsContext.Provider>
  );
}
