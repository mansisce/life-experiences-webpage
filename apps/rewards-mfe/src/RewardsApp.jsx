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
import RewardScreen from "./screens/RewardScreen.jsx";
import RewardsListScreen from "./screens/RewardsListScreen.jsx";
import TasksListScreen from "./screens/TasksListScreen.jsx";
import LinkScreen from "./screens/LinkScreen.jsx";

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
      return <CategoryScreen key={route.param} categoryId={route.param} tab={route.tab} query={route.query} />;
    case "area":
      return <AreaScreen key={route.param} areaId={Number(route.param)} tab={route.tab} query={route.query} />;
    case "task":
      return <TaskScreen key={route.param} taskId={Number(route.param)} />;
    case "reward":
      return <RewardScreen key={route.param} rewardId={Number(route.param)} />;
    case "tasksList":
      return <TasksListScreen />;
    case "rewardsList":
      return <RewardsListScreen />;
    case "link":
      return <LinkScreen key={route.query} query={route.query} />;
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

  return (
    <RewardsContext.Provider value={context}>
      <div className="rw-app">
        <nav className="rw-tabs" aria-label="Rewards sections">
          {[
            ["Tiles", links.tiles(), !["tasksList", "rewardsList", "link", "reward"].includes(route.name)],
            ["Tasks", links.tasksList(), route.name === "tasksList"],
            ["Rewards", links.rewardsList(), route.name === "rewardsList" || route.name === "reward"],
            ["Link", links.link(), route.name === "link"],
          ].map(([text, href, current]) => (
            <a key={text} href={href} aria-current={current ? "page" : undefined}>
              {text}
            </a>
          ))}
        </nav>
        <ScreenBoundary resetKey={`${route.name}/${route.param}/${route.tab}`}>
          <Screen route={route} />
        </ScreenBoundary>
        <Toasts items={toasts} onDismiss={dismiss} />
      </div>
    </RewardsContext.Provider>
  );
}
