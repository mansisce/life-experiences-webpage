import { useEffect, useMemo, useState } from "react";
import { useRenderTracker } from "../hooks/useRenderTracker";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";
import ScrollButton from "../components/ScrollButton";
import MemoDemo from "../components/MemoDemo";
import BatchingExamples from "../components/BatchingExamples";
import { reactConcepts, interviewQuestions } from "../data";

const demoTrees = [
  {
    title: "Home page load: render + commit overview",
    description: "On the home page load, React renders the root and children, then commits DOM updates and paints the first frame.",
    nodes: [
      { label: "App render", color: "#3B82F6" },
      { label: "Header render", color: "#10B981" },
      { label: "HomePage render", color: "#8B5CF6" },
      { label: "commit phase", color: "#EF4444" },
      { label: "useRenderTracker", color: "#6366F1" },
      { label: "useState init", color: "#0EA5E9" },
      { label: "useMemo compute", color: "#14B8A6" },
      { label: "useLayoutEffect commit", color: "#F97316" },
      { label: "useEffect paint", color: "#DC2626" },
    ],
  },
  {
    title: "Third load: ref attachment after commit",
    description: "The next load changes the sequence again to show DOM refs attaching after the commit phase.",
    nodes: [
      { label: "App render", color: "#2563EB" },
      { label: "DOM refs set", color: "#F59E0B" },
      { label: "commit phase", color: "#EF4444" },
      { label: "render return", color: "#8B5CF6" },
      { label: "paint", color: "#10B981" },
    ],
  },
];

function LifecycleTreeDemo({ demo }) {
  return (
    <div className="lifecycle-demo">
      <h3>{demo.title}</h3>
      <p>{demo.description}</p>
      <div className="lifecycle-tree">
        {demo.nodes.map(({ label, color }) => (
          <div key={label} className="lifecycle-node" style={{ borderColor: color }}>
            <span className="lifecycle-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReactLabPage() {
  const { trackStateInit, trackElementReturn } = useRenderTracker("ReactLabPage");
  trackStateInit("react-data");
  const [demoIndex, setDemoIndex] = useState(0);
  const [selectedPage, setSelectedPage] = useState("home");
  const [activeStep, setActiveStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [showMemoDemo, setShowMemoDemo] = useState(true);

  const demo = useMemo(() => demoTrees[demoIndex], [demoIndex]);

  const sequences = {
    home: {
      labels: ["App render", "Header render", "PageHero render", "HomePage render", "commit phase", "paint"],
      logs: [
        "[render] App #1 (mount)",
        "[render] Header #1 (mount)",
        "[render] PageHero #1 (mount)",
        "[render] HomePage #1 (mount)",
        "[commit] App #1 (mount)",
        "[dom-paint] App #1",
      ],
    },
    resume: {
      labels: ["App render", "Header render", "ResumePage render", "resume data bind", "commit phase", "paint"],
      logs: [
        "[render] App #1 (mount)",
        "[render] Header #1 (mount)",
        "[render] ResumePage #1 (mount)",
        "[render] ResumeTimeline #1 (mount)",
        "[commit] ResumePage #1",
        "[dom-paint] ResumePage #1",
      ],
    },
    react: {
      labels: ["App render", "Header render", "ReactLab render", "concepts bind", "commit phase", "paint"],
      logs: [
        "[render] App #1 (mount)",
        "[render] Header #1 (mount)",
        "[render] ReactLabPage #1 (mount)",
        "[render] LifecycleDemo #1 (mount)",
        "[commit] ReactLabPage #1",
        "[dom-paint] ReactLabPage #1",
      ],
    },
    ai: {
      labels: ["App render", "Header render", "AiLearning render", "agents bind", "commit phase", "paint"],
      logs: [
        "[render] App #1 (mount)",
        "[render] Header #1 (mount)",
        "[render] AiLearningPage #1 (mount)",
        "[render] AgentDemo #1 (mount)",
        "[commit] AiLearningPage #1",
        "[dom-paint] AiLearningPage #1",
      ],
    },
    "little-human": {
      labels: ["App render", "Header render", "LittleHuman render", "rhythms bind", "commit phase", "paint"],
      logs: [
        "[render] App #1 (mount)",
        "[render] Header #1 (mount)",
        "[render] LittleHumanPage #1 (mount)",
        "[render] Rhythms #1 (mount)",
        "[commit] LittleHumanPage #1",
        "[dom-paint] LittleHumanPage #1",
      ],
    },
    memo: {
      labels: [
        "Parent re-render",
        "MemoChild check",
        "props stable?",
        "memo-skip",
        "commit (skip child)",
        "paint (skip child)",
      ],
      logs: [
        "[render] MemoDemo #2 (update)",
        "[memo-skip] MemoChildMemo: props and children stable, render skipped",
        "[stable] MemoChildMemo: props and children stable",
        "[memo-run] MemoChildMemo: props changed",
        "[commit] MemoDemo #2",
        "[dom-paint] MemoDemo #2",
      ],
    },
  };

  const selectedSeq = sequences[selectedPage];

  const playSequence = (pageKey) => {
    setSelectedPage(pageKey);
    setActiveStep(0);
    setPlaying(true);
  };

  useEffect(() => {
    if (!playing || activeStep < 0) return;

    const timeout = window.setTimeout(() => {
      if (activeStep < selectedSeq.labels.length - 1) {
        setActiveStep((s) => s + 1);
      } else {
        setPlaying(false);
      }
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [activeStep, playing, selectedSeq]);

  useEffect(() => {
    if (activeStep < 0) return;
    const log = selectedSeq.logs[activeStep];
    if (log) console.log(log);
  }, [activeStep, selectedSeq]);

  const switchDemo = () => setDemoIndex((current) => (current + 1) % demoTrees.length);

  trackElementReturn();
  return (
    <main>
      <PageHero
        eyebrow="React learning lab"
        title="Tricky React Compiler concepts I am mastering"
        copy="A focused page for the concepts, examples, and interview questions I am collecting while learning modern React, compiler-friendly patterns, hooks, rendering behavior, and performance."
        actions={
          <>
            <ScrollButton target="demo">Render demo</ScrollButton>
            <ScrollButton target="batching-examples" variant="secondary">
              Batching lab
            </ScrollButton>
            <ScrollButton target="concepts" variant="secondary">
              Concepts
            </ScrollButton>
            <button
              type="button"
              className="button secondary"
              onClick={() => setShowMemoDemo((current) => !current)}
            >
              {showMemoDemo ? "Hide memo demo" : "Show memo demo"}
            </button>
          </>
        }
      />

      <section id="demo" className="section">
        <SectionHeading eyebrow="Render lifecycle" title="Where render and commit phases happen" />
        <div className="demo-panel">
          <LifecycleTreeDemo demo={demo} />
          <button className="button secondary" type="button" onClick={switchDemo}>
            Change tree sequence
          </button>
        </div>
      </section>

      <section id="tracker-flow" className="section">
        <SectionHeading eyebrow="Tracker flow" title="useRenderTracker on Home page load" />
        <div className="sequence-board">
          <p>
            This page uses <code>useRenderTracker</code> in the app shell and in the Home page tree. On initial home load, the sequence looks like this:
          </p>
          <ol>
            <li>
              <strong>App render</strong> logs <code>[render] App #1 (mount)</code> and begins tracking state initialization.
            </li>
            <li>
              <strong>Header render</strong> logs <code>[render] Header #1</code> and builds top-level navigation.
            </li>
            <li>
              <strong>PageHero + HomePage render</strong> log their own render events and return JSX.
            </li>
            <li>
              <strong>Commit phase</strong> runs <code>useLayoutEffect</code>, logging <code>[commit]</code> for each component.
            </li>
            <li>
              <strong>DOM paint</strong> is logged by the effect callback with <code>[dom-paint]</code> after the browser paints.
            </li>
            <li>
              <strong>Later unmount</strong> logs <code>[unmount]</code> if the page is replaced by another route.
            </li>
          </ol>
          <div className="animation-board">
            <div>
              <p>Animate lifecycle for any page and watch console output sequence below.</p>
              <div className="page-buttons">
                <button className="button primary" type="button" onClick={() => playSequence("home")}>
                  HomePage
                </button>
                <button className="button" type="button" onClick={() => playSequence("resume")}>
                  ResumePage
                </button>
                <button className="button" type="button" onClick={() => playSequence("react")}>
                  ReactLab
                </button>
                <button className="button" type="button" onClick={() => playSequence("ai")}>
                  AiLearning
                </button>
                <button className="button" type="button" onClick={() => playSequence("little-human")}>
                  LittleHuman
                </button>
                <button className="button secondary" type="button" onClick={() => playSequence("memo")}>
                  Memo Skip
                </button>
              </div>
            </div>
            <div className="lifecycle-tree">
              {selectedSeq.labels.map((label, idx) => (
                <div key={label} className={`lifecycle-node ${activeStep === idx ? "active" : ""}`}>
                  <span className="lifecycle-label">{label}</span>
                </div>
              ))}
            </div>
            <div className="console-panel">
              <div className="console-title">Console output</div>
              {selectedSeq.logs.map((log, idx) => (
                <div key={log} className={`console-line ${activeStep === idx ? "active" : ""}`}>
                  <code>{log}</code>
                </div>
              ))}
            </div>
          </div>
          <p>
            Each subsequent page load changes the tree: the root render still happens first, but the exact order of
            memoized values, ref attachment, and commit logging will vary depending on which page component is active.
          </p>
        </div>
      </section>

      <BatchingExamples />

      {showMemoDemo ? (
        <MemoDemo />
      ) : (
        <section id="memo-demo" className="section">
          <SectionHeading eyebrow="Memo lab" title="Memo demo is hidden" />
          <p>
            Toggle the memo demo back on to inspect how <code>React.memo</code> and <code>useMemo</code> work together.
            When the demo is visible, use the button inside it to trigger parent re-renders and observe skipped child renders.
          </p>
        </section>
      )}

      <section id="concepts" className="section">
        <SectionHeading eyebrow="Concept board" title="Compiler-friendly React thinking" />
        <div className="learning-grid">
          {reactConcepts.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section band split">
        <div>
          <p className="eyebrow">Example format</p>
          <h2>How I will document each tricky case</h2>
          <p>
            Each concept can grow into a small note with the problem, a wrong version, a corrected version, and the
            interview takeaway. This makes the page useful for both learning and storytelling.
          </p>
        </div>
        <div className="note-stack">
          <article>
            <h3>1. The pattern</h3>
            <p>What code shape creates the confusion or performance issue?</p>
          </article>
          <article>
            <h3>2. The reasoning</h3>
            <p>What is React doing during render, commit, effects, or memoization?</p>
          </article>
          <article>
            <h3>3. The interview answer</h3>
            <p>How would I explain it clearly in two minutes?</p>
          </article>
        </div>
      </section>

      <section id="questions" className="section">
        <SectionHeading eyebrow="Interview prep" title="Questions I am building answers for" />
        <ol className="question-list">
          {interviewQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
