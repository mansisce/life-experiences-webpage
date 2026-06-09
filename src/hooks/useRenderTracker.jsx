import { useEffect, useLayoutEffect, useRef } from "react";

export function useRenderTracker(componentName) {
  const renderCount = useRef(0);
  const commitCount = useRef(0);
  const mounted = useRef(false);

  renderCount.current += 1;
  const phase = mounted.current ? "update" : "mount";
  console.log(`[render] ${componentName} #${renderCount.current} (${phase})`);

  useLayoutEffect(() => {
    commitCount.current += 1;
    console.log(`[commit] ${componentName} #${commitCount.current} (${phase})`);

    if (mounted.current) {
      console.log(`[update] ${componentName} #${renderCount.current - 1}`);
    } else {
      mounted.current = true;
    }
  });

  useEffect(() => {
    return () => {
      console.log(`[unmount] ${componentName}`);
    };
  }, []);

  return renderCount.current;
}
