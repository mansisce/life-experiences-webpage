import { useRenderTracker } from "../hooks/useRenderTracker";

export default function ScrollButton({ target, children, variant = "primary" }) {
  useRenderTracker("ScrollButton");
  return (
    <button className={`button ${variant} dark`} type="button" onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth" })}>
      {children}
    </button>
  );
}
