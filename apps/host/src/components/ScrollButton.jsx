import { useRef } from "react";
import { useRenderTracker } from "../hooks/useRenderTracker";

export default function ScrollButton({ target, children, variant = "primary" }) {
  const { trackStateInit, trackElementReturn, trackRefSetter } = useRenderTracker("ScrollButton");
  trackStateInit("target");
  trackStateInit("children");
  trackStateInit("variant");
  const buttonRef = useRef(null);
  const setButtonRef = trackRefSetter("buttonRef");

  trackElementReturn();
  return (
    <button
      ref={(el) => {
        buttonRef.current = el;
        setButtonRef(el);
      }}
      className={`button ${variant} dark`}
      type="button"
      onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth" })}
    >
      {children}
    </button>
  );
}
