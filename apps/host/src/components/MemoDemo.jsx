import { memo, useEffect, useMemo, useState } from "react";
import { useRenderTracker } from "../hooks/useRenderTracker";

function MemoChild({ label, children, detail }) {
  const { trackStateInit, trackElementReturn, trackEffectSetup, trackEffectCleanup } = useRenderTracker(
    "MemoChild",
    { label, children, detail }
  );

  trackStateInit("label");
  trackStateInit("detail");
  trackStateInit("children");

  useEffect(() => {
    trackEffectSetup("MemoChild effect");
    return () => trackEffectCleanup("MemoChild effect");
  }, []);

  trackElementReturn();

  return (
    <div className="memo-card">
      <h4>{label}</h4>
      <div className="memo-children">{children}</div>
      <small>{detail.text}</small>
    </div>
  );
}

const MemoChildMemo = memo(MemoChild, (prev, next) => {
  const sameProps = prev.label === next.label && prev.detail === next.detail && prev.children === next.children;

  if (sameProps) {
    console.log("[memo-skip] MemoChildMemo: props and children stable, render skipped");
  } else {
    console.log("[memo-run] MemoChildMemo: props changed", {
      prev: { label: prev.label, children: prev.children, detail: prev.detail },
      next: { label: next.label, children: next.children, detail: next.detail },
    });
  }

  return sameProps;
});

const DetailBox = memo(({ detail }) => {
  console.log("[render] DetailBox", detail);
  return <small className="memo-detail">{detail.text}</small>;
}, (prev, next) => prev.detail === next.detail);

export default function MemoDemo() {
  const [count, setCount] = useState(0);
  const stableChild = useMemo(() => <span className="memo-child">Stable child content</span>, []);
  const memoizedDetail = useMemo(() => ({ text: "Stable detail object from useMemo" }), []);
  const computedLabel = useMemo(() => {
    console.log("[useMemo] MemoDemo: computing label from count", count);
    return `Memo demo count ${count}`;
  }, [count]);

  return (
    <section id="memo-demo" className="section">
      <h2>Memoization and stable props</h2>
      <p>
        The first memoized child uses the same <code>children</code> reference and a stable detail object created with <code>useMemo</code>.
        React.memo can skip its render when props remain stable.
      </p>
      <button type="button" className="button secondary" onClick={() => setCount((current) => current + 1)}>
        Re-render parent (count: {count})
      </button>

      <div className="memo-grid">
        <MemoChildMemo label="Stable memo child" children={stableChild} detail={memoizedDetail} />
        <MemoChildMemo label="Dynamic children child" children={<span>Dynamic count {count}</span>} detail={memoizedDetail} />
      </div>

      <div className="memo-detail-block">
        <p>
          A second memoized component receives a memoized object prop from <code>useMemo</code>. When the object reference
          stays the same across renders, React.memo can skip this child too.
        </p>
        <DetailBox detail={memoizedDetail} />
        <p>{computedLabel}</p>
      </div>
    </section>
  );
}
