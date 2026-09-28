// Standalone entry for developing the MFE on its own (npm run dev). The host never loads this file.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import RewardsApp from "./RewardsApp.jsx";

if (!window.location.hash.startsWith("#/rewards")) window.location.hash = "#/rewards";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RewardsApp />
  </StrictMode>
);
