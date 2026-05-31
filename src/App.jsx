import { useEffect, useMemo, useState } from "react";

const pageLinks = [
  ["Home", "#/"],
  ["React Lab", "#/react"],
  ["AI Learning", "#/ai"],
];

const homeNavItems = [
  ["Experiences", "experiences"],
  ["Now", "current"],
  ["Food", "recipes"],
  ["Health", "health"],
  ["Work", "work"],
  ["Resume", "resume"],
];

const experiences = [
  {
    label: "2006 onward",
    title: "Started with engineering and hands-on development",
    body: "B.E. in Information Science from VTU, Sapthagiri College of Engineering, Bangalore. Early work began around PHP, LAMP stack, HTML, CSS, and web application development.",
  },
  {
    label: "Growth years",
    title: "Moved across product and client contexts",
    body: "Built experience through Tally, Tavant, Aditi, Visa, Harman, Blue Nile, Quikr, Zynga, and Ladbrokes work. Each context added a new muscle: delivery, communication, code quality, and product understanding.",
  },
  {
    label: "2018 - now",
    title: "Frontend leadership and release excellence",
    body: "At IBM Consulting, grew into frontend SME, React microfrontend ownership, team leadership, application architecture, GitHub Actions, release automation, and portfolio management.",
  },
];

const interests = [
  ["Food", "Trying nourishing recipes that are practical, flavorful, and easy to repeat."],
  ["Health", "Testing small routines around movement, hydration, sleep, strength, and energy."],
  ["Work", "Learning through frontend architecture, automation, release systems, and better team practices."],
  ["Reflection", "Collecting lessons from everyday decisions, career chapters, and personal experiments."],
];

const recipes = [
  ["High-protein breakfast bowl", "A weekday experiment for steady energy and simple prep."],
  ["Comfort dal with more greens", "Familiar food with a healthier plate and less friction."],
  ["Balanced snack board", "A colorful, easy option for weekends or busy evenings."],
];

const healthHabits = [
  ["Movement", "Walks, mobility, light strength"],
  ["Nutrition", "Protein, fiber, hydration"],
  ["Sleep", "Wind-down routine and consistency"],
  ["Mind", "Journaling, pauses, boundaries"],
];

const workLessons = [
  {
    title: "Frontend depth",
    body: "React, Angular, HTML5, CSS, Highcharts, microfrontends, code reviews, and UI ownership across enterprise applications.",
  },
  {
    title: "Engineering systems",
    body: "GitHub Actions, release automation, portfolio management, and smoother release practices for large teams.",
  },
  {
    title: "Leadership",
    body: "Team leadership, SME responsibilities, application architecture, mentoring, and cross-functional collaboration.",
  },
];

const reactConcepts = [
  {
    title: "React Compiler mental model",
    body: "I am studying how the compiler can memoize safely when components and hooks stay pure. The important idea is not magic performance; it is writing React code that is predictable enough for tooling to optimize.",
  },
  {
    title: "Purity and render behavior",
    body: "A component render should calculate UI from props, state, and context. Tricky examples go here: mutation during render, hidden side effects, unstable objects, and why they confuse optimization.",
  },
  {
    title: "Memoization without overusing memo",
    body: "This page will collect examples where React Compiler reduces manual useMemo, useCallback, and memo pressure, plus cases where explicit memoization may still matter.",
  },
  {
    title: "Escape hatches and boundaries",
    body: "Some patterns need extra care: refs, external stores, imperative code, custom hooks, library boundaries, and values that intentionally change identity.",
  },
];

const interviewQuestions = [
  "What problem is React Compiler trying to solve, and what problem is it not trying to solve?",
  "Why does component purity matter for compiler-driven optimization?",
  "When can creating an object inside render be fine, and when can it cause unnecessary child renders?",
  "How do useMemo, useCallback, and React.memo change when compiler optimization is available?",
  "What are examples of code that looks harmless but creates hidden side effects during render?",
  "How would you explain stale closures in hooks to another engineer?",
];

const aiLearning = [
  {
    title: "Voice and agent systems",
    body: "I am learning how voice agents listen, understand intent, decide what to do next, and respond naturally. The Bolna agent work belongs here as a practical learning project.",
  },
  {
    title: "Prompting and evaluation",
    body: "I want to document prompt versions, failure cases, test conversations, and what made the assistant more useful, grounded, or consistent.",
  },
  {
    title: "AI product thinking",
    body: "Beyond models, I am studying flows: what the user needs, how the agent should recover from ambiguity, and how to design trust into the experience.",
  },
];

const bolnaNotes = [
  ["Agent purpose", "Describe what your Bolna agent helps users do and which workflow it automates."],
  ["Architecture", "Add the pieces here: voice input, transcription, intent handling, backend APIs, memory, and response generation."],
  ["Learning log", "Track the bugs, surprising conversations, latency issues, and improvements you made while building it."],
  ["Demo attachment", "Add links later for a recording, GitHub repo, write-up, or hosted demo."],
];

function getRoute() {
  const route = window.location.hash.replace("#", "") || "/";
  return route.startsWith("/") ? route : "/";
}

function Header({ route }) {
  const isHome = route === "/";

  return (
    <header className={`site-header ${isHome ? "" : "solid"}`}>
      <a className="brand" href="#/" aria-label="Mansi Gupta home">
        MG
      </a>
      <nav className="nav" aria-label="Primary navigation">
        {pageLinks.map(([label, href]) => (
          <a className={route === href.replace("#", "") ? "active" : ""} key={href} href={href}>
            {label}
          </a>
        ))}
        {isHome &&
          homeNavItems.map(([label, id]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
      </nav>
    </header>
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

function PageHero({ eyebrow, title, copy, actions }) {
  return (
    <section className="page-hero">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="hero-copy">{copy}</p>
        {actions && <div className="hero-actions">{actions}</div>}
      </div>
    </section>
  );
}

function ScrollButton({ target, children, variant = "primary" }) {
  return (
    <button className={`button ${variant} dark`} type="button" onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth" })}>
      {children}
    </button>
  );
}

function HomePage() {
  return (
    <main id="top">
      <section className="hero" aria-label="Personal introduction">
        <img className="hero-image" src="/life-journal-hero.png" alt="A journal desk scene with food, notes, and work tools." />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow">Life experiments, thoughtfully collected</p>
          <h1>Mansi Gupta</h1>
          <p className="hero-copy">
            Frontend engineer, React SME, team leader, and curious learner documenting the real threads of life: food,
            health, work, memories, and what each chapter keeps teaching me.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#/react">
              React learning lab
            </a>
            <a className="button secondary" href="#/ai">
              AI learning notes
            </a>
          </div>
        </div>
      </section>

      <section className="intro band">
        <SectionHeading eyebrow="Personal operating system" title="A living portfolio for life and learning" />
        <div className="intro-grid">
          <p>
            This page brings together the professional Mansi from the resume and the everyday Mansi who experiments,
            reflects, cooks, improves routines, and learns by building.
          </p>
          <ul className="quick-facts" aria-label="Quick personal facts">
            <li>
              <span>Currently</span> Frontend engineering, release automation, and healthier routines
            </li>
            <li>
              <span>Learning through</span> React systems, leadership, notes, feedback, and experiments
            </li>
            <li>
              <span>Kitchen mood</span> Nourishing recipes with practical weekday energy
            </li>
            <li>
              <span>Work focus</span> Architecture, microfrontends, GitHub Actions, and delivery quality
            </li>
          </ul>
        </div>
      </section>

      <section id="experiences" className="section">
        <SectionHeading eyebrow="Past experiences" title="Moments that shaped how I think" />
        <div className="timeline">
          {experiences.map((item) => (
            <article key={item.title}>
              <time>{item.label}</time>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="current" className="section band">
        <SectionHeading eyebrow="Current interests" title="What has my attention right now" />
        <div className="interest-grid">
          {interests.map(([title, body], index) => (
            <article className="interest" key={title}>
              <span className="icon">{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="recipes" className="section split">
        <div>
          <p className="eyebrow">Food experiments</p>
          <h2>Recipes I am trying</h2>
          <p>
            A space to keep current kitchen notes: what I changed, what worked, what felt nourishing, and what I would
            repeat.
          </p>
        </div>
        <div className="recipe-list">
          {recipes.map(([title, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="health" className="section band split">
        <div>
          <p className="eyebrow">Health experiments</p>
          <h2>What I am testing gently</h2>
          <p>
            The goal is consistency, energy, and strength, not perfection. This section can become a small habit lab.
          </p>
        </div>
        <div className="habit-board" aria-label="Health experiments">
          {healthHabits.map(([title, body]) => (
            <div key={title}>
              <strong>{title}</strong>
              <span>{body}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="work" className="section">
        <SectionHeading eyebrow="Work front" title="How I learn while working" />
        <div className="work-grid">
          {workLessons.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="resume" className="section resume">
        <div className="resume-panel">
          <div>
            <p className="eyebrow">Resume-style snapshot</p>
            <h2>Frontend engineer with release and leadership depth</h2>
            <p>
              React and frontend SME with experience across enterprise clients, application architecture, release
              automation, portfolio management, and team leadership.
            </p>
          </div>
          <dl className="snapshot">
            <div>
              <dt>Core skills</dt>
              <dd>React, Angular, Node APIs, HTML5, CSS, Highcharts, code review</dd>
            </div>
            <div>
              <dt>Systems</dt>
              <dd>GitHub Actions, release automation, IBM portfolio management</dd>
            </div>
            <div>
              <dt>Clients</dt>
              <dd>American Express, Visa, Zynga, Ladbrokes, Harman, Blue Nile, Quikr</dd>
            </div>
            <div>
              <dt>Education</dt>
              <dd>B.E. Information Science, VTU, Sapthagiri College of Engineering, Bangalore</dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}

function ReactLabPage() {
  return (
    <main>
      <PageHero
        eyebrow="React learning lab"
        title="Tricky React Compiler concepts I am mastering"
        copy="A focused page for the concepts, examples, and interview questions I am collecting while learning modern React, compiler-friendly patterns, hooks, rendering behavior, and performance."
        actions={
          <>
            <ScrollButton target="concepts">
              Concepts
            </ScrollButton>
            <ScrollButton target="questions" variant="secondary">
              Interview questions
            </ScrollButton>
          </>
        }
      />

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

function AiLearningPage() {
  return (
    <main>
      <PageHero
        eyebrow="AI learning"
        title="How I am learning AI by building agents"
        copy="A page for my AI notes, experiments, voice-agent learnings, prompt iterations, and the Bolna agent I have developed."
        actions={
          <>
            <ScrollButton target="bolna-agent">
              Bolna agent
            </ScrollButton>
            <ScrollButton target="ai-notes" variant="secondary">
              Learning notes
            </ScrollButton>
          </>
        }
      />

      <section id="ai-notes" className="section">
        <SectionHeading eyebrow="Learning map" title="What I am studying in AI" />
        <div className="learning-grid">
          {aiLearning.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="bolna-agent" className="section band split">
        <div>
          <p className="eyebrow">Project spotlight</p>
          <h2>Bolna agent</h2>
          <p>
            This area is designed for the agent you developed: what problem it solves, how it works, what you learned,
            and where someone can see the demo or code.
          </p>
        </div>
        <div className="note-stack">
          {bolnaNotes.map(([title, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeading eyebrow="AI interview/story bank" title="Questions I want to answer well" />
        <div className="work-grid">
          <article>
            <h3>How does the agent decide what to do next?</h3>
            <p>Use this to explain intent, context, tool calls, fallback behavior, and conversation state.</p>
          </article>
          <article>
            <h3>How do I evaluate quality?</h3>
            <p>Track success criteria: accuracy, latency, tone, recovery from unclear input, and user completion.</p>
          </article>
          <article>
            <h3>What would I improve next?</h3>
            <p>Add next steps such as better observability, prompt versioning, guardrails, memory, or integration depth.</p>
          </article>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [route, setRoute] = useState(getRoute);
  const page = useMemo(() => {
    if (route === "/react") return <ReactLabPage />;
    if (route === "/ai") return <AiLearningPage />;
    return <HomePage />;
  }, [route]);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [route]);

  return (
    <>
      <Header route={route} />
      {page}
      <footer className="footer">
        <p>Built as a living page for Mansi Gupta.</p>
        <a href="#/">Back home</a>
      </footer>
    </>
  );
}

export default App;
