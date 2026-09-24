import { useEffect, useMemo, useState } from "react";
import { useRenderTracker } from "./hooks/useRenderTracker";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import LittleHumanPage from "./pages/LittleHumanPage";
import ResumePage from "./pages/ResumePage";
import ReactLabPage from "./pages/ReactLabPage";
import AiLearningPage from "./pages/AiLearningPage";
import CuratorPage from "./pages/CuratorPage";
import RewardsApp from "./rewards/RewardsApp.jsx";
import WhatsAppButton from "./components/WhatsAppButton";

function getRoute() {
  const route = window.location.hash.replace("#", "") || "/";
  return route.startsWith("/") ? route : "/";
}

function App() {
  useRenderTracker("App");
  const [route, setRoute] = useState(getRoute);
  const page = useMemo(() => {
    if (route === "/little-human") return <LittleHumanPage />;
    if (route === "/resume") return <ResumePage />;
    if (route === "/react") return <ReactLabPage />;
    if (route === "/ai") return <AiLearningPage />;
    if (route === "/curator") return <CuratorPage />;
    if (route === "/rewards") return <RewardsApp />;
    return <HomePage />;
  }, [route]);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [route]);

  return (
    <>
      <Header route={route} />
      {page}
      <footer className="footer">
        <p>Built as a living page for Mansi Gupta.</p>
        <a href="#/">Back home</a>
      </footer>
      <WhatsAppButton />
    </>
  );
}

export default App;
