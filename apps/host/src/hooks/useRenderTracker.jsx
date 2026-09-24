import { useEffect, useLayoutEffect, useRef } from "react";

export function useRenderTracker(componentName, props = {}) {
  const renderCount = useRef(0);
  const commitCount = useRef(0);
  const mounted = useRef(false);
  const startTimeRef = useRef(0);
  const lastPropsRef = useRef({});
  const lastChildrenRef = useRef();

  renderCount.current += 1;
  const phase = mounted.current ? "update" : "mount";
  startTimeRef.current = performance.now();
  console.log(`[render] ${componentName} #${renderCount.current} (${phase})`);

  // Track state initialization
  const trackStateInit = (stateName) => {
    console.log(`[state-init] ${componentName}: ${stateName}`);
  };

  // Track when useEffect setup and cleanup happen
  const trackEffectSetup = (effectName) => {
    console.log(`[effect-setup] ${componentName}: ${effectName}`);
  };

  const trackEffectCleanup = (effectName) => {
    console.log(`[effect-cleanup] ${componentName}: ${effectName}`);
  };

  // Track when elements are returned
  const trackElementReturn = () => {
    const renderTime = performance.now() - startTimeRef.current;
    console.log(`[element-return] ${componentName} #${renderCount.current} - render took ${renderTime.toFixed(2)}ms`);
  };

  // Track when DOM refs are set
  const trackRefSet = (refName, ref) => {
    console.log(`[ref-set] ${componentName}: ${refName}`, ref);
  };

  const checkPropsStability = () => {
    const keys = Object.keys(props);
    const changed = keys.some((key) => props[key] !== lastPropsRef.current[key]);
    const childrenChanged = props.children !== lastChildrenRef.current;

    if (!changed && !childrenChanged && renderCount.current > 1) {
      console.log(`[stable] ${componentName}: props and children stable, component may be skipped by React.memo`);
    }

    if (childrenChanged) {
      console.log(`[children] ${componentName}: children changed`, { prev: lastChildrenRef.current, next: props.children });
    } else if (renderCount.current > 1) {
      console.log(`[children] ${componentName}: children stable`);
    }

    lastPropsRef.current = props;
    lastChildrenRef.current = props.children;
  };

  const domInsertObservers = useRef({});

  // Returns a callback ref setter that logs when the DOM element is attached and inserted into the document
  const trackRefSetter = (refName) => (el) => {
    if (domInsertObservers.current[refName]) {
      domInsertObservers.current[refName].disconnect();
      delete domInsertObservers.current[refName];
    }

    console.log(`[ref-set] ${componentName}: ${refName}`, el);

    if (!el) {
      return;
    }

    const markInserted = () => {
      console.log(`[insert] ${componentName}: ${refName}`);
      if (domInsertObservers.current[refName]) {
        domInsertObservers.current[refName].disconnect();
        delete domInsertObservers.current[refName];
      }
    };

    if (el.isConnected) {
      markInserted();
      return;
    }

    if (typeof MutationObserver !== "undefined") {
      const observer = new MutationObserver(() => {
        if (el.isConnected) {
          markInserted();
        }
      });
      observer.observe(document, { childList: true, subtree: true });
      domInsertObservers.current[refName] = observer;
    }
  };

  useEffect(() => {
    return () => {
      Object.values(domInsertObservers.current).forEach((observer) => observer.disconnect());
      domInsertObservers.current = {};
    };
  }, []);

  useLayoutEffect(() => {
    commitCount.current += 1;
    console.log(`[commit] ${componentName} #${commitCount.current} (${phase})`);
    checkPropsStability();

    if (mounted.current) {
      console.log(`[update] ${componentName} #${renderCount.current - 1}`);
    } else {
      mounted.current = true;
    }
  });

  // Track DOM painting using requestAnimationFrame
  useEffect(() => {
    const paintFrameId = requestAnimationFrame(() => {
      console.log(`[dom-paint] ${componentName} #${renderCount.current}`);
    });

    return () => {
      cancelAnimationFrame(paintFrameId);
      console.log(`[unmount] ${componentName}`);
    };
  }, []);

  return {
    renderCount: renderCount.current,
    trackStateInit,
    trackElementReturn,
    trackRefSet,
    trackRefSetter,
    trackEffectSetup,
    trackEffectCleanup,
  };
}
