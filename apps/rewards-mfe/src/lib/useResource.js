import { useCallback, useEffect, useRef, useState } from "react";

// Minimal data-fetching hook: loading / error / data plus reload, and ignores stale responses
// when inputs change mid-flight. Deliberately small so the MFE has no data-library dependency.
export function useResource(load, deps) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true });
  const requestId = useRef(0);

  const run = useCallback(
    async ({ quiet = false } = {}) => {
      const id = ++requestId.current;
      if (!quiet) setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await load();
        if (id === requestId.current) setState({ data, error: null, loading: false });
      } catch (error) {
        if (id === requestId.current) setState((s) => ({ ...s, error, loading: false }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  useEffect(() => {
    run();
  }, [run]);

  return {
    ...state,
    reload: run,
    // Refresh in the background after a mutation, keeping current data on screen.
    refresh: () => run({ quiet: true }),
  };
}
