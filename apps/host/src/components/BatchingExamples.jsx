import { flushSync } from "react-dom";
import { useEffect, useState } from "react";

const snippetA = `function SameTickBatch() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount((c) => c + 1);
    setCount((c) => c + 1);
    console.log("Count during tick:", count); // Old value due to batching
  }

  return <button onClick={handleClick}>Count: {count}</button>;
}`;

const snippetB = `function StaleClosure() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    setCount(count + 1);
    console.log("Count during tick:", count); // Old value due to stale closure
  }

  return <button onClick={handleClick}>Count: {count}</button>;
}`;

const snippetC = `import { flushSync } from "react-dom";

function FlushSyncExample() {
  const [count, setCount] = useState(0);

  function handleClick() {
    flushSync(() => {
      setCount((c) => c + 1);
    });
    console.log("Flushed count update before event ends");
  }

  return <button onClick={handleClick}>Count: {count}</button>;
}`;

function CodeBlock({ code }) {
  return (
    <pre className="code-block">
      <code>{code}</code>
    </pre>
  );
}

export default function BatchingExamples() {
  const [countA, setCountA] = useState(0);
  const [countB, setCountB] = useState(0);
  const [countC, setCountC] = useState(0);
  const [log, setLog] = useState([]);

  useEffect(() => {
    if (log.length > 12) {
      setLog((current) => current.slice(0, 12));
    }
  }, [log]);

  const appendLog = (entry) => {
    setLog((current) => [entry, ...current].slice(0, 12));
  };

  const handleA = () => {
    setCountA((c) => c + 1);
    setCountA((c) => c + 1);
    appendLog(`A: count during tick = ${countA} (old due to batching)`);
  };

  const handleB = () => {
    setCountB(countB + 1);
    setCountB(countB + 1);
    appendLog(`B: count during tick = ${countB} (old due to stale closure)`);
  };

  const handleC = () => {
    flushSync(() => {
      setCountC((c) => c + 1);
      setCountC((c) => c + 1);
       //to demonstrate the concept of batching vs flushSync we need to call setCountC twice inside the flushSync callback. If we only call it once, the count will only increment by 1, which might give the impression that flushSync is not working as expected. By calling it twice, we can show that both updates are applied immediately, and the count increments by 2 before the event handler finishes.
    });
    appendLog(`C: flushSync rendered count = ${countC + 1}`);
  };

  return (
    <section id="batching-examples" className="section">
      <SectionHeading eyebrow="Batching lab" title="Render batching and state update behavior" />
      <p>
        These examples show how React groups state updates in the same event tick, why the value inside the event handler still
        reflects the previous render, and how functional updates avoid stale closure problems.
      </p>

      <div className="example-grid">
        <article className="example-card">
          <h3>1. Same-tick batching</h3>
          <p>
            Two functional updates in the same click are batched together. The display updates by +2, but the event log still
            sees the previous count value.
          </p>
          <button className="button primary" type="button" onClick={handleA}>
            Count A: {countA}
          </button>
          <CodeBlock code={snippetA} />
        </article>

        <article className="example-card">
          <h3>2. Stale closure with non-functional updates</h3>
          <p>
            Two direct updates with <code>count + 1</code> use the same old value twice. Batching still happens, but the state
            only increments by 1 because the second update reuses stale state.
          </p>
          <button className="button primary" type="button" onClick={handleB}>
            Count B: {countB}
          </button>
          <CodeBlock code={snippetB} />
        </article>

        <article className="example-card">
          <h3>3. Flushing a render immediately</h3>
          <p>
            Using <code>flushSync</code> forces React to apply the update and flush rendering before the event handler returns.
            This can be useful for cases where the updated DOM must be visible immediately.
          </p>
          <button className="button primary" type="button" onClick={handleC}>
            Count C: {countC}
          </button>
          <CodeBlock code={snippetC} />
        </article>
      </div>

      <div className="log-panel">
        <h4>Event log</h4>
        <ol>
          {log.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ol>
      </div>

      <div className="question-block">
        <h4>Mini interview questions</h4>
        <ol>
          <li>What is React render batching and when does it happen?</li>
          <li>Why does <code>console.log</code> inside an event handler show the old state after calling <code>setState</code>?</li>
          <li>How do functional updates like <code>setCount(c =&gt; c + 1)</code> behave differently from <code>setCount(count + 1)</code>?</li>
          <li>What happens when you call the same state setter twice in one event handler?</li>
          <li>How does <code>flushSync</code> change batching behavior?</li>
        </ol>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
    </div>
  );
}
