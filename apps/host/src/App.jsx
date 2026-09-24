import { useEffect, useMemo, useState, Suspense, lazy } from "react";
import { useRenderTracker } from "./hooks/useRenderTracker";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import LittleHumanPage from "./pages/LittleHumanPage";
import ResumePage from "./pages/ResumePage";
import ReactLabPage from "./pages/ReactLabPage";
import AiLearningPage from "./pages/AiLearningPage";
import { SpaceContext } from "./contexts/SpaceContext";

// Lazy load federated modules
const PersonalOSModule = lazy(() => import("personalOS/App"));
const ProfessionalModule = lazy(() => import("professional/App"));
const RewardSystemModule = lazy(() => import("rewardSystem/App"));

function getRoute() {
  const route = window.location.hash.replace("#", "") || "/personal";
  return route.startsWith("/") ? route : "/personal";
}

function App() {
  const { trackStateInit, trackElementReturn, trackEffectSetup, trackEffectCleanup } = useRenderTracker("App");
  trackStateInit("route");
  const [route, setRoute] = useState(getRoute);
  trackStateInit("space");
  const [currentSpace, setCurrentSpace] = useState("personal");
  trackStateInit("auth");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Determine space from route
  const space = route.split("/")[1]; // Extract "personal", "professional", "reward"

  const handleToggleSpace = (newSpace) => {
    setCurrentSpace(newSpace);
    window.location.hash = `#/${newSpace}`;
  };

  const handleToggleAuth = () => {
    setIsAuthenticated(!isAuthenticated);
  };

  // Legacy page routing (old pages)
  const legacyPage = useMemo(() => {
    if (route === "/little-human") return <LittleHumanPage />;
    if (route === "/resume") return <ResumePage />;
    if (route === "/react") return <ReactLabPage />;
    if (route === "/ai") return <AiLearningPage />;
    return <HomePage />;
  }, [route]);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHashChange);
    trackEffectSetup("hashchange listener");
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      trackEffectCleanup("hashchange listener");
    };
  }, []);

  useEffect(() => {
    trackEffectSetup("route scroll reset");
    window.scrollTo({ top: 0, behavior: "auto" });
    return () => {
      trackEffectCleanup("route scroll reset");
    };
  }, [route]);

  trackElementReturn();

  return (
    <SpaceContext.Provider
      value={{
        currentSpace,
        setCurrentSpace: handleToggleSpace,
        isAuthenticated,
        setIsAuthenticated: handleToggleAuth,
      }}
    >
      <Header space={currentSpace} onSpaceChange={handleToggleSpace} />

      <main className="main-content">
        <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading module...</div>}>
          {space === "personal" && <PersonalOSModule />}
          {space === "professional" && <ProfessionalModule />}
          {space === "reward" && <RewardSystemModule />}
          {!["personal", "professional", "reward"].includes(space) && legacyPage}
        </Suspense>
      </main>

      <footer className="footer">
        <p>Built as a living page for Mansi Gupta.</p>
        <a href="#/personal">Back home</a>
      </footer>
    </SpaceContext.Provider>
  );
}

export default App;
