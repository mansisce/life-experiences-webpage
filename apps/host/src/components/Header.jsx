import { useContext } from "react";
import { pageLinks, homeNavItems } from "../data";
import { useRenderTracker } from "../hooks/useRenderTracker";
import { SpaceContext } from "../contexts/SpaceContext";

export default function Header({ space, onSpaceChange }) {
  const { trackStateInit, trackElementReturn } = useRenderTracker("Header");
  const { isAuthenticated, setIsAuthenticated } = useContext(SpaceContext);

  trackStateInit("space");
  trackElementReturn();

  return (
    <header className="site-header solid">
      <a className="brand" href="#/personal" aria-label="Mansi Gupta home">
        MG
      </a>
      <nav className="nav" aria-label="Primary navigation">
        <button
          className={`nav-btn ${space === "personal" ? "active" : ""}`}
          onClick={() => onSpaceChange("personal")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "0.5rem 1rem" }}
        >
          Personal OS
        </button>
        <button
          className={`nav-btn ${space === "professional" ? "active" : ""}`}
          onClick={() => onSpaceChange("professional")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "0.5rem 1rem" }}
        >
          Professional
        </button>
        <button
          className={`nav-btn ${space === "reward" ? "active" : ""}`}
          onClick={() => onSpaceChange("reward")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "0.5rem 1rem" }}
        >
          Rewards
        </button>
      </nav>

      <div style={{ display: "flex", gap: "1rem", marginLeft: "auto" }}>
        <button
          onClick={() => setIsAuthenticated(!isAuthenticated)}
          style={{
            padding: "0.5rem 1rem",
            background: isAuthenticated ? "#4CAF50" : "#ddd",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {isAuthenticated ? "🔐 Signed In" : "🔓 Sign In"}
        </button>
      </div>
    </header>
  );
}
