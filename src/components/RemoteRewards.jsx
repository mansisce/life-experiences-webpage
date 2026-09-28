import { Component, lazy, Suspense } from "react";

// The host knows only the remote's name and public contract: <RewardsApp basePath />.
// If the remote can't be loaded (not deployed, offline, network error), the rest of the site
// keeps working and this route shows a retry card instead of a blank page.
const RewardsApp = lazy(() => import("rewardsMfe/RewardsApp"));

class RemoteBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("[host] Rewards microfrontend failed to load", error);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="remote-fallback" role="alert">
        <h2>Rewards is unavailable right now</h2>
        <p>The rewards module couldn't be loaded. The rest of the site still works.</p>
        {/* Browsers cache a failed module import for the page's lifetime, so retrying means reloading. */}
        <button type="button" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }
}

export default function RemoteRewards() {
  return (
    <main className="remote-page">
      <RemoteBoundary>
        <Suspense fallback={<p className="remote-loading">Loading rewards…</p>}>
          <RewardsApp basePath="/rewards" />
        </Suspense>
      </RemoteBoundary>
    </main>
  );
}
