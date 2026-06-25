import { useEffect, useMemo, useState } from "react";

const pageLinks = [
  ["Home", "#/"],
  ["Little Human", "#/little-human"],
  ["Resume", "#/resume"],
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
  ["Little human", "Most of my time goes into raising, observing, and gently shaping her thoughts and everyday world."],
  ["Food", "Trying nourishing recipes that are practical, flavorful, and easy to repeat."],
  ["Health", "Testing small routines around movement, hydration, sleep, strength, and energy."],
  ["Work", "Learning through frontend architecture, automation, release systems, and better team practices."],
  ["Reflection", "Collecting lessons from everyday decisions, career chapters, and personal experiments."],
];

const littleHumanLessons = [
  ["Language", "Helping her name feelings, ask questions, and turn tiny observations into confidence."],
  ["Values", "Teaching kindness, courage, patience, curiosity, and the quiet strength of trying again."],
  ["Routines", "Building everyday rhythms around food, sleep, play, learning, and calm transitions."],
  ["Wonder", "Protecting the imagination and joy that make childhood feel expansive."],
];

const littleHumanRhythms = [
  {
    title: "Tiny conversations",
    body: "Making space for her questions, half-formed thoughts, stories, fears, and funny observations.",
  },
  {
    title: "Emotional vocabulary",
    body: "Helping her understand that feelings are information, not something to hide or fear.",
  },
  {
    title: "Everyday independence",
    body: "Letting her try, choose, help, fail safely, and feel the pride of doing small things herself.",
  },
  {
    title: "Home as a classroom",
    body: "Using food, books, walks, play, chores, and ordinary days as places where learning naturally happens.",
  },
];

const littleHumanQuestions = [
  "What kind of inner voice am I helping her build?",
  "Did she feel heard today?",
  "Where can I give her more choice without overwhelming her?",
  "What am I modeling through my own reactions?",
  "What story about herself is she learning from this moment?",
  "How do I protect her wonder while teaching resilience?",
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

const resumeSkills = [
  "React Microfrontends & UI Architecture",
  "GitHub Actions & Release Automation",
  "Portfolio & Release Management",
  "Cross-team Delivery Leadership",
  "AI-driven Workflow Optimization",
  "GitHub Copilot & AI Agents",
  "AI-driven Issue Prediction",
  "IBM ICA Testcase POC",
  "React",
  "Angular",
  "Node API development",
  "Code Review",
  "HTML5",
  "CSS",
  "BackboneJS",
  "PHP",
  "LAMP Stack",
];

const resumeExperience = [
  {
    period: "2018 - Present",
    company: "IBM Consulting",
    role: "Frontend and React SME | Team Leader | Application Architect",
    highlights: [
      "Frontend Engineer focused on portfolio and release management, release automation, and GitHub Actions.",
      "Led React microfrontend work across enterprise servicing portals and OneApp experiences.",
      "Worked on AI-driven workflow optimization, issue prediction, GitHub Copilot, AI agents, and IBM ICA testcase POC.",
    ],
    projects: [
      "American Express Client",
      "ISP Intuitive Servicing Portal | Sep 2024 - May 2026",
      "GSCT-Fraud Servicing | Mar 2023 - Aug 2024",
      "Corporate Card | AtWork Insights Hub | Sep 2022 - Feb 2023",
      "Value Generation Project | Oct 2018 - Aug 2022",
    ],
  },
  {
    period: "2012 - 2018",
    company: "Aditi Technologies",
    role: "React | Angular | Node API dev | Team Leader | Code Reviewer",
    highlights: [
      "Built frontend and API experiences across client-facing applications.",
      "Contributed as team lead and code reviewer across React, Angular, and Node work.",
    ],
    projects: [
      "Visa Inc Pvt Limited",
      "CloudView Visa Cloud & Helpservice for CloudView",
      "TLCM - Visa Token Lifecycle Management",
      "VDCS - Visa Digital Conf",
    ],
  },
  {
    period: "2011 - 2012",
    company: "Tavant Technologies",
    role: "HTML5 | CSS | BackboneJS | Mobile WebApp dev | Responsive UI",
    highlights: ["Worked across responsive UI, HTML5, CSS, BackboneJS, and mobile web application development."],
    projects: [
      "Zynga Client",
      "Ladbrokes Client | Gaming and Betting",
      "Quikr Client - Quikr Cars",
      "Blue Nile Client - https://www.bluenile.com/",
      "Harman Client | Harman Connected Cars",
    ],
  },
  {
    period: "2007 - 2011",
    company: "Tally India Pvt Limited",
    role: "PHP Developer | LAMP Stack Developer | Facebook Game Dev",
    highlights: ["Joined as a PHP developer and built early experience in LAMP stack and game/web development."],
    projects: ["LAMP Stack Developer", "PHP Developer", "Facebook Game Dev"],
  },
];

const resumeEducation = [
  {
    degree: "Bachelor of Engineering (B.E.) in Information Science",
    school: "Visvesvaraya Technological University (VTU) | Sapthagiri College of Engineering, Bangalore",
    year: "2006",
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

const aiProjects = [
  {
    title: "Vedantu Ananya",
    body: "A hosted AI learning experiment connected to the education and assistant-building direction I am exploring.",
    link: "https://vedantu-ananya-nine.vercel.app/",
  },
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
              <span>Currently</span> Raising a little human, frontend engineering, release automation, and healthier routines
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

      <section className="section split little-human-feature">
        <div>
          <p className="eyebrow">Where my time goes</p>
          <h2>Building a little human</h2>
          <p>
            A lot of my life is spent shaping her world: the words she hears, the questions she asks, the way she sees
            herself, and the kind of thoughts she learns to trust.
          </p>
          <div className="section-actions">
            <a className="button primary dark" href="#/little-human">
              Open little human page
            </a>
          </div>
        </div>
        <div className="habit-board" aria-label="Little human lessons">
          {littleHumanLessons.map(([title, body]) => (
            <div key={title}>
              <strong>{title}</strong>
              <span>{body}</span>
            </div>
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

function LittleHumanPage() {
  return (
    <main>
      <PageHero
        eyebrow="Where my time goes"
        title="Building a little human"
        copy="This is the page for the work that does not always look like work: shaping her thoughts, language, confidence, routines, imagination, and the way she learns to move through the world."
        actions={
          <>
            <ScrollButton target="weekend-picks">Weekend picks</ScrollButton>
            <ScrollButton target="explore" variant="secondary">
              Explore for her
            </ScrollButton>
          </>
        }
      />

      <section className="section split">
        <div>
          <p className="eyebrow">Motherhood as learning</p>
          <h2>Most of my attention is here</h2>
          <p>
            I am learning how to be present, how to explain the world simply, how to notice what she is becoming, and
            how to create a home where her thoughts feel safe enough to grow.
          </p>
        </div>
        <div className="note-stack">
          <article>
            <h3>What I am shaping</h3>
            <p>Her confidence, curiosity, kindness, emotional language, and sense of self.</p>
          </article>
          <article>
            <h3>What I am practicing</h3>
            <p>Patience, consistency, softer communication, repair after hard moments, and better listening.</p>
          </article>
          <article>
            <h3>What I want her to know</h3>
            <p>She is loved, capable, allowed to ask, allowed to try, and strong enough to begin again.</p>
          </article>
        </div>
      </section>

      <section id="rhythms" className="section band">
        <SectionHeading eyebrow="Daily rhythms" title="The small places where shaping happens" />
        <div className="learning-grid">
          {littleHumanRhythms.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section split">
        <div>
          <p className="eyebrow">Things I want to collect</p>
          <h2>Books, activities, stories, and little wins</h2>
          <p>
            This can become a living log of what we read, recipes we make together, questions she asks, habits we are
            building, and small moments I do not want to forget.
          </p>
        </div>
        <div className="habit-board" aria-label="Little human collections">
          <div>
            <strong>Books</strong>
            <span>Stories that teach language, courage, humor, empathy, and imagination.</span>
          </div>
          <div>
            <strong>Activities</strong>
            <span>Art, pretend play, kitchen help, counting games, nature walks, and tiny projects.</span>
          </div>
          <div>
            <strong>Questions</strong>
            <span>The surprising things she asks that show how her mind is organizing the world.</span>
          </div>
          <div>
            <strong>Memories</strong>
            <span>Small phrases, habits, milestones, and ordinary moments that become precious later.</span>
          </div>
        </div>
      </section>

      <section id="questions" className="section">
        <SectionHeading eyebrow="Reflection bank" title="Questions I keep returning to" />
        <ol className="question-list">
          {littleHumanQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </section>

      <section id="explore" className="section">
        <SectionHeading eyebrow="Bangalore · Urbanaut + BookMyShow" title="Explore for her" />
        <p style={{ maxWidth: 560, margin: "0 auto 40px", textAlign: "center", color: "var(--muted)" }}>
          Curated real-world experiences in Bangalore that build something in her — not just fill a weekend.
        </p>
        <ExploreForHer />
      </section>

      <section id="weekend-picks" className="section band">
        <SectionHeading eyebrow="This weekend · Pedagogy-matched" title="Weekend picks for her" />
        <p style={{ maxWidth: 560, margin: "0 auto 32px", textAlign: "center", color: "var(--muted)" }}>
          Ranked by how well each event aligns with your school's philosophy and what she's responded to before. Free events can be registered directly.
        </p>
        <WeekendPicks />
      </section>

      <section id="child-compass" className="section band">
        <SectionHeading eyebrow="School + age" title="Child Compass" />
        <p style={{ maxWidth: 540, margin: "0 auto 32px", textAlign: "center", color: "var(--muted)" }}>
          Enter your child's age and school philosophy to see what's unfolding in her world — and what a mom and dad each need to pay attention to this year.
        </p>
        <ChildCompass />
      </section>
    </main>
  );
}

function ResumePage() {
  return (
    <main>
      <PageHero
        eyebrow="Resume converted from PDF"
        title="Frontend engineer, release automation lead, and AI workflow learner"
        copy="A readable web version of my resume: frontend architecture, React microfrontends, release systems, team leadership, enterprise clients, and the AI experiments I am now folding into my work."
        actions={
          <>
            <ScrollButton target="resume-experience">Experience</ScrollButton>
            <ScrollButton target="resume-skills" variant="secondary">
              Skills
            </ScrollButton>
          </>
        }
      />

      <section className="section resume-intro">
        <div className="resume-card hero-resume-card">
          <div>
            <p className="eyebrow">Mansi Gupta</p>
            <h2>Frontend Engineer | Portfolio & Release Management | Release Automation | GitHub Actions</h2>
            <p>
              Frontend and React SME with experience across IBM Consulting, American Express, Visa, Aditi, Tavant,
              Tally, and multiple client delivery contexts.
            </p>
          </div>
          <dl className="resume-contact">
            <div>
              <dt>Email</dt>
              <dd>
                <a href="mailto:mansisce@gmail.com">mansisce@gmail.com</a>
              </dd>
            </div>
            <div>
              <dt>Education</dt>
              <dd>B.E. Information Science, VTU, 2006</dd>
            </div>
            <div>
              <dt>Current themes</dt>
              <dd>React microfrontends, release automation, AI agents, workflow optimization</dd>
            </div>
          </dl>
        </div>
      </section>

      <section id="resume-skills" className="section band">
        <SectionHeading eyebrow="Skills" title="Technical and leadership strengths" />
        <div className="skill-cloud">
          {resumeSkills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      </section>

      <section id="resume-experience" className="section">
        <SectionHeading eyebrow="Experience" title="Center timeline from my resume" />
        <div className="visual-timeline" aria-label="Resume experience timeline">
          {resumeExperience.map((item, index) => (
            <article className={`timeline-node ${index % 2 === 0 ? "left" : "right"}`} key={`${item.company}-${item.period}`}>
              <div className="timeline-marker">
                <span>{item.period.split(" ")[0]}</span>
              </div>
              <div className="resume-card timeline-card">
                <div className="resume-card-header">
                  <time>{item.period}</time>
                  <div>
                    <h3>{item.company}</h3>
                    <p>{item.role}</p>
                  </div>
                </div>
                <ul className="resume-list">
                  {item.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
                <div className="project-tags" aria-label={`${item.company} projects`}>
                  {item.projects.map((project) => (
                    <span key={project}>{project}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section band">
        <SectionHeading eyebrow="Education" title="Academic foundation" />
        <div className="learning-grid">
          {resumeEducation.map((item) => (
            <article key={item.degree}>
              <h3>{item.degree}</h3>
              <p>{item.school}</p>
              <p className="resume-year">{item.year}</p>
            </article>
          ))}
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
        <SectionHeading eyebrow="AI builds" title="Projects and demos I am attaching here" />
        <div className="learning-grid">
          {aiProjects.map((project) => (
            <article key={project.title}>
              <h3>{project.title}</h3>
              <p>{project.body}</p>
              <a className="text-link" href={project.link} target="_blank" rel="noreferrer">
                Open project
              </a>
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

// ─── Weekend Picks — Recommendation Engine ─────────────────────────────────────

// Pedagogy pillars per school — events are scored by overlap with these tags
const SCHOOL_PILLARS = {
  // Anweshana Montessori: head-heart-hands, self-formation, intrinsic motivation
  montessori: [
    "hands-on", "self-directed", "practical-life", "sensorial", "nature-connection",
    "real-tools", "mixed-age", "independence", "no-competition", "intrinsic-motivation",
    "self-discipline", "eco-friendly", "joyful-learning", "freedom-with-responsibility",
    "prepared-environment", "self-formation",
  ],
  // Centre for Learning (CFL): Krishnamurti-rooted, inquiry, silence, relationship
  cfl: [
    "inquiry", "silence", "nature-connection", "self-knowledge", "dialogue",
    "no-competition", "inner-life", "open-ended", "ecological", "attention",
    "freedom-with-responsibility", "relationship", "choiceless-awareness",
  ],
  // JK Krishnamurti schools (Valley School, The School KFI): inner transformation, holistic human
  jk: [
    "inner-transformation", "freedom-from-authority", "holistic-human", "sensitivity",
    "self-knowledge", "no-competition", "no-comparison", "nature-connection", "ecological",
    "community", "questioning-mind", "choiceless-awareness", "silence", "goodness-ethics",
    "relationship", "intelligence-awakening", "inquiry", "open-ended",
  ],
  // Creative School & Valley School overlap pillars
  valley: ["arts", "ecological", "nature-connection", "mixed-age", "dialogue", "music", "pottery", "heritage", "self-directed"],
  creative: ["whole-child", "emotional", "spiritual", "creative-freedom", "small-group", "eco-friendly", "sensory", "expressive", "story"],
};

// The 3 schools we score against simultaneously
const ACTIVE_SCHOOLS = ["montessori", "cfl", "jk"];

// Master event catalogue — each event tagged with pedagogy pillars it aligns with
// recurring: true means "this program runs every weekend — check venue link for exact timings this week"
const EVENT_CATALOGUE = [

  // ── PERFORMING ARTS ───────────────────────────────────────────────────────
  {
    id: "ranga-shankara-weekend",
    name: "Children's Theatre Weekend",
    provider: "Ranga Shankara",
    venue: "JP Nagar 2nd Phase, Bangalore",
    area: "Story & Culture",
    free: false, cost: "₹100–₹250",
    source: "Ranga Shankara",
    registrationUrl: "https://rangashankara.org/events/",
    date: "sat", time: "3:30 PM – 5:30 PM",
    recurring: true,
    pedagogyTags: ["story", "aesthetic-sense", "imagination", "dialogue", "community", "hundred-languages", "creative-expression"],
    builds: ["Empathy through story", "Cultural literacy", "Attention & imagination"],
    ageMin: 4, venueZone: "south",
  },
  {
    id: "ranga-shankara-sunday",
    name: "Family Play — Sunday Matinee",
    provider: "Ranga Shankara",
    venue: "JP Nagar 2nd Phase, Bangalore",
    area: "Story & Culture",
    free: false, cost: "₹100–₹250",
    source: "Ranga Shankara",
    registrationUrl: "https://rangashankara.org/events/",
    date: "sun", time: "3:30 PM – 5:30 PM",
    recurring: true,
    pedagogyTags: ["story", "aesthetic-sense", "imagination", "dialogue", "community", "hundred-languages"],
    builds: ["Narrative comprehension", "Aesthetic sensitivity", "Language richness"],
    ageMin: 4, venueZone: "south",
  },
  {
    id: "chowdiah-classical",
    name: "Family Classical Music Concert",
    provider: "Chowdiah Memorial Hall",
    venue: "Vyalikaval, Bangalore",
    area: "Music & Movement",
    free: false, cost: "₹100–₹500",
    source: "Chowdiah / BookMyShow",
    registrationUrl: "https://www.chowdiahmemorialhall.com/",
    date: "sat", time: "6:00 PM – 8:00 PM",
    recurring: true,
    pedagogyTags: ["sensitivity", "inner-life", "silence", "holistic-human", "joyful-learning", "relationship", "aesthetic-sense"],
    builds: ["Listening depth", "Aesthetic sense", "Cultural grounding"],
    ageMin: 5, venueZone: "central",
  },
  {
    id: "attakkalari-workshop",
    name: "Movement & Dance Workshop",
    provider: "Attakkalari Centre for Movement Arts",
    venue: "Lavelle Road, Bangalore",
    area: "Music & Movement",
    free: false, cost: "₹500–₹800",
    source: "Attakkalari",
    registrationUrl: "https://www.attakkalari.org/",
    date: "sat", time: "10:00 AM – 12:00 PM",
    recurring: true,
    pedagogyTags: ["physical-development", "embodied-learning", "expression", "hundred-languages", "movement", "creative-freedom"],
    builds: ["Body awareness", "Rhythmic intelligence", "Creative expression"],
    ageMin: 5, venueZone: "central",
  },
  {
    id: "spic-macay-concert",
    name: "SPIC MACAY — Indian Classical Heritage",
    provider: "SPIC MACAY Bangalore Chapter",
    venue: "Various venues, Bangalore",
    area: "Music & Movement",
    free: true, cost: "Free",
    source: "SPIC MACAY",
    registrationUrl: "https://spicmacay.com/chapter/bangalore",
    date: "sun", time: "10:00 AM – 1:00 PM",
    recurring: true,
    pedagogyTags: ["sensitivity", "cultural-roots", "holistic-human", "inner-life", "silence", "heritage", "aesthetic-sense"],
    builds: ["Cultural identity", "Classical art exposure", "Deep listening"],
    ageMin: 6, venueZone: "central",
  },

  // ── POTTERY & CRAFTS ──────────────────────────────────────────────────────
  {
    id: "golden-bridge-pottery",
    name: "Golden Bridge Pottery — Weekend Session",
    provider: "Golden Bridge Pottery / Coro",
    venue: "Indiranagar, Bangalore",
    area: "Creative & Making",
    free: false, cost: "₹1,200–₹1,800",
    source: "Urbanaut",
    registrationUrl: "https://urbanaut.app/spot/coro-commons",
    date: "sat", time: "9:00 AM – 11:00 AM",
    recurring: true,
    pedagogyTags: ["hands-on", "practical-life", "real-tools", "tactile", "self-paced", "making", "concentration"],
    builds: ["Fine motor skills", "Patience & focus", "Creative problem-solving"],
    ageMin: 4, venueZone: "east",
  },
  {
    id: "pottery-sunday",
    name: "Family Pottery Afternoon",
    provider: "Golden Bridge Pottery / Coro",
    venue: "Indiranagar, Bangalore",
    area: "Creative & Making",
    free: false, cost: "₹1,200–₹1,800",
    source: "Urbanaut",
    registrationUrl: "https://urbanaut.app/spot/coro-commons",
    date: "sun", time: "2:00 PM – 4:00 PM",
    recurring: true,
    pedagogyTags: ["hands-on", "practical-life", "real-tools", "tactile", "making", "concentration"],
    builds: ["Tactile intelligence", "Sustained attention", "Pride in making"],
    ageMin: 4, venueZone: "east",
  },
  {
    id: "bcc-workshop",
    name: "Craft & Sustainability Workshop",
    provider: "Bangalore Creative Circus",
    venue: "Domlur, Bangalore",
    area: "Creative & Making",
    free: false, cost: "₹600–₹900",
    source: "Urbanaut",
    registrationUrl: "https://urbanaut.app/spot/bangalore-creative-circus-3207",
    date: "sat", time: "11:00 AM – 1:00 PM",
    recurring: true,
    pedagogyTags: ["hands-on", "ecological", "practical-life", "making", "real-tools", "upcycling"],
    builds: ["Eco-awareness", "Making from materials", "Creative resourcefulness"],
    ageMin: 5, venueZone: "east",
  },

  // ── MUSEUMS & SCIENCE ─────────────────────────────────────────────────────
  {
    id: "map-workshop",
    name: "Kids Art Workshop — MAP",
    provider: "Museum of Art & Photography (MAP)",
    venue: "Kasturba Road, Bangalore",
    area: "Creative & Making",
    free: false, cost: "₹400–₹700",
    source: "MAP",
    registrationUrl: "https://map.cumulus.co.in/events/",
    date: "sat", time: "10:30 AM – 12:30 PM",
    recurring: true,
    pedagogyTags: ["aesthetic-sense", "hundred-languages", "art-studio", "creative-expression", "documentation", "visual-thinking"],
    builds: ["Visual thinking", "Artistic vocabulary", "Creative confidence"],
    ageMin: 5, venueZone: "central",
  },
  {
    id: "map-trail",
    name: "Family Gallery Trail — MAP",
    provider: "Museum of Art & Photography (MAP)",
    venue: "Kasturba Road, Bangalore",
    area: "Story & Culture",
    free: false, cost: "₹100–₹300",
    source: "MAP",
    registrationUrl: "https://map.cumulus.co.in/visit/",
    date: "sun", time: "11:00 AM – 1:00 PM",
    recurring: true,
    pedagogyTags: ["aesthetic-sense", "cultural-roots", "visual-thinking", "questioning-mind", "documentation", "inquiry"],
    builds: ["Art appreciation", "Observational skills", "Cultural awareness"],
    ageMin: 4, venueZone: "central",
  },
  {
    id: "planetarium-show",
    name: "Sky Show — Jawaharlal Nehru Planetarium",
    provider: "Jawaharlal Nehru Planetarium",
    venue: "Raj Bhavan Road, Bangalore",
    area: "Nature & Science",
    free: false, cost: "₹40–₹80",
    source: "Planetarium",
    registrationUrl: "https://www.taralaya.org/",
    date: "sat", time: "2:30 PM – 3:30 PM",
    recurring: true,
    pedagogyTags: ["inquiry", "questioning-mind", "science-wonder", "ecological", "joyful-learning", "real-world"],
    builds: ["Scientific curiosity", "Wonder & awe", "Astronomy basics"],
    ageMin: 5, venueZone: "central",
  },
  {
    id: "ncbs-open-day",
    name: "Science Open Day for Families",
    provider: "NCBS (National Centre for Biological Sciences)",
    venue: "GKVK Campus, Hebbal, Bangalore",
    area: "Nature & Science",
    free: true, cost: "Free",
    source: "NCBS",
    registrationUrl: "https://www.ncbs.res.in/outreach/",
    date: "sun", time: "10:00 AM – 1:00 PM",
    recurring: false,
    pedagogyTags: ["inquiry", "questioning-mind", "ecological", "real-tools", "science-wonder", "hands-on"],
    builds: ["Scientific thinking", "Research exposure", "Nature literacy"],
    ageMin: 7, venueZone: "north",
  },

  // ── STORIES & BOOKS ───────────────────────────────────────────────────────
  {
    id: "atta-galatta-story",
    name: "Storytelling & Puppet Show",
    provider: "Atta Galatta",
    venue: "Koramangala, Bangalore",
    area: "Story & Culture",
    free: false, cost: "₹200–₹350",
    source: "Atta Galatta",
    registrationUrl: "https://attagalatta.com/events/",
    date: "sat", time: "11:00 AM – 12:30 PM",
    recurring: true,
    pedagogyTags: ["story", "imagination", "oral-tradition", "relationship", "language", "hundred-languages"],
    builds: ["Narrative imagination", "Language richness", "Empathy"],
    ageMin: 3, venueZone: "south-east",
  },
  {
    id: "atta-galatta-bookclub",
    name: "Kids Book Club",
    provider: "Atta Galatta",
    venue: "Koramangala, Bangalore",
    area: "Story & Culture",
    free: false, cost: "₹200",
    source: "Atta Galatta",
    registrationUrl: "https://attagalatta.com/events/",
    date: "sun", time: "11:00 AM – 12:30 PM",
    recurring: true,
    pedagogyTags: ["story", "dialogue", "reading", "community", "language", "relationship"],
    builds: ["Reading stamina", "Critical thinking", "Community of readers"],
    ageMin: 6, venueZone: "south-east",
  },
  {
    id: "story-walk-indiranagar",
    name: "Story Walk Through Indiranagar",
    provider: "Bangalore Storytelling Society",
    venue: "Indiranagar, Bangalore",
    area: "Story & Culture",
    free: true, cost: "Free",
    source: "Urbanaut",
    registrationUrl: "https://urbanaut.app/spot/a-story-walk-through-indiranagar-bangalore",
    date: "sun", time: "8:00 AM – 9:30 AM",
    recurring: true,
    pedagogyTags: ["story", "heritage", "neighbourhood", "oral-tradition", "walking", "community"],
    builds: ["Sense of place", "Listening & narrative", "Urban awareness"],
    ageMin: 5, venueZone: "east",
  },

  // ── NATURE & OUTDOORS ─────────────────────────────────────────────────────
  {
    id: "nature-trail-cubbon",
    name: "Kids Nature Trail — Cubbon Park",
    provider: "Nature Bangalore / Gubbi Labs",
    venue: "Cubbon Park, Bangalore",
    area: "Nature & Science",
    free: true, cost: "Free",
    source: "Meetup",
    registrationUrl: "https://www.meetup.com/find/events/?keywords=nature+kids+cubbon&location=Bangalore%2C+India",
    date: "sun", time: "7:00 AM – 9:00 AM",
    recurring: true,
    pedagogyTags: ["ecological", "sensory", "nature-connection", "outdoor-learning", "observation", "place-based"],
    builds: ["Ecological literacy", "Observation skills", "Love of nature"],
    ageMin: 4, venueZone: "central",
  },
  {
    id: "looroo-play",
    name: "Theme-Based Playdate — Looroo",
    provider: "The Looroo Club",
    venue: "Indiranagar, Bangalore",
    area: "Outdoor & Active",
    free: false, cost: "₹600–₹900",
    source: "Urbanaut",
    registrationUrl: "https://urbanaut.app/featured-forkids/summer-activities",
    date: "sat", time: "10:00 AM – 12:00 PM",
    recurring: true,
    pedagogyTags: ["outdoor-learning", "child-led", "sensory", "nature-connection", "free-play", "social"],
    builds: ["Social confidence", "Physical literacy", "Imaginative play"],
    ageMin: 2, venueZone: "east",
  },
  {
    id: "farmers-market",
    name: "Organic Farmers Market & Kids Corner",
    provider: "Farmers Market Bangalore",
    venue: "UB City / Hebbal Lake, Bangalore",
    area: "Nature & Science",
    free: true, cost: "Free",
    source: "Farmers Market",
    registrationUrl: "https://www.farmersmarketbangalore.com/",
    date: "sun", time: "8:00 AM – 12:00 PM",
    recurring: true,
    pedagogyTags: ["practical-life", "ecological", "community", "real-world", "sensory", "hands-on"],
    builds: ["Food awareness", "Community connection", "Economic understanding"],
    ageMin: 2, venueZone: "central",
  },
  {
    id: "heritage-walk",
    name: "Bangalore Heritage Walk",
    provider: "Bangalore Walks / INTACH",
    venue: "Pete area / Basavanagudi, Bangalore",
    area: "Story & Culture",
    free: false, cost: "₹250–₹400",
    source: "Bangalore Walks",
    registrationUrl: "https://www.bangalorewalks.com/",
    date: "sun", time: "7:00 AM – 9:30 AM",
    recurring: true,
    pedagogyTags: ["heritage", "cultural-roots", "place-based", "history", "community", "story"],
    builds: ["Sense of history", "Cultural identity", "Observation in the city"],
    ageMin: 6, venueZone: "old-city",
  },
  {
    id: "rock-climbing",
    name: "Kids Rock Climbing — Cliffhanger",
    provider: "Cliffhanger Climbing Gym",
    venue: "Koramangala, Bangalore",
    area: "Outdoor & Active",
    free: false, cost: "₹400–₹600",
    source: "Cliffhanger",
    registrationUrl: "https://www.cliffhangerbangalore.com/",
    date: "sat", time: "10:00 AM – 12:00 PM",
    recurring: true,
    pedagogyTags: ["physical-development", "risk-taking", "resilience", "embodied-learning", "challenge", "outdoor-learning"],
    builds: ["Physical confidence", "Risk assessment", "Grit and persistence"],
    ageMin: 7, venueZone: "south-east",
  },

  // ── MUSIC & MOVEMENT ─────────────────────────────────────────────────────
  {
    id: "tabla-music",
    name: "Introduction to Tabla & Indian Percussion",
    provider: "Saptak School of Music / Various",
    venue: "Basavanagudi, Bangalore",
    area: "Music & Movement",
    free: false, cost: "₹300–₹500",
    source: "insider.in",
    registrationUrl: "https://insider.in/bangalore/music",
    date: "sun", time: "10:00 AM – 11:30 AM",
    recurring: true,
    pedagogyTags: ["sensitivity", "cultural-roots", "rhythm", "discipline", "inner-life", "heritage"],
    builds: ["Rhythmic intelligence", "Cultural grounding", "Concentration"],
    ageMin: 6, venueZone: "old-city",
  },
  {
    id: "music-morning",
    name: "Family Music Morning",
    provider: "Jagriti / Various Bangalore venues",
    venue: "Whitefield, Bangalore",
    area: "Music & Movement",
    free: false, cost: "₹300–₹600",
    source: "insider.in",
    registrationUrl: "https://insider.in/bangalore/music",
    date: "sat", time: "10:00 AM – 11:30 AM",
    recurring: true,
    pedagogyTags: ["sensitivity", "community", "hundred-languages", "joyful-learning", "rhythm", "inner-life"],
    builds: ["Musical ear", "Shared experience", "Joyful expression"],
    ageMin: 3, venueZone: "east-far",
  },

  // ── LEARNING & WORKSHOPS ──────────────────────────────────────────────────
  {
    id: "chess-kids",
    name: "Kids Chess Club",
    provider: "Bangalore Chess Academy",
    venue: "Koramangala / Indiranagar, Bangalore",
    area: "Games & Strategy",
    free: false, cost: "₹200–₹400",
    source: "Meetup",
    registrationUrl: "https://www.meetup.com/find/events/?keywords=kids+chess+bangalore&location=Bangalore%2C+India",
    date: "sun", time: "10:00 AM – 12:00 PM",
    recurring: true,
    pedagogyTags: ["reasoning", "patience", "strategy", "self-regulation", "focus", "discipline"],
    builds: ["Strategic thinking", "Patience & focus", "Sportsmanship"],
    ageMin: 6, venueZone: "south-east",
  },
  {
    id: "creative-writing",
    name: "Young Writers Workshop",
    provider: "The Writer's Workshop Bangalore",
    venue: "Koramangala, Bangalore",
    area: "Story & Culture",
    free: false, cost: "₹500–₹800",
    source: "Eventbrite",
    registrationUrl: "https://www.eventbrite.co.in/d/india--bangalore/kids-writing/",
    date: "sat", time: "10:00 AM – 12:00 PM",
    recurring: true,
    pedagogyTags: ["story", "expression", "language", "imagination", "dialogue", "self-knowledge"],
    builds: ["Written expression", "Story structure", "Confidence in voice"],
    ageMin: 8, venueZone: "south-east",
  },
  {
    id: "robotics-tinkering",
    name: "Robotics & Tinkering Lab",
    provider: "Maker's Asylum / TinkerHub Bangalore",
    venue: "Indiranagar, Bangalore",
    area: "Nature & Science",
    free: false, cost: "₹600–₹1,000",
    source: "Meetup",
    registrationUrl: "https://www.meetup.com/find/events/?keywords=kids+robotics+bangalore&location=Bangalore%2C+India",
    date: "sat", time: "11:00 AM – 1:00 PM",
    recurring: true,
    pedagogyTags: ["hands-on", "inquiry", "real-tools", "problem-solving", "making", "self-directed"],
    builds: ["Computational thinking", "Making & iteration", "Problem-solving"],
    ageMin: 8, venueZone: "east",
  },
  {
    id: "improv-theatre",
    name: "Improv Theatre for Kids & Teens",
    provider: "Jagriti Theatre / The Improv Company",
    venue: "Whitefield, Bangalore",
    area: "Story & Culture",
    free: false, cost: "₹500–₹700",
    source: "insider.in",
    registrationUrl: "https://insider.in/bangalore/workshops",
    date: "sun", time: "3:00 PM – 5:00 PM",
    recurring: true,
    pedagogyTags: ["expression", "community", "dialogue", "risk-taking", "self-knowledge", "hundred-languages"],
    builds: ["Confidence", "Quick thinking", "Empathy through play"],
    ageMin: 9, venueZone: "east-far",
  },
  {
    id: "cooking-science",
    name: "Kitchen Science & Food Chemistry",
    provider: "Various Bangalore schools / workshops",
    venue: "Koramangala, Bangalore",
    area: "Nature & Science",
    free: false, cost: "₹500–₹800",
    source: "Eventbrite",
    registrationUrl: "https://www.eventbrite.co.in/d/india--bangalore/kids-science/",
    date: "sat", time: "11:00 AM – 1:00 PM",
    recurring: true,
    pedagogyTags: ["hands-on", "inquiry", "practical-life", "real-tools", "science-wonder", "questioning-mind"],
    builds: ["Science curiosity", "Kitchen independence", "Understanding chemistry through food"],
    ageMin: 7, venueZone: "south-east",
  },
  {
    id: "debate-young",
    name: "Young Thinkers Debate Forum",
    provider: "Bangalore Debate Academy",
    venue: "Indiranagar, Bangalore",
    area: "Games & Strategy",
    free: false, cost: "₹300–₹500",
    source: "Meetup",
    registrationUrl: "https://www.meetup.com/find/events/?keywords=debate+teens+bangalore&location=Bangalore%2C+India",
    date: "sat", time: "10:00 AM – 12:30 PM",
    recurring: true,
    pedagogyTags: ["reasoning", "dialogue", "self-expression", "questioning-mind", "community", "self-knowledge"],
    builds: ["Critical thinking", "Public speaking", "Evidence-based reasoning"],
    ageMin: 10, venueZone: "east",
  },
];

// Score an event against a single school's pillars (0–100)
function scoreAgainstSchool(event, schoolKey) {
  const pillars = SCHOOL_PILLARS[schoolKey] || [];
  if (!pillars.length) return 0;
  const overlap = event.pedagogyTags.filter((t) => pillars.includes(t)).length;
  return Math.round((overlap / Math.max(event.pedagogyTags.length, 1)) * 100);
}

// Multi-school score: score against Montessori + CFL + JK, return per-school + combined
function multiSchoolScore(event) {
  const scores = {};
  ACTIVE_SCHOOLS.forEach((s) => { scores[s] = scoreAgainstSchool(event, s); });
  // Combined = weighted average (equal weight)
  const combined = Math.round(ACTIVE_SCHOOLS.reduce((sum, s) => sum + scores[s], 0) / ACTIVE_SCHOOLS.length);
  return { scores, combined };
}

// Full event score: multi-school combined + preference signals + free + age fit + proximity
function scoreEvent(event, schoolKey, liked, dismissed, childAge, pincode) {
  const { combined } = multiSchoolScore(event);

  let preferenceBonus = 0;
  liked.forEach((id) => {
    const prev = EVENT_CATALOGUE.find((e) => e.id === id);
    if (!prev) return;
    const overlap = event.pedagogyTags.filter((t) => prev.pedagogyTags.includes(t)).length;
    preferenceBonus += overlap * 8;
  });

  let preferencePenalty = 0;
  dismissed.forEach((id) => {
    const prev = EVENT_CATALOGUE.find((e) => e.id === id);
    if (!prev) return;
    const overlap = event.pedagogyTags.filter((t) => prev.pedagogyTags.includes(t)).length;
    preferencePenalty += overlap * 6;
  });

  const freeBoost = event.free ? 8 : 0;
  const ageFit = ageSuitabilityScore(event, childAge);
  const proximity = proximityScore(event, pincode);
  return Math.max(0, Math.min(130, combined + freeBoost + ageFit + proximity + preferenceBonus - preferencePenalty));
}

const SCHOOL_LABELS = { montessori: "Montessori", cfl: "CFL", jk: "JK" };
const SCHOOL_COLORS = { montessori: "#2f6f58", cfl: "#315f86", jk: "#7a5c3a" };

// ─── Location proximity ────────────────────────────────────────────────────────
// Bangalore zones + inter-zone travel distance (0=same, 1=close, 2=medium, 3=far)
const ZONE_DISTANCE = {
  central:   { central:0, east:1, "old-city":1, north:1, "south-east":2, south:2, "east-far":3 },
  east:      { central:1, east:0, "old-city":2, north:2, "south-east":1, south:2, "east-far":2 },
  "old-city":{ central:1, east:2, "old-city":0, north:2, "south-east":1, south:1, "east-far":3 },
  north:     { central:1, east:2, "old-city":2, north:0, "south-east":3, south:3, "east-far":3 },
  "south-east":{ central:2, east:1, "old-city":1, north:3, "south-east":0, south:1, "east-far":2 },
  south:     { central:2, east:2, "old-city":1, north:3, "south-east":1, south:0, "east-far":3 },
  "east-far":{ central:3, east:2, "old-city":3, north:3, "south-east":2, south:3, "east-far":0 },
};

// Pincode prefix → zone (first 6 digits)
const PINCODE_ZONE = {
  "560001": "central", "560002": "central", "560003": "central", "560004": "central",
  "560005": "central", "560007": "central", "560009": "central", "560027": "central",
  "560033": "central",
  "560006": "north",   "560008": "north",   "560032": "north",   "560036": "north",
  "560040": "north",   "560043": "north",   "560045": "north",   "560076": "north",
  "560012": "east",    "560013": "east",    "560019": "east",    "560026": "east",
  "560029": "east",    "560031": "east",
  "560010": "old-city","560028": "old-city","560030": "old-city","560041": "old-city",
  "560016": "south-east","560034": "south-east","560071": "south-east","560095": "south-east",
  "560011": "south",   "560017": "south",   "560020": "south",   "560021": "south",
  "560022": "south",   "560024": "south",   "560069": "south",   "560078": "south",
  "560025": "south",
  "560035": "east-far","560037": "east-far","560068": "east-far","560085": "east-far",
  "560087": "east-far","560093": "east-far","560102": "east-far",
  "560103": "south",
};

const ZONE_LABELS = { central:"Central", east:"East / Indiranagar", "old-city":"Old City", north:"North / Hebbal", "south-east":"Koramangala / HSR", south:"South / JP Nagar", "east-far":"Whitefield" };

function pincodeToZone(pin) {
  return PINCODE_ZONE[String(pin).slice(0, 6)] || null;
}

function proximityScore(event, pincode) {
  if (!pincode || !event.venueZone) return 0;
  const userZone = pincodeToZone(pincode);
  if (!userZone) return 0;
  const dist = ZONE_DISTANCE[userZone]?.[event.venueZone] ?? 2;
  return [20, 12, 4, 0][dist] ?? 0;
}

function proximityLabel(event, pincode) {
  if (!pincode || !event.venueZone) return null;
  const userZone = pincodeToZone(pincode);
  if (!userZone) return null;
  const dist = ZONE_DISTANCE[userZone]?.[event.venueZone] ?? 2;
  return ["Nearby", "~30 min", "~45 min", "~60 min+"][dist] ?? null;
}

// Age-fit bonus: rewards events pitched at the child's actual age bracket
function ageSuitabilityScore(event, childAge) {
  if (childAge === "" || childAge == null) return 0;
  const age = Number(childAge);
  const diff = age - event.ageMin; // 0 = perfect bottom-of-range fit
  if (diff <= 2) return 18;  // perfect match (age is at or just above min)
  if (diff <= 4) return 8;   // slightly younger event, still good
  return 0;                  // event designed for much younger kids
}

// Compute actual next-weekend dates dynamically so they're always current
function getWeekendDates() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 6=Sat
  const daysToSat = day === 6 ? 7 : (6 - day); // next Saturday (not today if today is Sat)
  const sat = new Date(today); sat.setDate(today.getDate() + daysToSat);
  const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
  const fmt = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  return { sat: fmt(sat), sun: fmt(sun), satDate: sat, sunDate: sun };
}

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initial; }
    catch { return initial; }
  });
  function update(v) {
    setVal(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }
  return [val, update];
}

const AREA_COLORS = {
  "Creative & Making": "#b94c36",
  "Story & Culture": "#315f86",
  "Nature & Outdoor": "#2f6f58",
  "Play & Social": "#7a5c3a",
  "Music & Movement": "#5a3a7a",
};

const API_BASE = "http://localhost:3001";

async function apiCall(path, method = "GET", body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  } catch {
    return null; // API not available — fall back to static data
  }
}

function WeekendPicks() {
  const [profile, setProfile] = useLocalStorage("wknd_profile", { schoolKey: "", age: "" });
  const [liked, setLiked] = useLocalStorage("wknd_liked", []);
  const [dismissed, setDismissed] = useLocalStorage("wknd_dismissed", []);
  const [registered, setRegistered] = useLocalStorage("wknd_registered", []);
  const [setup, setSetup] = useState(!profile.schoolKey);
  const [justRegistered, setJustRegistered] = useState(null);
  const [apiEvents, setApiEvents] = useState(null); // null = not loaded yet
  const [apiOnline, setApiOnline] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]); // real-time events from Eventbrite/Meetup
  const [manualEvents, setManualEvents] = useLocalStorage("wknd_manual", []); // user-added via Instagram parser
  const [igOpen, setIgOpen] = useState(false); // show Instagram paste panel
  const [igText, setIgText] = useState("");
  const [igUrl, setIgUrl] = useState("");
  const [igParsing, setIgParsing] = useState(false);
  const [igResult, setIgResult] = useState(null); // parsed event preview
  const [igError, setIgError] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const [dateFilter, setDateFilter] = useState("any");
  const [timeFilter, setTimeFilter] = useState("any");
  const [customAccounts, setCustomAccounts] = useLocalStorage("wknd_ig_accounts", []);
  const [accountInput, setAccountInput] = useState("");
  const [customSyncing, setCustomSyncing] = useState(false);
  const [accountsPanelOpen, setAccountsPanelOpen] = useState(false);

  const { schoolKey, age, pincode } = profile;

  // Try loading from API whenever liked/dismissed/age changes
  useEffect(() => {
    if (setup || age === "") return;
    const params = new URLSearchParams({
      age,
      ...(liked.length && { liked: liked.join(",") }),
      ...(dismissed.length && { dismissed: dismissed.join(",") }),
    });
    apiCall(`/events?${params}`).then((data) => {
      if (data?.events) {
        setApiEvents(data.events);
        setApiOnline(true);
      } else {
        setApiEvents(null);
        setApiOnline(false);
      }
    });
  }, [setup, age, liked, dismissed]);

  async function handleParseInstagram() {
    if (!igText.trim()) return;
    setIgParsing(true); setIgError(""); setIgResult(null);
    const data = await apiCall("/events/parse", "POST", { text: igText, url: igUrl || undefined });
    setIgParsing(false);
    if (data?.event) { setIgResult(data.event); }
    else { setIgError(data?.error || "Backend not reachable — start it with: cd backend/api && node index.js"); }
  }

  function handleAddParsedEvent() {
    if (!igResult) return;
    setManualEvents(prev => [igResult, ...prev.filter(e => e.id !== igResult.id)]);
    setIgOpen(false); setIgText(""); setIgUrl(""); setIgResult(null);
  }

  // Fetch live events (Eventbrite + Meetup + Instagram) when age is known
  useEffect(() => {
    if (setup || age === "") return;
    Promise.all([
      apiCall(`/events/live?age=${age}`),
      apiCall(`/events/instagram?age=${age}`),
    ]).then(([liveData, igData]) => {
      const live = liveData?.events || [];
      const ig = igData?.events || [];
      // deduplicate by id
      const seen = new Set();
      const combined = [...ig, ...live].filter(e => seen.has(e.id) ? false : seen.add(e.id));
      if (combined.length) setLiveEvents(combined);
    });
  }, [setup, age]);

  // Static fallback scoring — sort: date (Sat→Sun) → age-fit → proximity
  // Merges live events (Eventbrite/Meetup) at the top of the pool
  const staticRecommendations = useMemo(() => {
    const existingIds = new Set(EVENT_CATALOGUE.map(e => e.id));
    const merged = [
      ...manualEvents,
      ...liveEvents.filter(e => !existingIds.has(e.id) && !manualEvents.find(m => m.id === e.id)),
      ...EVENT_CATALOGUE,
    ];
    const pool = merged.filter(
      (e) =>
        !dismissed.includes(e.id) &&
        !registered.includes(e.id) &&
        (age === "" || Number(age) >= e.ageMin)
    );
    return pool
      .map((e) => {
        const { scores } = multiSchoolScore(e);
        const score = scoreEvent(e, schoolKey, liked, dismissed, age, pincode);
        const ageFit = ageSuitabilityScore(e, age);
        const prox = proximityScore(e, pincode);
        const dayOrder = e.date === "sat" ? 0 : 1;
        return { ...e, schoolScores: scores, score, _dayOrder: dayOrder, _ageFit: ageFit, _prox: prox };
      })
      .sort((a, b) => {
        if (a._dayOrder !== b._dayOrder) return a._dayOrder - b._dayOrder; // Sat before Sun
        if (b._ageFit !== a._ageFit) return b._ageFit - a._ageFit;         // better age fit first
        return b._prox - a._prox;                                           // closer first
      });
  }, [schoolKey, age, pincode, liked, dismissed, registered]);

  // Use API data when available, else static
  const recommendations = (apiEvents
    ? apiEvents.filter((e) => !registered.includes(e.id))
    : staticRecommendations
  );

  // Kick off custom account sync on mount if accounts saved
  useEffect(() => {
    if (customAccounts.length > 0 && apiOnline) {
      triggerCustomSync(customAccounts, false);
    }
  }, [apiOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  function parseStartHour(time) {
    if (!time) return null;
    const m = time.match(/(\d+):\d+\s*(AM|PM)/i);
    if (!m) return null;
    let h = parseInt(m[1]);
    const period = m[2].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h;
  }

  // Sort: custom-account Instagram first, then other Instagram, then Urbanaut, then rest
  const sortedRecommendations = useMemo(() => {
    const customSet = new Set(customAccounts.map(u => u.replace(/^@/, "").trim().toLowerCase()));
    const tier = (e) => {
      if (e.source === "Instagram" && customSet.has((e.instagramAccount || "").toLowerCase())) return 0;
      if (e.source === "Instagram") return 1;
      if (e.source === "Urbanaut") return 2;
      return 3;
    };
    return [...recommendations].sort((a, b) => tier(a) - tier(b));
  }, [recommendations, customAccounts]);

  // Apply date + time filters
  const { sat: satLabel, sun: sunLabel, satDate, sunDate } = getWeekendDates();
  const satISO = satDate.toISOString().slice(0, 10);
  const sunISO = sunDate.toISOString().slice(0, 10);
  const todayISO = new Date().toISOString().slice(0, 10);
  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  const filteredRecommendations = useMemo(() => {
    return sortedRecommendations.filter(e => {
      // Date filter
      if (dateFilter === "today") {
        if (e.date !== todayISO) return false;
      } else if (dateFilter === "sat") {
        if (e.date !== "sat" && e.date !== satISO) return false;
      } else if (dateFilter === "sun") {
        if (e.date !== "sun" && e.date !== sunISO) return false;
      }
      // Time filter
      if (timeFilter !== "any") {
        const h = parseStartHour(e.time);
        if (h === null) return true; // no time info — keep
        if (timeFilter === "morning" && h >= 12) return false;
        if (timeFilter === "afternoon" && (h < 12 || h >= 17)) return false;
        if (timeFilter === "evening" && h < 17) return false;
      }
      return true;
    });
  }, [sortedRecommendations, dateFilter, timeFilter, todayISO, satISO, sunISO]);

  // Reset visible count when filtered list changes
  useEffect(() => { setVisibleCount(6); }, [filteredRecommendations.length]);

  const visibleEvents = filteredRecommendations.slice(0, visibleCount);

  function eventDateLabel(e) {
    return e.date === "sat" ? satLabel : e.date === "sun" ? sunLabel : e.date;
  }

  async function triggerCustomSync(accounts, showSyncing = true) {
    if (!apiOnline || !accounts.length) return;
    if (showSyncing) setCustomSyncing(true);
    try {
      await apiCall("/events/instagram/sync-custom", "POST", { accounts });
      // Poll for updated events after ~3 min (Apify takes ~2–3 min)
      if (showSyncing) {
        setTimeout(async () => {
          const data = await apiCall(`/events/instagram?age=${age}`);
          if (data?.events?.length) {
            const live = await apiCall(`/events/live?age=${age}`);
            const liveArr = live?.events || [];
            const seen = new Set();
            const combined = [...(data.events), ...liveArr].filter(e => seen.has(e.id) ? false : seen.add(e.id));
            if (combined.length) setLiveEvents(combined);
          }
          setCustomSyncing(false);
        }, 3 * 60 * 1000);
      }
    } catch {
      setCustomSyncing(false);
    }
  }

  function handleSaveAccounts() {
    const parsed = accountInput
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(Boolean);
    setCustomAccounts(parsed);
    setAccountInput("");
    triggerCustomSync(parsed, true);
  }

  async function handleLike(id, url) {
    if (!liked.includes(id)) {
      setLiked([...liked, id]);
      await apiCall(`/events/${id}/like`, "POST");
    }
    window.open(url, "_blank", "noopener");
  }

  async function handleDismiss(id) {
    if (!dismissed.includes(id)) {
      setDismissed([...dismissed, id]);
      await apiCall(`/events/${id}/dismiss`, "POST");
    }
  }

  async function handleRegister(event) {
    setRegistered([...registered, event.id]);
    setLiked([...liked, event.id]);
    setJustRegistered(event);

    // Get best deep link from API, fall back to static url
    const urlData = await apiCall(`/events/${event.id}/url`);
    const deepUrl = urlData?.url || event.registrationUrl || event.url;

    await apiCall(`/events/${event.id}/register`, "POST");
    window.open(deepUrl, "_blank", "noopener");
  }

  function handleReset() {
    setLiked([]); setDismissed([]); setRegistered([]);
    setProfile({ schoolKey: "", age: "" });
    setSetup(true);
    setJustRegistered(null);
  }

  if (setup) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
              Child's age
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <input
                type="range" min={0} max={15}
                value={profile.age === "" ? 0 : profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                style={{ flex: 1, accentColor: "var(--leaf)" }}
              />
              <span style={{ fontWeight: 800, fontSize: "1.4rem", color: "var(--leaf)", minWidth: 44 }}>
                {profile.age === "" ? "—" : `${profile.age}y`}
              </span>
            </div>
          </div>
          <div>
            <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
              Her school's philosophy
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {Object.entries(SCHOOL_DATA).map(([key, s]) => (
                <button
                  key={key} type="button"
                  onClick={() => setProfile({ ...profile, schoolKey: key })}
                  style={{
                    padding: "12px 14px", textAlign: "left", cursor: "pointer",
                    border: `2px solid ${profile.schoolKey === key ? s.color : "var(--line)"}`,
                    borderRadius: 10,
                    background: profile.schoolKey === key ? `${s.color}12` : "var(--white)",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: profile.schoolKey === key ? s.color : "var(--ink)" }}>{s.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2 }}>{s.subtitle}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
              Your Bangalore pincode <span style={{ fontWeight: 400, textTransform: "none" }}>(for nearby events)</span>
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="text" maxLength={6} placeholder="e.g. 560029"
                value={profile.pincode || ""}
                onChange={(e) => setProfile({ ...profile, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                style={{
                  padding: "10px 14px", fontSize: "1rem", border: "1.5px solid var(--line)", borderRadius: 8,
                  background: "var(--white)", color: "var(--ink)", outline: "none", width: 140,
                  fontFamily: "inherit",
                }}
              />
              {profile.pincode && pincodeToZone(profile.pincode) && (
                <span style={{ fontSize: "0.8rem", color: "var(--leaf)", fontWeight: 600 }}>
                  📍 {ZONE_LABELS[pincodeToZone(profile.pincode)]}
                </span>
              )}
              {profile.pincode && profile.pincode.length === 6 && !pincodeToZone(profile.pincode) && (
                <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Pincode not in map — still works</span>
              )}
            </div>
          </div>
          <button
            disabled={!profile.schoolKey || profile.age === ""}
            onClick={() => setSetup(false)}
            style={{
              padding: "13px 24px", fontWeight: 700, fontSize: "0.92rem", border: "none", borderRadius: 8,
              background: profile.schoolKey && profile.age !== "" ? "var(--leaf)" : "var(--line)",
              color: profile.schoolKey && profile.age !== "" ? "var(--white)" : "var(--muted)",
              cursor: profile.schoolKey && profile.age !== "" ? "pointer" : "not-allowed",
            }}
          >
            Show this weekend's picks →
          </button>
        </div>
      </div>
    );
  }

  const school = SCHOOL_DATA[schoolKey];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Profile bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {ACTIVE_SCHOOLS.map((sk) => (
              <span key={sk} style={{ fontSize: "0.72rem", fontWeight: 700, padding: "3px 9px", borderRadius: 12, background: `${SCHOOL_COLORS[sk]}18`, color: SCHOOL_COLORS[sk] }}>
                {SCHOOL_LABELS[sk]}
              </span>
            ))}
          </div>
          <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
            · Age {age}
            {pincode && pincodeToZone(pincode) && ` · ${ZONE_LABELS[pincodeToZone(pincode)]}`}
            · {recommendations.length} events
          </span>
          {liked.length > 0 && (
            <span style={{ fontSize: "0.75rem", color: "var(--leaf)", fontWeight: 600 }}>
              · {liked.length} signal{liked.length > 1 ? "s" : ""} learnt
            </span>
          )}
          <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 10, fontWeight: 600,
            background: apiOnline ? "#f0f7f3" : "var(--band)",
            color: apiOnline ? "var(--leaf)" : "var(--muted)" }}>
            {apiOnline ? "● Neo4j live" : "○ Static mode"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => { setIgOpen(o => !o); setIgResult(null); setIgError(""); }}
            style={{ background: igOpen ? "var(--leaf)" : "none", border: `1.5px solid ${igOpen ? "var(--leaf)" : "var(--line)"}`,
              color: igOpen ? "#fff" : "var(--muted)", fontSize: "0.78rem", cursor: "pointer",
              fontWeight: 700, borderRadius: 8, padding: "4px 12px" }}>
            + Instagram
          </button>
          <button onClick={handleReset} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}>
            Reset ↺
          </button>
        </div>
      </div>

      {/* Instagram caption parser */}
      {igOpen && (
        <div style={{ background: "var(--band)", border: "1.5px solid var(--line)", borderRadius: 14, padding: "20px 22px", marginBottom: 16 }}>
          <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: "0.9rem" }}>Add event from Instagram</p>
          <p style={{ margin: "0 0 14px", fontSize: "0.78rem", color: "var(--muted)" }}>
            Open the Instagram post → tap ··· → Copy → paste the caption below. Claude extracts the event details.
          </p>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Post URL (optional)</label>
            <input value={igUrl} onChange={e => setIgUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--line)", fontSize: "0.82rem", background: "var(--white)", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Caption / event text *</label>
            <textarea value={igText} onChange={e => setIgText(e.target.value)} rows={5}
              placeholder="Paste the Instagram caption or WhatsApp event message here..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid var(--line)", fontSize: "0.82rem", resize: "vertical", background: "var(--white)", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          {igError && <p style={{ color: "#b94c36", fontSize: "0.8rem", margin: "0 0 10px" }}>{igError}</p>}

          {igResult ? (
            <div style={{ background: "var(--white)", border: "2px solid var(--leaf)", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
              <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: "0.95rem" }}>{igResult.name}</p>
              <p style={{ margin: "0 0 6px", fontSize: "0.8rem", color: "var(--muted)" }}>
                {igResult.provider && `${igResult.provider} · `}{igResult.venue}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                {igResult.date && <span style={{ fontSize: "0.75rem", background: "#f0f7f3", color: "var(--leaf)", fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>
                  📅 {igResult.date}{igResult.time ? ` · ${igResult.time}` : ""}
                </span>}
                {igResult.cost && <span style={{ fontSize: "0.75rem", background: "var(--band)", padding: "2px 8px", borderRadius: 8 }}>{igResult.cost}</span>}
                {igResult.ageMin > 0 && <span style={{ fontSize: "0.75rem", background: "var(--band)", padding: "2px 8px", borderRadius: 8 }}>Age {igResult.ageMin}+</span>}
                <span style={{ fontSize: "0.75rem", background: "var(--band)", padding: "2px 8px", borderRadius: 8 }}>{igResult.area}</span>
              </div>
              {igResult.builds?.length > 0 && <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>Builds: {igResult.builds.join(" · ")}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={handleAddParsedEvent}
                  style={{ padding: "8px 20px", background: "var(--leaf)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
                  Add to Weekend Picks
                </button>
                <button onClick={() => setIgResult(null)}
                  style={{ padding: "8px 14px", background: "none", border: "1.5px solid var(--line)", borderRadius: 8, fontSize: "0.82rem", cursor: "pointer", color: "var(--muted)" }}>
                  Re-extract
                </button>
              </div>
            </div>
          ) : (
            <button onClick={handleParseInstagram} disabled={igParsing || !igText.trim()}
              style={{ padding: "9px 22px", background: igParsing || !igText.trim() ? "var(--band)" : "var(--leaf)",
                color: igParsing || !igText.trim() ? "var(--muted)" : "#fff", border: "none",
                borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: igParsing ? "default" : "pointer" }}>
              {igParsing ? "Extracting with Claude…" : "Extract event →"}
            </button>
          )}

          {manualEvents.length > 0 && (
            <p style={{ margin: "14px 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>
              {manualEvents.length} event{manualEvents.length > 1 ? "s" : ""} added manually ·{" "}
              <button onClick={() => setManualEvents([])} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                clear all
              </button>
            </p>
          )}
        </div>
      )}

      {/* Just registered confirmation */}
      {justRegistered && (
        <div style={{ background: "#f0f7f3", border: "1.5px solid var(--leaf)", borderRadius: 10, padding: "14px 18px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "0.9rem", color: "var(--leaf)" }}>Registered → {justRegistered.name}</p>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>Registration page opened. Saved to your list.</p>
          </div>
          <button onClick={() => setJustRegistered(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1.1rem" }}>✕</button>
        </div>
      )}

      {/* Registered events list */}
      {registered.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--leaf)" }}>
            Registered this weekend
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {registered.map((id) => {
              const e = EVENT_CATALOGUE.find((ev) => ev.id === id);
              return e ? (
                <span key={id} style={{ fontSize: "0.8rem", padding: "4px 12px", borderRadius: 20, background: "#f0f7f3", color: "var(--leaf)", fontWeight: 600 }}>
                  ✓ {e.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* ── Filters: date + time ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Date chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 36 }}>Date</span>
          {[
            { key: "any", label: "Any" },
            { key: "today", label: `Today · ${todayLabel}` },
            { key: "sat", label: satLabel },
            { key: "sun", label: sunLabel },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setDateFilter(key)}
              style={{
                padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                border: `1.5px solid ${dateFilter === key ? "var(--leaf)" : "var(--line)"}`,
                background: dateFilter === key ? "var(--leaf)" : "var(--white)",
                color: dateFilter === key ? "#fff" : "var(--ink)",
              }}>
              {label}
            </button>
          ))}
        </div>
        {/* Time chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 36 }}>Time</span>
          {[
            { key: "any", label: "Any" },
            { key: "morning", label: "Morning  ☀️  before 12" },
            { key: "afternoon", label: "Afternoon  🌤  12–5" },
            { key: "evening", label: "Evening  🌆  after 5" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTimeFilter(key)}
              style={{
                padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                border: `1.5px solid ${timeFilter === key ? "var(--leaf)" : "var(--line)"}`,
                background: timeFilter === key ? "var(--leaf)" : "var(--white)",
                color: timeFilter === key ? "#fff" : "var(--ink)",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Instagram accounts panel */}
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 2 }}>
          <button onClick={() => setAccountsPanelOpen(p => !p)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: "0.78rem", fontWeight: 600 }}>
            <span style={{ fontSize: "0.85rem" }}>📸</span>
            Follow accounts
            {customAccounts.length > 0 && (
              <span style={{ background: "#c13584", color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: "0.68rem", fontWeight: 700 }}>
                {customAccounts.length}
              </span>
            )}
            {customSyncing && <span style={{ fontSize: "0.7rem", color: "#c13584", fontWeight: 700 }}>· syncing…</span>}
            <span style={{ marginLeft: 2 }}>{accountsPanelOpen ? "▲" : "▼"}</span>
          </button>

          {accountsPanelOpen && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {customAccounts.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {customAccounts.map(a => (
                    <span key={a} style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: 20, background: "#fce4f3", color: "#c13584", fontWeight: 600 }}>
                      {a.startsWith("@") ? a : `@${a}`}
                      <button onClick={() => {
                        const next = customAccounts.filter(x => x !== a);
                        setCustomAccounts(next);
                      }} style={{ background: "none", border: "none", cursor: "pointer", color: "#c13584", padding: "0 0 0 4px", fontSize: "0.7rem" }}>✕</button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <textarea
                  rows={2}
                  placeholder={"@attagalatta, @rangashankara, @craftymeets"}
                  value={accountInput}
                  onChange={e => setAccountInput(e.target.value)}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1.5px solid var(--line)", fontSize: "0.8rem", resize: "none", fontFamily: "inherit", color: "var(--ink)", background: "var(--white)" }}
                />
                <button onClick={handleSaveAccounts} disabled={!accountInput.trim() || customSyncing}
                  style={{
                    padding: "8px 14px", background: customSyncing ? "var(--band)" : "#c13584",
                    color: customSyncing ? "var(--muted)" : "#fff", border: "none", borderRadius: 8,
                    fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap",
                  }}>
                  {customSyncing ? "Syncing…" : "Fetch →"}
                </button>
              </div>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--muted)" }}>
                Comma-separated handles. Takes ~3 min to fetch via Instagram. Saved across sessions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Event cards */}
      {dismissed.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "8px 14px", background: "var(--band)", borderRadius: 8 }}>
          <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{dismissed.length} event{dismissed.length > 1 ? "s" : ""} hidden</span>
          <button onClick={() => setDismissed([])} style={{ background: "none", border: "none", color: "var(--leaf)", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", padding: 0 }}>
            Show all →
          </button>
        </div>
      )}

      {filteredRecommendations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
          {dateFilter !== "any" || timeFilter !== "any" ? (
            <>
              <p style={{ fontSize: "1.1rem", fontWeight: 700 }}>No events match this filter.</p>
              <button onClick={() => { setDateFilter("any"); setTimeFilter("any"); }}
                style={{ padding: "10px 22px", background: "var(--leaf)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}>
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: "1.1rem", fontWeight: 700 }}>You've seen everything this weekend.</p>
              <p style={{ fontSize: "0.88rem", marginBottom: 16 }}>Reset to start fresh.</p>
              <button onClick={() => setDismissed([])} style={{ padding: "10px 22px", background: "var(--leaf)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}>
                Show all events
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {visibleEvents.map((event, idx) => {
            const color = AREA_COLORS[event.area] || "var(--leaf)";
            const isTop = idx === 0;
            return (
              <div
                key={event.id}
                style={{
                  background: "var(--white)",
                  border: isTop ? `2px solid ${color}` : "1.5px solid var(--line)",
                  borderRadius: 14,
                  padding: "20px 22px",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 16,
                  alignItems: "start",
                  position: "relative",
                }}
              >
                {isTop && (
                  <div style={{ position: "absolute", top: -11, left: 20, background: color, color: "#fff", fontSize: "0.68rem", fontWeight: 800, padding: "2px 10px", borderRadius: 20, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Best match
                  </div>
                )}
                <div>
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color, background: `${color}15`, padding: "2px 8px", borderRadius: 10 }}>
                      {event.area}
                    </span>
                    {event.free ? (
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--leaf)", background: "#f0f7f3", padding: "2px 8px", borderRadius: 10 }}>
                        FREE
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.7rem", color: "var(--muted)", background: "var(--band)", padding: "2px 8px", borderRadius: 10 }}>
                        {event.cost}
                      </span>
                    )}
                    <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                      Ages {event.ageMin}+
                      {age !== "" && (() => {
                        const diff = Number(age) - event.ageMin;
                        if (diff <= 2) return <span style={{ marginLeft: 4, color: "var(--leaf)", fontWeight: 700 }}>✓ Right age</span>;
                        if (diff <= 4) return null;
                        return <span style={{ marginLeft: 4, color: "var(--muted)" }}>(younger crowd)</span>;
                      })()}
                    </span>
                  </div>

                  <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: "1rem", color: "var(--ink)" }}>{event.name}</p>
                  {(event.date || event.time) ? (
                    <p style={{ margin: "0 0 4px", fontSize: "0.82rem", fontWeight: 700, color: color, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span>📅 {eventDateLabel(event)}{event.time ? ` · ${event.time}` : ""}</span>
                      {event.source === "Instagram" && (
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fff", background: "#c13584", padding: "1px 7px", borderRadius: 8 }}>
                          Instagram
                        </span>
                      )}
                      {event.live && event.source !== "Instagram" && (
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fff", background: "var(--leaf)", padding: "1px 7px", borderRadius: 8 }}>
                          LIVE
                        </span>
                      )}
                      {event.recurring && !event.live && (
                        <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--muted)", background: "var(--band)", padding: "1px 7px", borderRadius: 8 }}>
                          recurring · check venue
                        </span>
                      )}
                    </p>
                  ) : (
                    <p style={{ margin: "0 0 4px", fontSize: "0.78rem", fontWeight: 600, color: "#b45309", background: "#fef3c7", display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 10px", borderRadius: 8 }}>
                      ⚠ Date not confirmed — check with organiser
                    </p>
                  )}
                  <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: "var(--muted)" }}>
                    {event.provider} · {event.venue}
                    {proximityLabel(event, pincode) && (
                      <span style={{ marginLeft: 8, color: proximityLabel(event, pincode) === "Nearby" ? "var(--leaf)" : "var(--muted)", fontWeight: proximityLabel(event, pincode) === "Nearby" ? 700 : 400 }}>
                        · {proximityLabel(event, pincode)}
                      </span>
                    )}
                  </p>

                  {/* Builds */}
                  <p style={{ margin: "0 0 10px", fontSize: "0.8rem", color: "var(--ink)" }}>
                    <span style={{ fontWeight: 700 }}>Builds: </span>{event.builds.join(" · ")}
                  </p>

                  {/* Per-school pedagogy fit bars */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {ACTIVE_SCHOOLS.map((sk) => {
                      const s = multiSchoolScore(event).scores[sk];
                      return (
                        <div key={sk} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: SCHOOL_COLORS[sk], minWidth: 72 }}>
                            {SCHOOL_LABELS[sk]}
                          </span>
                          <div style={{ flex: 1, height: 4, background: "var(--band)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${s}%`, height: "100%", background: SCHOOL_COLORS[sk], borderRadius: 2, transition: "width 0.4s" }} />
                          </div>
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: SCHOOL_COLORS[sk], minWidth: 28 }}>{s}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 120 }}>
                  {event.free ? (
                    <button
                      onClick={() => handleRegister(event)}
                      style={{
                        padding: "9px 16px", fontWeight: 700, fontSize: "0.82rem",
                        background: "var(--leaf)", color: "var(--white)",
                        border: "none", borderRadius: 8, cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Register free →
                    </button>
                  ) : event.registrationUrl ? (
                    <a
                      href={event.registrationUrl} target="_blank" rel="noopener noreferrer"
                      style={{
                        padding: "9px 16px", fontWeight: 700, fontSize: "0.82rem",
                        background: color, color: "var(--white)",
                        border: "none", borderRadius: 8, cursor: "pointer",
                        textDecoration: "none", textAlign: "center",
                        whiteSpace: "nowrap", display: "block",
                      }}
                    >
                      Book / Register →
                    </a>
                  ) : event.instagramUrl ? (
                    <a
                      href={event.instagramUrl} target="_blank" rel="noopener noreferrer"
                      style={{
                        padding: "9px 16px", fontWeight: 700, fontSize: "0.82rem",
                        background: "#c13584", color: "#fff",
                        border: "none", borderRadius: 8, cursor: "pointer",
                        textDecoration: "none", textAlign: "center",
                        whiteSpace: "nowrap", display: "block",
                      }}
                    >
                      View post →
                    </a>
                  ) : null}
                  <button
                    onClick={() => handleLike(event.id, event.registrationUrl)}
                    style={{
                      padding: "7px 16px", fontWeight: 600, fontSize: "0.78rem",
                      background: liked.includes(event.id) ? "#f0f7f3" : "transparent",
                      color: liked.includes(event.id) ? "var(--leaf)" : "var(--muted)",
                      border: "1.5px solid var(--line)", borderRadius: 8, cursor: "pointer",
                    }}
                  >
                    {liked.includes(event.id) ? "✓ Saved" : "Looks good →"}
                  </button>
                  <button
                    onClick={() => handleDismiss(event.id)}
                    style={{
                      padding: "7px 16px", fontWeight: 600, fontSize: "0.78rem",
                      background: "transparent", color: "var(--muted)",
                      border: "1.5px solid var(--line)", borderRadius: 8, cursor: "pointer",
                    }}
                  >
                    Not for us
                  </button>
                </div>
              </div>
            );
          })}
          {visibleCount < filteredRecommendations.length && (
            <button
              onClick={() => setVisibleCount((c) => Math.min(c + 6, filteredRecommendations.length))}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--leaf)", fontWeight: 700, fontSize: "0.88rem",
                padding: "10px 0", textAlign: "center", width: "100%",
                textDecoration: "underline", textUnderlineOffset: 3,
              }}
            >
              Show more ({filteredRecommendations.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Explore for Her data ──────────────────────────────────────────────────────

const EXPLORE_AREAS = [
  {
    area: "Creative & Making",
    color: "#b94c36",
    icon: "✦",
    activities: [
      {
        name: "Golden Bridge Pottery",
        provider: "Coro",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app",
        builds: ["Fine motor", "Patience", "Sensory", "Making something real"],
        tags: ["Hands-on", "Ages 4+"],
      },
      {
        name: "Summer Art Camps",
        provider: "MAP — Museum of Art & Photography",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app",
        builds: ["Visual literacy", "Indian culture", "Creative expression"],
        tags: ["Cultural", "Ages 5+"],
      },
      {
        name: "DIY Science + Story Projects",
        provider: "Coro Afternoon Clubs",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app/featured-events/family-events-bangalore",
        builds: ["Curiosity", "Cause-and-effect", "Imagination"],
        tags: ["STEM + Arts", "Ages 5+"],
      },
      {
        name: "Sustainability Workshops",
        provider: "Bangalore Creative Circus",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app/spot/bangalore-creative-circus-3207",
        builds: ["Creative voice", "Sustainability thinking", "Making"],
        tags: ["Eco", "All ages"],
      },
    ],
  },
  {
    area: "Story & Culture",
    color: "#315f86",
    icon: "◈",
    activities: [
      {
        name: "Storytelling & Puppet Shows",
        provider: "Atta Galatta",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app",
        builds: ["Love of story", "Language", "Emotional vocabulary"],
        tags: ["Literary", "Ages 3+"],
      },
      {
        name: "Theatre Performances for Kids",
        provider: "Atta Galatta",
        source: "BookMyShow",
        sourceUrl: "https://in.bookmyshow.com",
        builds: ["Empathy", "Narrative", "Listening"],
        tags: ["Performance", "Ages 4+"],
      },
      {
        name: "Interactive Museum Trails",
        provider: "MAP",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app/featured-forkids/summer-activities",
        builds: ["Observation", "Asking questions", "Cultural identity"],
        tags: ["Cultural", "Ages 5+"],
      },
      {
        name: "Warli Tribal Art Experience",
        provider: "The Localway",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app",
        builds: ["Indigenous art", "Cultural respect", "Heritage"],
        tags: ["Cultural", "Ages 6+"],
      },
    ],
  },
  {
    area: "Nature & Outdoor",
    color: "#2f6f58",
    icon: "⬡",
    activities: [
      {
        name: "Nature Trails & Birdwatching",
        provider: "Urbanaut Curated",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app/experience-bengaluru/things-to-do",
        builds: ["Attention", "Stillness", "Ecological awareness"],
        tags: ["Outdoor", "All ages"],
      },
      {
        name: "Bat Walk — Wildlife Experience",
        provider: "Urbanaut Curated",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app",
        builds: ["Wonder", "Scientific curiosity", "Patience"],
        tags: ["Outdoor", "Ages 6+"],
      },
      {
        name: "Heritage Walks",
        provider: "Urbanaut Curated",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app/experience-bengaluru/things-to-do",
        builds: ["History", "Place-attachment", "Observation"],
        tags: ["Cultural", "Ages 7+"],
      },
      {
        name: "Farm-to-Table & Farmers Market",
        provider: "Bangalore Creative Circus",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app/spot/bangalore-creative-circus-3207",
        builds: ["Where food comes from", "Sustainability", "Sensory"],
        tags: ["Eco", "All ages"],
      },
    ],
  },
  {
    area: "Play & Social",
    color: "#7a5c3a",
    icon: "◎",
    activities: [
      {
        name: "Theme-Based Playdates",
        provider: "The Looroo Club",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app",
        builds: ["Role-play", "Social skills", "Imagination"],
        tags: ["Play", "Ages 2–6"],
      },
      {
        name: "Nature-Led Play (Norwegian Model)",
        provider: "Papagoya Education",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app",
        builds: ["Independence", "Outdoor comfort", "Experiential learning"],
        tags: ["Outdoor play", "Ages 2–6"],
      },
      {
        name: "Afternoon Clubs",
        provider: "Coro",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app/featured-events/family-events-bangalore",
        builds: ["Peer interaction", "Learning alongside others", "Curiosity"],
        tags: ["Social", "Ages 4+"],
      },
    ],
  },
  {
    area: "Music & Movement",
    color: "#5a3a7a",
    icon: "♩",
    activities: [
      {
        name: "Live Music & Choir Experiences",
        provider: "Urbanaut Events",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app/experience-bengaluru/things-to-do",
        builds: ["Listening", "Rhythm", "Aesthetic sense"],
        tags: ["Music", "All ages"],
      },
      {
        name: "Wellness & Movement Mornings",
        provider: "Urbanaut Wellness",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app",
        builds: ["Body awareness", "Breath", "Community"],
        tags: ["Movement", "All ages"],
      },
      {
        name: "Dance & Theatre Workshops",
        provider: "Various",
        source: "BookMyShow",
        sourceUrl: "https://in.bookmyshow.com",
        builds: ["Expression", "Coordination", "Confidence"],
        tags: ["Performance", "Ages 4+"],
      },
    ],
  },
];

const DEV_TAGS = {
  "Fine motor": "#b94c36",
  "Curiosity": "#2f6f58",
  "Language": "#315f86",
  "Outdoor": "#2f6f58",
  "Cultural": "#7a5c3a",
  "Social": "#5a3a7a",
  "Sensory": "#b94c36",
};

function ExploreForHer() {
  const [activeArea, setActiveArea] = useState(null);

  const displayed = activeArea
    ? EXPLORE_AREAS.filter((a) => a.area === activeArea)
    : EXPLORE_AREAS;

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 36 }}>
        <button
          onClick={() => setActiveArea(null)}
          style={{
            padding: "7px 16px",
            borderRadius: 20,
            border: `1.5px solid ${activeArea === null ? "var(--leaf)" : "var(--line)"}`,
            background: activeArea === null ? "var(--leaf)" : "transparent",
            color: activeArea === null ? "var(--white)" : "var(--muted)",
            fontWeight: 600,
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          All areas
        </button>
        {EXPLORE_AREAS.map((a) => (
          <button
            key={a.area}
            onClick={() => setActiveArea(activeArea === a.area ? null : a.area)}
            style={{
              padding: "7px 16px",
              borderRadius: 20,
              border: `1.5px solid ${activeArea === a.area ? a.color : "var(--line)"}`,
              background: activeArea === a.area ? a.color : "transparent",
              color: activeArea === a.area ? "var(--white)" : "var(--muted)",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {a.icon} {a.area}
          </button>
        ))}
      </div>

      {/* Activity cards */}
      {displayed.map((area) => (
        <div key={area.area} style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: "1.1rem", color: area.color }}>{area.icon}</span>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: area.color, letterSpacing: "0.04em" }}>
              {area.area}
            </h3>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {area.activities.map((act) => (
              <div
                key={act.name}
                style={{
                  background: "var(--white)",
                  border: "1.5px solid var(--line)",
                  borderRadius: 12,
                  padding: "18px 18px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div>
                  <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)" }}>
                    {act.name}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>
                    {act.provider}
                  </p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {act.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: `${area.color}15`,
                        color: area.color,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted)" }}>
                    Builds
                  </p>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink)", lineHeight: 1.5 }}>
                    {act.builds.join(" · ")}
                  </p>
                </div>
                <a
                  href={act.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginTop: "auto",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: area.color,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  View on {act.source} →
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Dev map footer */}
      <div style={{ background: "var(--band)", borderRadius: 12, padding: "20px 24px", marginTop: 8 }}>
        <p style={{ margin: "0 0 12px", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
          What each area builds in her
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
          {[
            ["Creative & Making", "Fine motor, patience, creative confidence"],
            ["Story & Culture", "Language, empathy, cultural identity"],
            ["Nature & Outdoor", "Attention, wonder, ecological sense"],
            ["Play & Social", "Peer skills, independence, imagination"],
            ["Music & Movement", "Rhythm, body awareness, expression"],
          ].map(([area, desc]) => (
            <div key={area}>
              <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "0.8rem" }}>{area}</p>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Child Compass data ────────────────────────────────────────────────────────

const SCHOOL_DATA = {
  montessori: {
    name: "Montessori",
    subtitle: "Anweshana Montessori, Bangalore",
    tagline: "Prepared environment · self-directed learning · whole child from 18 months to 15 years",
    color: "#2f6f58",
    schools: ["Anweshana Montessori, Bangalore", "Prakriya Green Wisdom School, Bangalore", "Chrysalis Schools (pan-India)", "Indus Learning Center, Bangalore", "Discovery Montessori, Bangalore", "Harvest International School, Bangalore"],
    philosophy: [
      "Sensitive periods: windows where the child absorbs specific skills effortlessly",
      "Prepared environment: every material has a purpose and a place",
      "Freedom within limits: child chooses work, adult observes and guides",
      "Mixed-age classrooms: older children teach, younger children absorb",
      "No external rewards or punishments — intrinsic motivation is preserved",
    ],
    ages: {
      "0-2": {
        stage: "Unconscious Absorbent Mind",
        schoolFocus: "Sensorial exploration, movement, language immersion, deep order and routine",
        childWorld: "The child is absorbing everything like a sponge — your language, tone, faces, movement. Order and predictability matter deeply to her nervous system.",
        momWatch: [
          "Watch how she tracks your face and responds to your voice tone — she's reading your emotional state constantly",
          "Notice which textures, sounds, or movements calm her versus excite her",
          "Observe her attempts at communication before words arrive — the gestures, gaze, sounds",
          "Pay attention to sleep and feeding rhythms — she's building internal order from external consistency",
          "Notice how she uses her hands to explore — grasping, mouthing, banging, reaching",
        ],
        dadCarry: [
          "Become a safe, predictable presence — your consistency shapes her early sense of security",
          "Get on the floor with her and move at her pace — let her lead the exploration",
          "Talk out loud as you do things together: narrate the world simply and warmly",
          "Build physical trust through gentle rough-and-tumble, secure carrying, lifting",
          "Protect her from overstimulation — a calm, ordered home matters more than busy activities",
        ],
      },
      "3-5": {
        stage: "Conscious Absorbent Mind",
        schoolFocus: "Practical life skills, sensorial Montessori materials, early language and math through hands-on work",
        childWorld: "She wants to do real things: pour water, cut fruit, sort buttons, button her own shirt. School is an invitation to independence — and so should home be.",
        momWatch: [
          "Notice which Montessori materials or real tasks she's drawn to this season",
          "Watch how she handles frustration — can she return to a task after a break?",
          "Observe her language explosion — stories, questions, long explanations of small things",
          "Notice her relationship with peers: is she leading, watching, or joining?",
          "Pay attention to what she chooses when given unstructured, open-ended time",
        ],
        dadCarry: [
          "Give her real tasks at home: set the table, water the plants, sort the laundry",
          "Resist rescuing — let her struggle with the jar lid, the button, the puzzle",
          "Ask open questions about her day: 'What did you work on? What did you try?'",
          "Build physical confidence through climbing, throwing, balancing together",
          "Read to her every evening — this is when the love of story and language takes root",
        ],
      },
      "6-8": {
        stage: "Second Plane — Reasoning Mind Begins",
        schoolFocus: "Cosmic education begins, Five Great Lessons, social collaborative work, abstract reasoning emerging",
        childWorld: "She's developing a strong moral sense and wants to understand how the universe works. Why is water wet? Why do people lie? Why do stars exist?",
        momWatch: [
          "Notice her growing sense of fairness — she'll call out injustice loudly and passionately",
          "Watch friendships closely: who does she trust, who drains her, who she misses",
          "Observe what big questions she's sitting with — don't rush to answer them",
          "Notice how she's absorbing family conflict or tension in the home",
          "Pay attention to reading — is it becoming pleasure or beginning to feel like pressure?",
        ],
        dadCarry: [
          "Take her on explorations: a walk where you name things, a kitchen experiment, a small build",
          "Have ethical conversations: what's fair, what's brave, what counts as true",
          "Start a shared project — something you make together over several weeks",
          "Let her see you struggle with something and choose not to give up",
          "Introduce her to your work in a way that includes her curiosity",
        ],
      },
      "9-11": {
        stage: "Second Plane — Social Intelligence Peak",
        schoolFocus: "Research projects, collaborative learning, history, science, nature study, math abstraction",
        childWorld: "Her peer group is becoming her compass. She measures herself against friends and wants deeply to belong. Ideas are getting sophisticated.",
        momWatch: [
          "Watch social dynamics carefully — exclusion is painfully sharp at this age",
          "Notice how she talks about her own abilities: does she say 'I can't' too quickly?",
          "Observe her relationship with her body and how she's absorbing messages about it",
          "Pay attention to her moral compass — is she standing up for others when it costs something?",
          "Notice where she's finding joy that has nothing to do with school",
        ],
        dadCarry: [
          "Protect one-on-one time — it becomes less automatic now but matters more",
          "Let her see your values in action, not just in what you say",
          "Talk about your own failures honestly — she needs to know adults struggle and keep going",
          "Find a physical skill to learn together: a sport, swimming, cycling trails",
          "Ask about her friendships with genuine curiosity, not interrogation",
        ],
      },
      "12-15": {
        stage: "Third Plane — Erdkinder (Self-worth Through Contribution)",
        schoolFocus: "Social contribution, self-directed long projects, concepts of economic independence, land and community connection",
        childWorld: "She's asking who she is. The Montessori answer: worth comes from real contribution to the world, not from performance or grades.",
        momWatch: [
          "Watch her self-talk — is she kind to herself or relentlessly harsh?",
          "Notice which adults outside family she trusts and what they have in common",
          "Observe her creative outlets — they're her emotional processing system",
          "Pay attention to her relationship with screens and identity online",
          "Notice how she handles conflict — does she shut down, explode, or engage?",
        ],
        dadCarry: [
          "Be curious about her inner world without demanding entry",
          "Show her what meaningful work looks like in your own life",
          "Protect her right to disagree with you — and respond with calm, not ego",
          "Notice when she needs your presence versus space — and keep learning to read it",
          "Share stories from your own adolescence with real vulnerability",
        ],
      },
    },
  },
  cfl: {
    name: "Centre for Learning",
    subtitle: "CFL — Whitefield, Bangalore",
    tagline: "Learning as self-inquiry, relationship, and discovery — rooted in Krishnamurti's questions about life",
    color: "#315f86",
    schools: ["Centre for Learning (CFL), Whitefield, Bangalore", "Rishi Valley School, Andhra Pradesh (KFI)", "The School, Chennai (KFI)", "Sahyadri School, Pune (KFI)"],
    philosophy: [
      "Education is not about knowledge accumulation but about inner transformation",
      "Freedom with responsibility from the earliest age — no fear-based motivation",
      "No rewards, no punishments, no competitive ranking",
      "Deep co-inquiry between student and teacher as fellow learners",
      "Nature, silence, and sustained attention are woven into daily life",
    ],
    ages: {
      "0-2": {
        stage: "Before School — The Home Is the First Teacher",
        schoolFocus: "CFL admits children from around age 6. These years are entirely your classroom to design.",
        childWorld: "She's learning through your face, your voice, your quality of attention. The way you attend to her shapes her own capacity for attention later.",
        momWatch: [
          "Notice how you respond when she demands attention — your pattern teaches more than any method",
          "Watch her stillness: can she sit with a leaf, a sound, a shadow for even a moment?",
          "Observe her capacity for joy without external stimulation",
          "Pay attention to how she relates to animals, plants, small living things",
          "Notice the questions she's beginning to form — the very early 'why' and 'what'",
        ],
        dadCarry: [
          "Put the phone away more than you think is necessary — she notices everything",
          "Introduce silence: sit outside together and just listen to what arrives",
          "Talk to her about what you're actually seeing, not what you're supposed to see",
          "Protect her from the habit of constant entertainment and stimulation",
          "Build a relationship where she brings you her observations — be worth bringing them to",
        ],
      },
      "3-5": {
        stage: "Pre-school Years — Sensory and Relational Foundation",
        schoolFocus: "CFL admits from around age 6. The pre-school years are for unstructured wonder, not preparation.",
        childWorld: "She's building a relationship with the world through mud, water, stories, movement, and your presence. Don't accelerate this.",
        momWatch: [
          "Watch how she plays alone — is there richness and sustained focus in it?",
          "Notice which stories or characters she returns to again and again",
          "Observe her relationship with her own body — does she trust it?",
          "Pay attention to her questions — they are more important than your answers",
          "Notice how she handles not getting what she wants",
        ],
        dadCarry: [
          "Take her somewhere genuinely wild: a park, a forest trail, an open field",
          "Let her get dirty and genuinely physically tired",
          "Tell her a story you make up together, without a screen, without a script",
          "Build something small with your hands — she'll want to participate",
          "Avoid explaining everything — let mystery live a little longer",
        ],
      },
      "6-8": {
        stage: "Early School — Inquiry and Relationship",
        schoolFocus: "At CFL: reading and math emerge naturally through inquiry; nature, stories, art, and open dialogue are central",
        childWorld: "She's discovering what kind of learner she is. CFL asks her to be honest with herself, not to perform for a grade or for your approval.",
        momWatch: [
          "Notice how she responds to not knowing something — curiosity or anxiety?",
          "Watch her in silence — can she be still and observe without needing to fill the space?",
          "Observe how she talks about school: what genuinely excites her, what troubles her",
          "Pay attention to which relationships feel safe versus pressured to her",
          "Notice what she chooses to pay deep, sustained attention to",
        ],
        dadCarry: [
          "Have conversations where you genuinely don't know the answer either",
          "Go on a nature walk where you both observe without naming or explaining everything",
          "Ask her what she noticed today — and actually listen to the whole answer",
          "Let her see you be wrong about something and change your mind cleanly",
          "Read to her from books that ask real questions about what it means to be alive",
        ],
      },
      "9-11": {
        stage: "Middle School — Self-knowledge and Relationship",
        schoolFocus: "Dialogue circles, independent study, project-based learning, ecology, arts, and inner life exploration",
        childWorld: "She's beginning to question authority — including yours. At CFL, this is welcomed. It's the beginning of real intelligence.",
        momWatch: [
          "Watch how she's developing her own opinions — do you make genuine space for them?",
          "Notice when she's performing versus when she's actually being herself",
          "Observe her relationship with competitive comparison — is she beginning to see past it?",
          "Pay attention to what makes her quietly happy versus loudly entertained",
          "Notice who she's becoming in relationships — generous, guarded, curious, present?",
        ],
        dadCarry: [
          "Have honest conversations about things that actually matter to you in life",
          "Let her disagree with you and find out where she's right",
          "Explore something you both don't understand together — a question, a project, a place",
          "Be a model for sitting with uncertainty without becoming anxious",
          "Actively protect her from the idea that achievement equals worth",
        ],
      },
      "12-15": {
        stage: "Senior School — Consciousness, Choice, and Inner Freedom",
        schoolFocus: "Exploration of self and society, creative and independent work, dialogue, responsible freedom",
        childWorld: "She's asking the big questions: who am I? What matters? What do I actually think — not what I've been told to think? CFL asks her not to answer too quickly.",
        momWatch: [
          "Watch whether she's developing an inner life or outsourcing it to peers",
          "Notice her relationship with her own mind — is she beginning to trust it?",
          "Observe how she handles desire, boredom, and emotional intensity",
          "Pay attention to what she finds beautiful, what genuinely moves her",
          "Notice whether she can sit with a question without needing to resolve it immediately",
        ],
        dadCarry: [
          "Share your own real questions — not answers — about what matters in a life",
          "Protect her solitude: the most important things often happen in quiet",
          "Be genuinely curious about her interior world, not just her performance",
          "Let her see that you also don't have everything figured out — and that's fine",
          "Make space for conversations that don't need to go anywhere in particular",
        ],
      },
    },
  },
  valley: {
    name: "The Valley School",
    subtitle: "KFI — Kanakapura Road, Bangalore",
    tagline: "ICSE curriculum held inside Krishnamurti's invitation to self-inquiry, 100 acres of nature, and fearless learning",
    color: "#7a5c3a",
    schools: ["The Valley School, Kanakapura Road, Bangalore (KFI)", "Centre for Learning, Whitefield (KFI-affiliated)", "Rajghat Besant School, Varanasi (KFI)", "Pathashaala, Chennai (KFI)"],
    philosophy: [
      "Open Classroom for Classes I–IV: mixed-age groups, child-directed exploration",
      "Academic subjects integrated with inner inquiry and Krishnamurti's dialogues",
      "100-acre campus: the natural environment is part of the daily curriculum",
      "Arts — music, drama, dance, pottery, painting — are not optional extras",
      "ICSE board structure without the fear and competitive culture of most schools",
    ],
    ages: {
      "0-2": {
        stage: "Pre-school Years — Building the Foundation for the Valley Child",
        schoolFocus: "Valley School admits from Grade 1 (age 6). These years prepare a child who can be still, curious, and self-directed.",
        childWorld: "These are the years to build her relationship with attention, nature, and her own body. The academic years can wait — this cannot.",
        momWatch: [
          "Notice her attention span — not to worry about it, but to meet her exactly where she is",
          "Observe her relationship with natural materials: mud, leaves, water, stone",
          "Watch how she uses her hands to understand and make sense of the world",
          "Pay attention to her early language — the poetry in the questions she forms",
          "Notice how she responds to beauty: music, colour, changing light, texture",
        ],
        dadCarry: [
          "Take her outside every single day, even for just twenty minutes",
          "Let her touch and feel the world without immediately sanitizing everything",
          "Sing to her — early music is also early math, early language, early joy",
          "Be the safe person she can climb on, fall against, and trust completely",
          "Plant something together and tend it over months — let her see slow growth",
        ],
      },
      "3-5": {
        stage: "Open Curiosity — Preparing for the Open Classroom",
        schoolFocus: "Pre-Valley years: building self-directed attention, physical ease, and a genuine love of learning through play",
        childWorld: "She's absorbing the quality of your attention. The Valley child begins as a child who knows how to be curious without being anxious about it.",
        momWatch: [
          "Watch how she transitions between activities — gracefully or with friction?",
          "Notice her early math thinking: sorting, counting, comparing, ordering",
          "Observe how she relates to rules — does she understand why, or just comply?",
          "Pay attention to the stories she creates in her play — they reveal everything",
          "Notice her awareness of other children: compassion, curiosity, conflict",
        ],
        dadCarry: [
          "Build things: blocks, sand, mud, sticks. Tear them down. Build again.",
          "Take her to places where children and people are different from her — let her be curious",
          "Tell her stories about real people — including their struggles and doubts",
          "Let her make messes and then participate in cleaning them up",
          "Be predictable about big things and flexible about small ones",
        ],
      },
      "6-8": {
        stage: "Open Classroom (Classes I–IV) — Mixed-age, Self-directed Learning",
        schoolFocus: "Vertical groups across Classes I–IV; literacy and numeracy through inquiry; nature walks, art, music, dialogue circles",
        childWorld: "She's learning alongside older children and teaching younger ones. The classroom is a democracy of attention — everyone is both teacher and student.",
        momWatch: [
          "Watch how she's building relationships across age groups — not just her own",
          "Notice whether she's finding her own learning pace or rushing to match others",
          "Observe her in nature — is she noticing the small, quiet things?",
          "Pay attention to how she handles the open structure — does she find flow or flounder?",
          "Notice what she's excited to bring home and show you from school",
        ],
        dadCarry: [
          "Echo the school's 100-acre spirit — take her somewhere spacious and unhurried",
          "Build a small weekly nature ritual: name trees, count birds, watch the sky change",
          "Let her lead you somewhere — follow without correcting, without knowing better",
          "Ask her what she explained or taught to someone younger today",
          "Read books about the natural world together: field guides, nature poetry, explorers",
        ],
      },
      "9-11": {
        stage: "Middle School (Classes V–VII) — Emotional, Psychological, and Academic Balance",
        schoolFocus: "Subject deepening, field trips, arts, dialogue, ecology projects, Krishnamurti-influenced self-inquiry",
        childWorld: "The school explicitly names emotional and psychological growth alongside academics. She's learning to know herself — not just subjects.",
        momWatch: [
          "Notice how she's processing her interior life — is there language for what she feels?",
          "Watch how she relates to academic pressure — can she stay curious even when struggling?",
          "Observe whether she's finding mentors beyond you — teachers, older students, adults",
          "Pay attention to her relationship with failure and difficulty: avoidance or engagement?",
          "Notice when she's being authentic versus performing for an audience",
        ],
        dadCarry: [
          "Talk about emotions directly — your own, not just hers",
          "Find a craft or skill that demands patience and precision to work on together",
          "Let her be right about something you initially disagreed with — and say so clearly",
          "Help her understand what sustained work feels like — attention held over weeks",
          "Make sure she has physical outlets: movement matters especially at this age",
        ],
      },
      "12-15": {
        stage: "Senior School (Classes VIII–X) — ICSE With Krishnamurti's Spirit",
        schoolFocus: "Board curriculum carried without fear; arts, ecology, self-study, critical thinking, community responsibility",
        childWorld: "She's navigating the tension between board exam demands and the school's invitation to not reduce herself to marks. That tension itself is educational.",
        momWatch: [
          "Watch whether exam pressure is creating anxiety or being held in perspective",
          "Notice her relationship with comparison — to peers, to expectations, to her past self",
          "Observe how she's using creativity as both release and voice",
          "Pay attention to how she's forming her own values, independent of what you've said",
          "Notice what kind of conversations she seeks with adults",
        ],
        dadCarry: [
          "Actively protect her from the idea that her worth lives in her marks",
          "Tell her about things you care about that have nothing to do with success or achievement",
          "Take her on one trip this year that expands what she thinks the world is",
          "Be a model for how to work hard without losing yourself in it",
          "Have the conversations she initiates — even when they arrive at inconvenient times",
        ],
      },
    },
  },
  creative: {
    name: "Creative School",
    subtitle: "The Sacred Classroom — North Bangalore & Doddaballapur",
    tagline: "Whole child development: emotional, social, spiritual, physical, intellectual · Cambridge & State Board · 12:1 ratio",
    color: "#b94c36",
    schools: ["The Sacred Classroom, Yelahanka, Bangalore", "The Sacred Classroom, Doddaballapur", "Shibumi School, Bangalore", "Ekam School, Bangalore"],
    philosophy: [
      "The Sacred Classroom: every child is whole — not just academic potential to optimize",
      "Joy of Teaching: teachers have creative freedom, not scripted lesson delivery",
      "12:1 student-teacher ratio: each child is genuinely known by her teacher",
      "Eco-campus in North Bangalore: nature is embedded in the daily school rhythm",
      "Accredited by Cambridge International, Karnataka State Board, and NIOS",
    ],
    ages: {
      "0-2": {
        stage: "Before the Sacred Classroom — Your Arms Are the First School",
        schoolFocus: "Creative School begins around age 3. These first two years are the ground beneath the ground.",
        childWorld: "She's wiring her nervous system for safety, connection, and wonder. Everything else — every subject, every skill — comes from this ground.",
        momWatch: [
          "Notice how your own body responds to her distress — she reads it more fluently than words",
          "Watch the quality of your attention when you feed, bathe, and hold her",
          "Observe what genuinely delights her — light, music, faces, motion, certain voices",
          "Pay attention to your own emotional state — she co-regulates her nervous system with yours",
          "Notice how she explores the edge between safe and unknown — and what calls her further",
        ],
        dadCarry: [
          "Hold her often and with full attention — your physical presence is its own language",
          "Speak to her in a calm, warm voice even when narrating the most mundane things",
          "Create one reliable ritual that is just yours: a song, a game, a specific goodbye",
          "Protect the family's emotional atmosphere — your calm literally becomes her calm",
          "Notice how she lights up when you appear — honor that by showing up fully",
        ],
      },
      "3-5": {
        stage: "Early Years — The Sacred Classroom Begins",
        schoolFocus: "Emotional development, sensory and nature play, story, early social skills — the whole child in focus from day one",
        childWorld: "The school sees her as sacred — not a blank slate to fill but a whole being to know. This shapes how every teacher approaches every day with her.",
        momWatch: [
          "Watch how she's being seen by her teachers — does she feel genuinely known?",
          "Notice her emotional vocabulary: can she name what she feels with some specificity?",
          "Observe how she makes friends — what does she offer and what does she look for?",
          "Pay attention to her spiritual curiosity: wonder, awe, questions about why anything exists",
          "Notice how she inhabits her body — does she move with ease and confidence?",
        ],
        dadCarry: [
          "Ask her one real question every day about her inner world — and mean it",
          "Let her cry without rushing to fix it — sometimes she just needs to be held in it",
          "Take her to somewhere alive and growing: a garden, a farm, a forest",
          "Build physical rituals: a walk, a game, a weekend morning that belongs to you two",
          "Protect her right to say no to adults she doesn't feel safe with",
        ],
      },
      "6-8": {
        stage: "Primary School — Whole Child in Every Subject",
        schoolFocus: "Academic learning held inside emotional and creative development; small class sizes mean she's never anonymous",
        childWorld: "In a 12:1 classroom, her teacher actually knows her — knows what excites her, what frightens her, how she learns. This changes how learning feels.",
        momWatch: [
          "Notice how the school is responding to her specific, particular needs",
          "Watch for signs she feels genuinely known and not just managed",
          "Observe her growing emotional range — can she navigate complex, layered feelings?",
          "Pay attention to her creative output — it reveals what's alive in her right now",
          "Notice whether she's developing spiritual or philosophical curiosity",
        ],
        dadCarry: [
          "Attend one school event and stay the whole time — your presence is noticed and remembered",
          "Ask her what she made or created this week, not what grade she got",
          "Build something together: cook a new recipe, fix something broken, grow something",
          "Show her what it looks like to learn something new yourself — be a learner in front of her",
          "Create a weekly one-on-one ritual before it stops feeling natural to suggest",
        ],
      },
      "9-11": {
        stage: "Middle School — Identity, Values, and Creative Voice",
        schoolFocus: "Subject depth, emotional intelligence curriculum, creative expression as core, Life and Living as a real subject",
        childWorld: "At Creative School, 'Life and Living' is an actual subject. She's learning who she is, what she values, and how to be in the world — formally.",
        momWatch: [
          "Watch how her identity is forming — what does she say she is and isn't?",
          "Notice her creative life outside school — what she makes purely for herself",
          "Observe how she handles peer pressure and the pull of social belonging",
          "Pay attention to her moral reasoning — is it deepening or staying on the surface?",
          "Notice what questions about life and meaning she's quietly sitting with",
        ],
        dadCarry: [
          "Have a real conversation about what you believe matters — not rules, but actual values",
          "Support one creative interest with genuine resources, time, and your attention",
          "Let her challenge your assumptions — this is intelligence emerging, not disrespect",
          "Be the parent who shows up, not just the one who provides",
          "Watch her closely enough to notice what's changing this year — and name what you see",
        ],
      },
      "12-15": {
        stage: "Senior School — Sacred Self in a Complicated World",
        schoolFocus: "Cambridge or State Board exams held inside a whole-person framework; social-emotional learning, leadership, creative depth",
        childWorld: "She's navigating the world's expectations alongside the school's invitation to remain whole. That tension — not resolving it — is the real curriculum.",
        momWatch: [
          "Notice whether she's shrinking to fit expectations or expanding into who she actually is",
          "Watch how she's managing stress — does she have real tools or just pressure and no outlet?",
          "Observe her relationships: are they nourishing her or quietly draining her?",
          "Pay attention to her sense of meaning — what genuinely makes her feel alive?",
          "Notice what she's becoming that you didn't teach her — honour that",
        ],
        dadCarry: [
          "Be genuinely proud of things that aren't achievements or accomplishments",
          "Help her understand the difference between pleasing people and being true to herself",
          "Protect time for depth this year: long conversations, long walks, long projects",
          "Tell her one thing you genuinely admire about who she is — not what she does",
          "Show her that adulthood is not the end of growing into yourself",
        ],
      },
    },
  },

  // ── Waldorf ──────────────────────────────────────────────────────────────────
  waldorf: {
    name: "Waldorf / Steiner",
    subtitle: "Rudolf Steiner · 7-year developmental cycles · arts-integrated",
    tagline: "Human development unfolds in 7-year rhythms — will, feeling, thinking — and education must meet each stage where it actually lives",
    color: "#7a4f1e",
    schools: ["Prakriya Waldorf, Bangalore", "Waldorf School Mumbai", "Bangalore Waldorf Education Initiative", "Shishuvan (Waldorf-inspired), Mumbai", "The Orchid School (Waldorf elements), Pune"],
    philosophy: [
      "Three 7-year phases: 0–7 (will, imitation), 7–14 (feeling, artistic), 14–21 (thinking, concept)",
      "No reading instruction before age 7 — imaginative play IS the cognitive work of early childhood",
      "All subjects taught through art: math through rhythm, history through story, science through observation",
      "No textbooks — children create their own Main Lesson Books through drawing, writing, painting",
      "Rhythm of day and season matters deeply; festivals mark natural cycles and build inner calendar",
    ],
    ages: {
      "0-2": {
        stage: "The First Seven Years Begin — Will and Imitation",
        schoolFocus: "Waldorf begins at age 3–4 (Kindergarten). These years are entirely your responsibility to protect.",
        childWorld: "She is pure imitation. She doesn't learn from what you teach her — she learns from who you are when you think no one is watching. Your quality of movement, voice, and mood is her curriculum.",
        momWatch: [
          "Watch how she imitates you — every gesture, tone, and habit is being absorbed and replicated",
          "Notice the quality of her play: is it free, sustained, imaginative, or scattered and seeking stimulation?",
          "Observe her relationship with rhythm — regular mealtimes, sleep, and seasonal ritual are deeply settling",
          "Pay attention to what she takes in from screens and sound — Waldorf says this is especially damaging before 7",
          "Notice her relationship with natural materials: wood, water, cloth, stone versus plastic",
        ],
        dadCarry: [
          "Slow down around her — your pace and quality of presence shapes her nervous system more than any activity",
          "Do real work in her presence and let her participate: cooking, gardening, woodwork, craft",
          "Tell her stories — no books, no screens, just your voice and imagination. This is Waldorf's earliest gift",
          "Protect her from overstimulation: Waldorf parents are guardians of simplicity at this stage",
          "Sing to her every day — Waldorf sees lullabies and songs as developmental nourishment, not entertainment",
        ],
      },
      "3-5": {
        stage: "Waldorf Kindergarten — Imagination, Rhythm, and Free Play",
        schoolFocus: "Waldorf Kindergarten: seasonal festivals, free play, beeswax modelling, wet-on-wet watercolour, circle time with songs and movement, no letters or numbers yet",
        childWorld: "She lives entirely in imagination. Play is her work — not metaphorically, but biologically. The gnomes and fairies she believes in are how she's making sense of inner forces she can't yet name.",
        momWatch: [
          "Watch the quality of her imaginative play — richness here predicts creative capacity later",
          "Notice how she's absorbing the rhythm of the week: does she know 'bread day' and 'painting day'?",
          "Observe her relationship with story — can she hold the thread of a long, unillustrated tale?",
          "Pay attention to her hands: is she working with them, making things, transforming materials?",
          "Notice if anyone is rushing her toward letters and numbers — Waldorf asks you to resist this",
        ],
        dadCarry: [
          "Build things with her: wood, clay, wax, natural materials. Her hands are her thinking at this age",
          "Tell her a continuing story over many evenings — she'll ask you to carry the characters forward",
          "Introduce seasonal rhythms: plant seeds in spring, collect leaves in autumn, make something for each festival",
          "Limit screens firmly — Waldorf considers this the most protective thing parents can do before age 7",
          "Let her see you working with your hands: cooking, repairing, building, crafting",
        ],
      },
      "6-8": {
        stage: "Class 1–2 — The Change of Teeth and the Start of Formal Learning",
        schoolFocus: "Class 1: letters through pictorial images (A as Eagle, B as Bear); numbers through stories; Main Lesson blocks; circle time, form drawing, artistic eurythmy",
        childWorld: "The second set of teeth arriving marks readiness for formal learning — Waldorf reads it as a signal from the body, not just biology. She's crossing from pure imagination into imagination-with-form.",
        momWatch: [
          "Notice how she's taking to reading and writing — in Waldorf it comes through images, not phonics drills",
          "Watch her relationship with her Main Lesson Book — does she care for it, take pride in it?",
          "Observe her capacity for sustained attention during stories, even long ones",
          "Pay attention to her social world — Class 1 is when lasting friendships often begin to form",
          "Notice how she responds to rhythm and music — these are the doorways to math and language in Waldorf",
        ],
        dadCarry: [
          "Read to her every night — long books, chapter by chapter, without pictures sometimes",
          "Ask her to tell you what she's learning in story form — she should be able to narrate it",
          "Find handwork to do together: knitting, whittling, building — cognitive development comes through the hands in Waldorf",
          "Protect weekends from over-scheduling — Waldorf children need unstructured time as much as curriculum",
          "Attend school festivals with full presence — the rhythm of the year is the backbone of Waldorf education",
        ],
      },
      "9-11": {
        stage: "Class 3–5 — The Rubicon: Self-Consciousness Arrives",
        schoolFocus: "Class 3: Old Testament stories, farming and shelter, measurements; Class 4: local geography, Norse myths; Class 5: Ancient civilisations, botany, free-hand geometry",
        childWorld: "Around age 9, a shift: she suddenly feels separate from the world and from her parents. Waldorf teachers prepare for 'the nine-year change' — a sense of aloneness, of paradise lost. It's developmental and healthy.",
        momWatch: [
          "Watch for the 9-year shift: criticism of parents, a sudden sense of being different and alone — meet it with warmth, not alarm",
          "Notice how she's building her independent judgement — she should begin to form her own opinions",
          "Observe her relationship with the natural world: botany and geography in Class 4–5 are meant to ground her",
          "Pay attention to craft skills — knitting, crochet, woodwork — and whether she's finding satisfaction in making",
          "Notice which teacher she trusts, which stories she returns to — these are her inner anchors",
        ],
        dadCarry: [
          "Name the nine-year change if it comes: 'I know you're feeling something new. That's normal. I'm still here.'",
          "Introduce her to your work in depth — Class 3's farming/shelter curriculum asks what meaningful work is",
          "Find a physical skill to build together: carpentry, repair, cooking from scratch",
          "Tell her true stories from your own childhood, including the hard ones",
          "Make sure her hands are busy and productive — idle hands genuinely bother a Waldorf child at this age",
        ],
      },
      "12-15": {
        stage: "Class 6–8 — The Feeling Life Deepens; Thinking Begins to Wake",
        schoolFocus: "Class 6: Rome, physics, mineralogy, business math; Class 7: Renaissance, chemistry, perspective drawing; Class 8: modern history, anatomy, physics intensifies",
        childWorld: "The third 7-year cycle begins. Thinking starts to become her own — not received, but constructed. She's testing authorities, including Waldorf's. This is healthy and exactly what the curriculum is designed for.",
        momWatch: [
          "Watch how she's handling the intensity of adolescent feeling — Waldorf aims to educate through art, not suppress through rules",
          "Notice her relationship with her own creative work: is she finding voice, or hiding it?",
          "Observe how she's questioning — both the school and you. Can you meet her questions with genuine curiosity?",
          "Pay attention to her physical development and whether the school is addressing it with age-appropriate openness",
          "Notice which subjects have come alive for her — these are her doorways into her own destiny",
        ],
        dadCarry: [
          "Take her intellectual world seriously — the ideas she's encountering in Class 7–8 are genuinely big",
          "Find a project that spans months and requires real skill: building, research, performance, craft",
          "Talk about history, ethics, and your own view of the world — she's ready for your real opinions",
          "Protect her right to her own aesthetic judgement — she should be forming taste, not just receiving it",
          "Be the person who stays curious about her, even when she's difficult to reach",
        ],
      },
    },
  },

  // ── Tagore / Shantiniketan ────────────────────────────────────────────────────
  tagore: {
    name: "Tagore / Shantiniketan",
    subtitle: "Rabindranath Tagore · Visva-Bharati · West Bengal",
    tagline: "Learning happens under open skies, through music, poetry, and the meeting of East and West — the child is a lamp to be lit, not a vessel to be filled",
    color: "#c46a1e",
    schools: ["Visva-Bharati, Santiniketan, West Bengal", "Patha Bhavana (Santiniketan primary school)", "Tagore International School, New Delhi", "Rabindra Bharati (arts tradition)", "Subramania Bharati schools (Tamil Nadu, Tagore-inspired)"],
    philosophy: [
      "Mukta Pathsala — the open school: learning happens outdoors, under trees, in nature's classroom",
      "Arts (music, dance, drawing, poetry) are not extras — they are the primary language of learning",
      "The child learns best through joy, not fear — remove the artificial walls between life and education",
      "Education must connect the child to her community, her land, and the living world around her",
      "Universal humanism: Indian tradition and world culture held together without hierarchy",
    ],
    ages: {
      "0-2": {
        stage: "The First Songs — Establishing a Musical and Sensory World",
        schoolFocus: "Tagore believed a child's first years are shaped by song, nature, and loving presence. No formal school yet — this is the home's poetry.",
        childWorld: "She is absorbing the aesthetics of your home — the music, the spoken word, the colours, the garden or its absence. Tagore would say: begin with beauty.",
        momWatch: [
          "Notice what she is drawn to aesthetically — colour, sound, texture, light. These are early signs of her artistic temperament",
          "Watch how she responds to music and song — Rabindra Sangeet was designed for children to absorb before they understood words",
          "Observe her relationship with natural things: flowers, rain, mud, birds. These are Tagore's first lessons",
          "Pay attention to the emotional quality of your home — Tagore believed home atmosphere is the child's first poem",
          "Notice how she communicates feeling through gesture, movement, and expression before words",
        ],
        dadCarry: [
          "Sing to her — not children's TV songs, but actual songs from your tradition. Folk songs, devotional songs, whatever your roots hold",
          "Take her outside every day with genuine attention, not just for exercise",
          "Tell her the names of things in your mother tongue alongside English — this is Tagore's bridge between worlds",
          "Create beauty in the home: a vase with a flower, a piece of handmade cloth. She is drinking in aesthetics",
          "Let her hear you and your partner speak with warmth — the music of relationship is her earliest language class",
        ],
      },
      "3-5": {
        stage: "The Outdoor Years — Stories, Songs, and the Living World",
        schoolFocus: "Tagore's vision for early childhood: learn through play, song, seasonal celebration, storytelling, and direct contact with nature. No pressure, no worksheets.",
        childWorld: "She wants to be told stories and to tell them back. She wants to dance and run and look at things closely. Tagore built Shantiniketan for exactly this child.",
        momWatch: [
          "Watch her relationship with stories — does she want them told, not read? Can she retell them?",
          "Notice which elements of nature she notices without prompting: ants, clouds, the monsoon smell",
          "Observe her movement — is she expressive, physical, comfortable in her body?",
          "Pay attention to her drawing and painting — do not correct it, only celebrate it",
          "Notice if she's making up songs and rhymes spontaneously — this is high Tagore",
        ],
        dadCarry: [
          "Teach her a folk song from your state in your mother tongue — this is exactly what Tagore asked parents to do",
          "Take her somewhere with real nature monthly — even a lake, a riverbank, a village field",
          "Tell her Indian folk tales and mythological stories without moralising — let the story do its work",
          "Draw and paint together with zero agenda — the mess is the point",
          "Let her help with household rituals: lighting lamps, decorating for festivals, cooking seasonal foods",
        ],
      },
      "6-8": {
        stage: "Mukta Pathsala — Learning Under Open Skies",
        schoolFocus: "Shantiniketan classes are held outdoors under trees. Subjects taught through art, music, and nature observation. Morning prayers (Brahmo) and seasonal festivals anchor the calendar.",
        childWorld: "She's beginning to sense the connection between things — between a song and a feeling, between a season and a story. Tagore's school tries to make these connections visible and alive.",
        momWatch: [
          "Watch how she's taking to music or dance at school — in Tagore's vision these are not optional",
          "Notice her relationship with her mother tongue: is she developing pride and fluency in Bengali / your state language?",
          "Observe how she relates to India's multiple traditions — the syncretism that Tagore embodied",
          "Pay attention to whether she's finding joy in learning or just compliance",
          "Notice her poetry and drawing — this is how a Tagore-educated child processes the world",
        ],
        dadCarry: [
          "Visit museums, concerts, cultural performances with genuine engagement — not just as enrichment but as family life",
          "Learn something from her school arts curriculum alongside her: a song, a mudra, a seasonal craft",
          "Talk about Indian history with nuance and love — neither pure pride nor pure shame, but curiosity",
          "Keep the outdoors as her real classroom on weekends: park, farm, river, hill",
          "Read Tagore's stories for children together — they are still some of the most beautiful in the world",
        ],
      },
      "9-11": {
        stage: "Finding Voice — Arts, Language, and Community",
        schoolFocus: "Deeper arts specialization, Indian literature and world literature, community service projects, seasonal festivals, language immersion in Bengali/Sanskrit and English",
        childWorld: "She's developing her own aesthetic sensibility — a taste for beauty, an instinct for what moves her. Tagore would say: this is the beginning of real education.",
        momWatch: [
          "Watch which art form she is most drawn to — this deserves serious support, not just encouragement",
          "Notice how she's absorbing Indian classical tradition versus Western influences — both matter in Tagore's vision",
          "Observe her relationship with language: is she writing, reading poetry, playing with words?",
          "Pay attention to her social sensitivity — Tagore-educated children often develop a heightened ethical awareness",
          "Notice whether she has a relationship with the natural world as a living, personal thing — not just background",
        ],
        dadCarry: [
          "Take her to a classical music or dance performance — sit with her in it, even if it's unfamiliar",
          "Give her paper, paint, an instrument — protect time for unscheduled, unpressured creative work",
          "Tell her about your own region's folk traditions: your state's music, textiles, festivals, foods",
          "Have a conversation about what India means — not the textbook answer, but what it personally means to you",
          "Connect her to older relatives who carry oral tradition — grandparents, aunts, neighbours who tell stories",
        ],
      },
      "12-15": {
        stage: "Becoming — Art, Ethics, and an Integrated Self",
        schoolFocus: "Literature, philosophy, classical arts, ecology, cross-cultural understanding, community engagement, self-directed project work",
        childWorld: "She is beginning to ask who she is across cultures, traditions, and time. Tagore's deepest gift at this age is permission to be complex: Indian and global, traditional and original.",
        momWatch: [
          "Watch how she's forming her identity in relation to Indian culture — with pride, ambivalence, curiosity, or rejection",
          "Notice her creative work: writing, performance, visual art. Is she finding her own voice within a tradition?",
          "Observe her ethical sensibility — is she developing care for community, for the environment, for the less visible?",
          "Pay attention to how she handles contradiction — Indian and modern, traditional and questioning",
          "Notice who inspires her — these are the lodestars of her developing self",
        ],
        dadCarry: [
          "Share your own encounter with Indian culture honestly — what you love, what troubles you, what you hold loosely",
          "Help her find a creative mentor or guru in her art form — Tagore believed in the transmission of living tradition",
          "Talk about the world with her: politics, injustice, beauty, loss. She is ready for your real views",
          "Protect time for her art — do not let boards or career pressure crowd it out entirely",
          "Let her see that a person can be deeply rooted and widely open at the same time",
        ],
      },
    },
  },

  // ── Gurukul Parampara ─────────────────────────────────────────────────────────
  gurukul: {
    name: "Gurukul Parampara",
    subtitle: "Ancient Indian Tradition · Guru-Shishya · Residential & Home Practice",
    tagline: "The guru is not a teacher of subjects — the guru is a living example. The student doesn't just learn from the guru; the student learns to become",
    color: "#3d6b4f",
    schools: ["Samskrita Bharati Gurukulas (pan-India)", "Chinmaya Vidyalayas (Gurukul tradition)", "Sri Sharada Ashram Gurukul, Sringeri", "Nalanda Gurukul, Hyderabad", "Sandipani Vidyaniketan, Porbandar", "Veda Pathshala network (Tamil Nadu, Karnataka)"],
    philosophy: [
      "Guru-shishya parampara: knowledge is transmitted through relationship and living example, not text alone",
      "Vidya is not information — it is the transformation of the student's character, perception, and dharma",
      "The four purusharthas (Dharma, Artha, Kama, Moksha) as the integrated framework for a whole life",
      "Brahmacharya in the early years: discipline, simplicity, and focus are protective gifts, not restrictions",
      "Sanskrit as a cognitive tool: the structure of the language trains precision, memory, and pattern recognition",
    ],
    ages: {
      "0-2": {
        stage: "Samskara — The First Impressions That Last a Lifetime",
        schoolFocus: "The Gurukul tradition recognises that the home is the first ashram. The sixteen samskaras begin before birth — the quality of the home environment in these years is the first curriculum.",
        childWorld: "She is forming impressions (samskaras) at a cellular level. The mantras she hears, the energy of the home, the touch of loving hands — these become her foundation before she has a word for anything.",
        momWatch: [
          "Notice the quality of the sound environment: what mantras, music, and conversation fill the home?",
          "Watch how she responds to Sanskrit sounds or devotional chanting — the rhythm and resonance are developmental tools",
          "Observe how daily rituals (morning lamp, evening prayer, seasonal festivals) settle her nervous system",
          "Pay attention to the consistency of her caregiving — samskara means 'putting together well', and it happens through repetition",
          "Notice her early curiosity about the living world: plants, animals, sky, fire, water — these are the first elements of a Vedic worldview",
        ],
        dadCarry: [
          "Establish morning and evening rituals with her, however simple: a lamp, a prayer, a moment of stillness",
          "Chant or hum Sanskrit shlokas in her presence — not for religious instruction, but for the cognitive effect of the sound structure",
          "Be the kind of man she would want to learn from — because in this tradition, what you are matters more than what you teach",
          "Reduce noise, screens, and artificial stimulation — the Gurukul ideal begins with simplicity",
          "Plant something and tend it with her — the earth is among the most important teachers in this tradition",
        ],
      },
      "3-5": {
        stage: "Akshara Abhyasa — First Encounters with Knowledge",
        schoolFocus: "In the traditional calendar, the Aksharabhyasa (first writing ceremony) happens around age 5. Until then: stories, slokas, songs, movement, and direct sensory learning in nature.",
        childWorld: "She's ready to begin absorbing structured knowledge — but the Gurukul tradition says 'begin with the whole, not the part'. Stories of dharma and the cosmos before the alphabet.",
        momWatch: [
          "Notice her memory: can she retain slokas and songs? This is the foundation for later Vedic study",
          "Watch how she absorbs moral stories — the Panchatantra and Jataka tales are not entertainment here, they are ethical training",
          "Observe her relationship with discipline: not punitive, but the natural discipline of routine and ritual",
          "Pay attention to her speech: clear articulation, good breathing, and musical quality of voice are cultivated early",
          "Notice her relationship with elders — in this tradition, respect for the guru line is taught by how parents relate to those older and wiser",
        ],
        dadCarry: [
          "Teach her two or three Sanskrit shlokas by heart — make it a game, not a task. Memory is a muscle trained in childhood",
          "Tell her the Panchatantra and Ramayana stories as bedtime stories — let the characters live in her imagination",
          "Establish simple daily discipline: waking early, eating with gratitude, a moment of prayer before study",
          "Let her see you learning and studying something — the student posture before a teacher is something children absorb by observation",
          "Visit a temple, a Vedapatasala, or an ashram with her — not for religion, but for the experience of living tradition",
        ],
      },
      "6-8": {
        stage: "Brahmacharya Ashrama — The Student Stage Begins",
        schoolFocus: "In the Gurukul tradition, this is when formal study begins under a guru. At home: establish a study environment, begin Sanskrit basics, cultivate discipline and devotion to knowledge.",
        childWorld: "She has entered the student stage. In the old tradition, this meant leaving home; in modern practice, it means establishing the student's discipline and reverence for knowledge as a way of life.",
        momWatch: [
          "Watch her relationship with her teachers — does she approach them with curiosity and respect?",
          "Notice her capacity for memorisation: Gurukul trained the mind through oral transmission. Stories, shlokas, multiplication tables learnt by heart",
          "Observe whether she's developing a daily study rhythm — the Gurukul student studies at the same times each day",
          "Pay attention to her posture and breathing: the Gurukul tradition knew that how the body holds itself affects how the mind receives",
          "Notice her growing sense of dharma — what she believes is right, fair, and true",
        ],
        dadCarry: [
          "Establish a dedicated study space that is clean, simple, and respected — the Gurukul environment was not casual",
          "Study alongside her: read, practise something, demonstrate that learning is a lifelong commitment",
          "Continue Sanskrit shlokas: Bhagavad Gita, Subhashitas, or Vedic hymns — even one verse a week builds a lifelong relationship",
          "Talk about dharma concretely: what was the right thing to do in a situation she faced today?",
          "Find a genuine guru for her in whatever she is passionate about — music, dance, chess, language. The guru relationship is irreplaceable",
        ],
      },
      "9-11": {
        stage: "Deepening Study — Shastra and Self",
        schoolFocus: "In the full Gurukul curriculum, this is when the shastras (texts) deepen; grammar, logic, mathematics, and the Vedic sciences begin. In modern home practice: study ethics, philosophy, and the arts alongside academics.",
        childWorld: "She's ready for the big questions that the Gurukul tradition was built to answer: What is real? What is good? What is my duty? What am I for? Don't dismiss these — engage them.",
        momWatch: [
          "Notice when she asks existential questions — the Gurukul tradition says this is the peak readiness for philosophical study",
          "Watch how she's integrating her inner life with her academic life — in Vedic education, the two are never separate",
          "Observe her relationship with discipline: does she have self-discipline now, or only external compliance?",
          "Pay attention to her relationship with the body — yoga, pranayama, and physical care were always part of Gurukul",
          "Notice what she wants to master — the Gurukul tradition says deep mastery of one thing is better than shallow exposure to many",
        ],
        dadCarry: [
          "Introduce her to the Bhagavad Gita — not as scripture to be believed, but as philosophy to be engaged with",
          "Begin yoga or meditation with her: even 10 minutes daily changes something fundamental at this age",
          "Find a guru or master practitioner in her chosen art or discipline — arrange regular, sustained learning",
          "Discuss the four purusharthas: what is wealth for, what is pleasure for, what is duty, what is liberation?",
          "Take her to a living tradition — a classical concert, a Vedapatasala, a dharmic pilgrimage, an artisan at work",
        ],
      },
      "12-15": {
        stage: "Viveka — Discrimination, Purpose, and the Beginning of Wisdom",
        schoolFocus: "The Gurukul tradition prepared students for Grihastha (householder) life — not just career, but purposeful, dharmic living. This is when the why of education becomes as important as the what.",
        childWorld: "She is beginning to discern: between real and unreal, between lasting and temporary, between her own voice and the noise around her. The Gurukul tradition calls this viveka — discrimination — and it is the beginning of wisdom.",
        momWatch: [
          "Watch whether she is developing viveka — the ability to distinguish what matters from what doesn't",
          "Notice her relationship with ambition: is it driven by dharma or by ego and comparison?",
          "Observe her creative and spiritual life — the Gurukul tradition held that art and spirituality are not separate paths",
          "Pay attention to who she's choosing as influences, mentors, and peers — this is when the guru relationship becomes self-chosen",
          "Notice how she handles temptation, distraction, and peer pressure — this is where the brahmacharya discipline either holds or doesn't",
        ],
        dadCarry: [
          "Talk about your own life with honesty: what you were at her age, what you chose, what you wish you'd understood earlier",
          "Help her identify her svadharma — her own unique gift and duty — and take it seriously",
          "Continue or deepen a shared study: philosophy, classical music, language, a text. Let her see sustained practice in your life",
          "Talk about service: the Gurukul tradition ended with dakshina — giving back. What does she want to give?",
          "Be a man whose life answers the questions she's beginning to ask — not perfectly, but genuinely",
        ],
      },
    },
  },

  // ── Jain Home Wisdom ──────────────────────────────────────────────────────────
  jain: {
    name: "Jain Home Wisdom",
    subtitle: "Gujarat · Rajasthan · Ahimsa, Anekantavada, Aparigraha",
    tagline: "The child who learns non-violence from the inside out — in thought, word, and action — carries the most ancient technology for human flourishing",
    color: "#6b3e8e",
    schools: ["Shrimad Rajchandra Mission schools (Gujarat)", "Jain Vishva Bharati, Ladnun (Rajasthan)", "Veerayatan, Bihar (Jain tradition)", "Mahavir Jain Vidyalaya, Mumbai", "Home practice networks — Paryushana-based learning"],
    philosophy: [
      "Ahimsa (non-violence) as the primary ethic — not just physical, but in thought, speech, and relationship",
      "Anekantavada: the many-sidedness of truth — no single perspective holds the whole reality",
      "Aparigraha (non-possessiveness): the practice of holding things lightly, giving, and simplicity",
      "Swadhyaya (self-study): daily reflection, introspection, and the cultivation of inner witness",
      "Paryushan and Samvatsari: annual practices of forgiveness, fasting, and renewal that ground the family in ethical time",
    ],
    ages: {
      "0-2": {
        stage: "The First Seeds of Ahimsa — Quality of Relationship",
        schoolFocus: "No formal Jain education yet. The home is the first sangha. These years plant seeds of empathy, gentleness, and presence.",
        childWorld: "She is forming her earliest sense of how beings should treat each other. Every interaction she observes between her parents is teaching her the ahimsa she will or won't embody later.",
        momWatch: [
          "Notice how conflict is handled in the home — she is absorbing the texture of relationship long before words",
          "Watch her response to insects, animals, small living things — this is where ahimsa begins to be taught or not",
          "Observe the sensory environment: Jain families traditionally emphasise simplicity, vegetarian fragrance, and calm sound",
          "Pay attention to how you speak about others in her presence — this shapes her inner speech patterns",
          "Notice her natural capacity for stillness and attention — it is a gift to be cultivated, not filled",
        ],
        dadCarry: [
          "Resolve conflict with your partner gently and in her presence occasionally — she needs to see repair, not just harmony",
          "Introduce her gently to small creatures: ants, earthworms, garden birds. Let her see care for small lives",
          "Establish a simple pre-meal practice: gratitude, awareness of where food came from",
          "Limit possessions consciously — Jain homes practise aparigraha by not accumulating unnecessary things",
          "Be the calm, warm presence that teaches her the world is fundamentally safe",
        ],
      },
      "3-5": {
        stage: "The Language of Kindness — Ahimsa in Everyday Life",
        schoolFocus: "Jain education begins with the Paryushan stories (Mahavira's life), the Navkar Mantra by heart, and daily practice of gentleness in word and action — all at home.",
        childWorld: "She's ready to understand that words can hurt and words can heal. The Jain tradition teaches this very early — ahimsa of speech is as important as ahimsa of action.",
        momWatch: [
          "Listen to how she speaks to siblings, friends, and the household help — this is her ahimsa in practice",
          "Notice her response when she accidentally harms something — guilt (punishing) vs. care (healing)?",
          "Watch her relationship with possessions — is she already attached or does she share and let go?",
          "Observe how she handles being wronged — does she forgive, hold, or escalate?",
          "Pay attention to her capacity for silence and sitting still in prayer or reflection",
        ],
        dadCarry: [
          "Teach her the Navkar Mantra — not as obligation but as a daily beautiful sound with her. 'Namo Arihantanam…'",
          "Tell her Mahavira's stories — particularly his years of silence and non-harm — as bedtime stories",
          "Model aparigraha: when she wants yet another toy, have a genuine conversation about enough",
          "Begin a small Paryushan ritual at home: light a lamp, ask forgiveness from each other — even in simplified form",
          "Let her see you apologise genuinely — to her, to your partner. This is ahimsa in action",
        ],
      },
      "6-8": {
        stage: "Swadhyaya Begins — Self-observation and Ethics in Daily Life",
        schoolFocus: "Daily Pratikramana (reflection on actions of the day), Jain pathsala study, understanding ahimsa in food, speech, and action, early anekantavada practice through listening to different views",
        childWorld: "She's ready for the concept that there are many sides to every truth. Anekantavada taught early doesn't produce relativism — it produces genuine humility and curiosity.",
        momWatch: [
          "Watch how she handles being wrong — can she revise her view without shame?",
          "Notice her food consciousness: the Jain tradition teaches children why the food they eat is a moral choice",
          "Observe her practice of Pratikramana if she attends pathsala — or introduce a simple evening review at home",
          "Pay attention to her relationship with winning and competition — the Jain tradition is deeply suspicious of both",
          "Notice her truthfulness — the Jain satya (truth) practice means speaking carefully, not just accurately",
        ],
        dadCarry: [
          "Begin a simple evening reflection: 'Where did I cause harm today, even accidentally? Where did I show kindness?'",
          "Have genuine anekantavada conversations: 'What might the other person have been thinking?' — about real conflicts",
          "Take her to the Jain temple not just for ritual but to talk about what the Tirthankaras represent as ideals",
          "Practice giving with her: a regular donation practice, including her pocket money",
          "Model Paryushan: ask forgiveness genuinely from her and from your partner during the festival. This is the deepest teaching",
        ],
      },
      "9-11": {
        stage: "Deeper Ethics — Anekantavada, Aparigraha, and the Inner Life",
        schoolFocus: "Philosophy of the Tattvartha Sutra in simplified form, deeper understanding of karma and its mechanisms, ecological ahimsa, sustained practice of non-possessiveness",
        childWorld: "She's ready to understand karma not as fate but as the accumulation of actions — and that she has genuine agency over her own character. This is empowering, not fatalistic.",
        momWatch: [
          "Watch how she's developing her ethical reasoning — not just following rules but understanding why",
          "Notice her relationship with material desires — is she developing her own sense of enough?",
          "Observe how she relates to those with less: friends at school, household staff, those in need",
          "Pay attention to her relationship with anger — the Jain tradition sees anger as the most harmful passion",
          "Notice her capacity for forgiveness: Samvatsari is the annual moment, but can she forgive in daily life?",
        ],
        dadCarry: [
          "Introduce the concept of karma practically: show her how her actions of last week created situations this week",
          "Deepen the Paryushan practice: fast one day together, do the full Pratikramana, attend the lecture",
          "Talk about what you own and why: which possessions genuinely serve your life, which are just accumulation",
          "Discuss Anekantavada with a real example from news or family life: what does the other side actually believe and why?",
          "Find a Jain elder or scholar she can sit with and ask questions — the living tradition matters more than texts",
        ],
      },
      "12-15": {
        stage: "Viveka and Vairagya — Discernment and the Beginning of Renunciation of the Unnecessary",
        schoolFocus: "Philosophical study of Jain texts, understanding of monastic ideals as an inspiration (not necessarily a goal), social responsibility and seva, deepening personal ethical practice",
        childWorld: "She's at the age where the Jain tradition's highest ideals — total non-violence, non-possession, and truth-telling — become living questions rather than inherited rules. She needs to own them, not just repeat them.",
        momWatch: [
          "Notice how she's internalising Jain values versus just performing them for family approval",
          "Watch her relationship with her own mind: the Jain tradition sees the untrained mind as the source of all harm",
          "Observe her response to injustice — is it anger or ahimsic engagement?",
          "Pay attention to how she handles the tension between Jain simplicity and modern ambition",
          "Notice who she looks to as a role model — and whether those people embody the values you've tried to pass on",
        ],
        dadCarry: [
          "Have the honest conversation: how do you hold Jain values in a materialistic world? Share your own struggle",
          "Introduce her to the life of a Jain muni or sadhvi — not to recruit her to monasticism, but to show what full commitment looks like",
          "Help her find her own interpretation of Jain ethics: what does ahimsa mean in her generation, in her career choices?",
          "Practice Paryushan fully together: it is the most powerful family ritual the tradition offers",
          "Tell her what your own grandmother or grandfather's Jain practice looked like — the living transmission is irreplaceable",
        ],
      },
    },
  },

  // ── Reggio Emilia ─────────────────────────────────────────────────────────────
  reggio: {
    name: "Reggio Emilia",
    subtitle: "Loris Malaguzzi · Northern Italy · Child as Protagonist",
    tagline: "The child has a hundred languages — painting, clay, song, shadow, movement, mathematics, poetry — and the school must honour all hundred, not reduce them to two",
    color: "#8b1a1a",
    schools: ["Inventure Academy, Bangalore (Reggio-inspired)", "Little Elly, Bangalore", "Kangaroo Kids (Reggio elements)", "Podar Jumbo Kids", "Green Meadows, Chennai", "The Learning Curve, Bangalore"],
    philosophy: [
      "The child as protagonist: she is strong, capable, and full of potential — not empty to be filled",
      "The environment as the third teacher: thoughtfully designed space communicates what is valued",
      "Documentation: teachers observe, record, and make learning visible — assessment through story, not test",
      "Long-term projects (progettazione): deep inquiry over weeks and months, following the child's own questions",
      "Community and relationship: learning happens in relationship — with peers, teachers, families, and the city itself",
    ],
    ages: {
      "0-2": {
        stage: "The Hundred Languages Begin — Sensory Intelligence",
        schoolFocus: "Reggio's nido (infant-toddler centres) begin from 3 months. The emphasis: rich sensory environments, relationship, and the documentation of each child's unique way of knowing.",
        childWorld: "She is already communicating in her hundred languages: her hands reaching, her gaze fixing, her sound-making, her movement. Reggio says: observe and respond to all of them, not just the verbal ones.",
        momWatch: [
          "Watch all her modes of expression: not just language but gesture, facial expression, touch, and movement",
          "Notice what she spends sustained attention on — this is documentation in its simplest form",
          "Observe the physical environment you've created: does it invite exploration, or close it down?",
          "Pay attention to how she uses her hands — Reggio sees the hand as the instrument of intelligence",
          "Notice the pace of your interactions: Reggio slows down to honour each child's tempo",
        ],
        dadCarry: [
          "Create a corner of the home that is genuinely hers to explore: varied materials, different textures, safe objects from the natural world",
          "Observe rather than direct — resist the urge to show her how things work and let her discover",
          "Make light and shadow part of her play: a torch, sunlight through a jar of water. These are Reggio's first art materials",
          "Slow down your speech and your movements around her — she takes everything in",
          "Document moments: take a photo of what she's concentrated on. Over time this builds a record of her intelligence",
        ],
      },
      "3-5": {
        stage: "The Atelier Opens — A Hundred Languages in Full Voice",
        schoolFocus: "Reggio preschools: the atelier (studio space) with a resident atelierista (artist-teacher), clay, light tables, natural materials, long-term project work following children's genuine questions",
        childWorld: "She has questions — about shadows, about why the sky is blue, about what's inside things. Reggio's genius is to take those questions seriously enough to build months of learning around them.",
        momWatch: [
          "Watch what she's genuinely curious about — not just briefly interested in, but returning to again and again",
          "Notice how she uses different materials: does she approach clay differently than paint differently than sand?",
          "Observe her in collaboration with one other child — this is where Reggio sees the richest learning",
          "Pay attention to her theories: 'I think the moon follows us because…'. These deserve real engagement, not correction",
          "Notice how she documents her own learning: children naturally draw what they're figuring out",
        ],
        dadCarry: [
          "Set up an art corner with real materials: clay, watercolour, charcoal, natural objects, wire, cloth",
          "Ask her what she's thinking about and actually listen to the theory she has — then ask more questions, don't correct",
          "Do a project together: spend three weekends going deep on one thing she's curious about. Document it.",
          "Visit art galleries, markets, botanical gardens — Reggio uses the city as classroom",
          "Get her a sketchbook for her exclusive use: this is her documentation of her hundred languages",
        ],
      },
      "6-8": {
        stage: "Progettazione — Deep Projects and Collaborative Inquiry",
        schoolFocus: "Long-term project work: a class might spend months investigating shadows, or water, or the city. Documentation panels on walls make thinking visible. Literacy and numeracy emerge through projects.",
        childWorld: "She's ready for depth, not just breadth. Reggio's gift at this age is sustained inquiry: she can now follow a question across weeks, building understanding through multiple languages and representations.",
        momWatch: [
          "Notice when she goes deep on something: this is progettazione territory. Honour it by giving it time and materials",
          "Watch her collaborative learning: Reggio prizes peer learning as much as adult teaching",
          "Observe how she documents her thinking: drawing, writing, constructing, performing",
          "Pay attention to how she revises and returns to her theories — the revisiting is where the learning lives",
          "Notice the connection between her art and her thinking — in Reggio these are not separate activities",
        ],
        dadCarry: [
          "Take her question and make a project of it — she asks 'why do clouds change shape?' and you spend a month finding out together",
          "Visit a maker space, a studio, a workshop, a laboratory — Reggio children learn that real knowledge is made in real places",
          "Collaborate with her on documentation: photograph her process, let her caption the images, make a book together",
          "Let her teach you something she has figured out — the act of teaching consolidates Reggio learning powerfully",
          "Advocate at school for project-based time if the curriculum is too fragmented — this is her Reggio instinct working",
        ],
      },
      "9-11": {
        stage: "The Child as Researcher — Deep Questions, Community, and Voice",
        schoolFocus: "Complex long-term projects, community engagement, peer teaching, making learning public through exhibitions and presentations, ethical questions arising from project inquiry",
        childWorld: "She's ready to have her learning matter beyond the classroom. Reggio at this age begins to connect the child's inquiry to the real world — and asks: what will you do with what you now know?",
        momWatch: [
          "Watch how she's finding her own research questions — not just answering given questions but forming her own",
          "Notice her relationship with presentation and making thinking public: does she have confidence in her own work?",
          "Observe her ethical engagement with the world: Reggio projects often surface questions of justice and responsibility",
          "Pay attention to whether her school is making space for her questions or only delivering content",
          "Notice the quality of her friendships: Reggio prizes collaborative relationships, not just social ones",
        ],
        dadCarry: [
          "Help her exhibit something she's made or discovered — for real, for an audience, even just the family",
          "Connect her learning to the actual city: visit the institutions, the experts, the places that are relevant to her current inquiry",
          "Take her ideas seriously in public: let her explain her project to your friends, your colleagues",
          "Support a long-term project at home: something she cares about, over months, with documentation",
          "Advocate that her school make learning visible: Reggio documentation panels, portfolios, exhibitions",
        ],
      },
      "12-15": {
        stage: "Agency and Voice — From Student to Protagonist",
        schoolFocus: "Student-led projects with genuine community impact, multi-modal presentations, philosophy of the hundred languages extended to career and identity, peer mentoring",
        childWorld: "The Reggio image of the child culminates here: a young person who knows she is capable, who has a hundred ways of knowing and expressing, and who understands that her ideas have real value in the world.",
        momWatch: [
          "Watch how she advocates for her own learning: does she know what she needs and ask for it?",
          "Notice what she's creating and whether it's finding an audience beyond family — this matters for confidence",
          "Observe her relationship with her own portfolio of work: the accumulation of what she's made and thought over years",
          "Pay attention to how she mentors or teaches younger children — this is one of the Reggio indicators of real learning",
          "Notice whether she believes her questions matter. If not, something has gone wrong and needs addressing",
        ],
        dadCarry: [
          "Commission something from her: ask her to make something real that you will actually use or display",
          "Help her find platforms for her work: exhibition, publication, community project, school leadership",
          "Have the 'hundred languages' conversation: 'You've always had multiple ways of knowing — which ones do you want to keep?'",
          "Take her creative work as seriously as her academic work — in Reggio there is no hierarchy between them",
          "Share your own multiple intelligences with her: what are the ways you know and express things that aren't verbal?",
        ],
      },
    },
  },

  krishnamurti: {
    name: "Krishnamurti",
    subtitle: "J. Krishnamurti / KFI",
    tagline: "Education is not the accumulation of knowledge but the awakening of intelligence — learning to live without fear, comparison, or conditioning",
    color: "#4a6741",
    schools: ["The Valley School, Bangalore (KFI)", "Centre for Learning (CFL), Bangalore", "Rishi Valley School, Andhra Pradesh", "The School, Chennai (KFI)", "Sahyadri School, Pune (KFI)", "Rajghat Besant School, Varanasi"],
    philosophy: [
      "Self-knowledge as the foundation of all learning — understanding one's own mind is the deepest education",
      "Freedom from comparison, competition, and psychological authority",
      "Nature, silence, and open questioning as daily practices — not subjects but ways of being",
      "Teacher and student as co-inquirers into the same fundamental questions",
      "Intelligence over intellect — the capacity to see freshly, not the accumulation of facts",
    ],
    ages: {
      "0-2": { stage: "Undivided Attention", schoolFocus: "Secure attachment, sensory wholeness, unstructured exploration in natural environments", childWorld: "The child arrives complete. The only task is unconditional presence — your attunement is the curriculum.", momWatch: ["Watch how your presence changes her nervous system — your calm is her calm", "Notice how she looks at the world without judgment — protect that freshness", "Observe what happens when you follow her gaze instead of redirecting it", "Notice her capacity for stillness — don't rush to fill silence"], dadCarry: ["Be a secure base, not a teacher — let her explore from that ground", "Sit quietly with her outdoors — let both of you just be", "Model curiosity without urgency: wonder without needing answers", "Protect her world from comparison — she is not ahead or behind"] },
      "3-5": { stage: "Whole World Inquiry", schoolFocus: "Nature immersion, open play, stories without lessons, questions without imposed answers", childWorld: "The child asks 'why' without agenda — her questions are not problems to be solved but invitations into wonder. KFI asks parents to honour them the same way.", momWatch: ["Watch what questions she asks and whether you rush to answer them — practice sitting in the question with her", "Notice if comparison with other children has entered — KFI sees this as the beginning of psychological damage", "Observe her relationship with nature: does she feel at home in it?", "Notice how she handles conflict — is there genuine understanding or just following rules?"], dadCarry: ["Ask her questions you don't have answers to — show her what real inquiry looks like", "Spend time in nature without agenda — no 'educational objectives'", "Be honest when you don't know something: 'I wonder too'", "Protect her from screens and competitive environments as much as possible at this stage"] },
      "6-8": { stage: "Awakening Intelligence", schoolFocus: "Integrated learning through art, nature, crafts, mathematics as pattern and beauty, questioning received knowledge", childWorld: "School should feel alive with discovery. If it feels like a performance, something has been lost. The KFI tradition asks: does the child love learning itself?", momWatch: ["Notice whether she loves to learn or performs learning for approval — these are very different", "Watch how she relates to mistakes — does she fear them or investigate them?", "Observe whether she can sit in silence comfortably — this is a KFI indicator of inner health", "Notice if she is beginning to compare herself to peers — have honest conversations about what comparison does to the mind"], dadCarry: ["Share your genuine puzzlements with her — not to teach but to think together", "Take her on walks where you both observe the same thing silently, then share", "Help her see through advertising, peer pressure, herd behavior — gently, not preachy", "Read to her from Krishnamurti's talks for young people when she's ready — at 7-8 some children are"] },
      "9-11": { stage: "Self-Knowing", schoolFocus: "Deep project work, ecological thinking, the study of one's own reactions and conditioning, non-competitive achievement", childWorld: "Peer relationships bring comparison and conformity. The KFI tradition asks: can she see this happening without being swept away by it?", momWatch: ["Notice if she is changing herself to belong — this is the critical KFI observation", "Watch whether she processes difficult emotions through suppression or through understanding", "Observe if she has a genuine relationship with silence — in meditation, in nature, in thought", "Notice her relationship to her own competitiveness — is it driving her or is she aware of it?"], dadCarry: ["Have honest conversations about how you have been conditioned — your fears, your conformities", "Help her develop the habit of inquiry before reaction: 'I wonder why I felt that'", "Take her seriously as a thinker — include her in genuine adult discussions", "Model what it looks like to examine one's own assumptions without defending them"] },
      "12-15": { stage: "Intelligence Without Authority", schoolFocus: "Self-directed learning, philosophical dialogue, ecological projects, understanding the nature of the mind itself", childWorld: "She is building an identity partly through rebellion and partly through conformity. KFI invites a third path: self-knowledge that doesn't depend on either.", momWatch: ["Notice whether she is thinking for herself or following a group identity", "Watch if she can hold complexity — understanding something without immediately judging it", "Observe her relationship to authority: does she question it intelligently or just rebel?", "Notice if she has spaces of genuine solitude and silence in her week"], dadCarry: ["Share your own unresolved questions about how to live — not as lessons but as honest companionship", "Help her see how conditioning operates: in media, in peer groups, in family expectations", "Encourage her to question your own views — and actually change them when she's right", "Protect her right to not know who she is yet — identity pressure from outside is the KFI concern"] },
    },
  },

  aurobindo: {
    name: "Integral Education (Aurobindo)",
    subtitle: "Sri Aurobindo · The Mother · Auroville",
    tagline: "Education must help the child become conscious of the divine within — developing physical, vital, mental, psychic, and spiritual dimensions as one whole",
    color: "#8b5e3c",
    schools: ["Sri Aurobindo Ashram School, Puducherry", "SAICE (Sri Aurobindo International Centre of Education)", "Mirambika Free Progress School, New Delhi", "Auroville Schools (Transition, Future School)", "Integral Education Centre, Hyderabad", "Sri Aurobindo Centre of Education, Calcutta"],
    philosophy: [
      "Five-fold education: physical, vital (emotional), mental, psychic (soul), and spiritual — all developed simultaneously",
      "Free progress: the child moves at her own pace guided by her own evolving consciousness",
      "The teacher as a guide, not an authority — helping the child discover what is already within",
      "Psychic being as the true self — education helps this inner presence emerge and lead",
      "Beauty, silence, and aspiration as educational methods as much as content and skill",
    ],
    ages: {
      "0-2": { stage: "Psychic Emergence", schoolFocus: "Physical development, love, sensory richness, beauty, rhythm, and the earliest stirrings of the psychic being", childWorld: "The soul enters the body and begins its education through sensation, love, and the atmosphere of the home. Every impression at this stage reaches the deepest layers.", momWatch: ["Notice the quality of atmosphere in your home — Aurobindo's view is that it reaches the child's deeper self", "Watch how she responds to beauty: music, colour, nature, silence", "Observe what she does when left completely free — this is her psychic self expressing", "Notice how love flows between you — is it conditional on behaviour or unconditional?"], dadCarry: ["Bring beauty and calmness into the home — this is educational in Aurobindo's sense", "Read or sing to her with real feeling — not as instruction but as offering", "Let her be around your genuine enthusiasms — she absorbs your relationship with life itself", "Protect her inner world from harshness, aggression, and ugliness as much as possible"] },
      "3-5": { stage: "Vital Awakening", schoolFocus: "Creative play, expression through all arts, movement, building the vital being's health and joy", childWorld: "The vital being — emotions, desires, energy — is growing rapidly. Aurobindo's tradition asks that it be shaped toward beauty and aspiration, not suppressed or indulged.", momWatch: ["Notice which creative forms she is most drawn to — these are doorways to the psychic being", "Watch how she handles big emotions — the goal is conscious vitality, not suppression", "Observe whether she has access to beauty in daily life: art, music, nature, stories with depth", "Notice if she has moments of spontaneous aspiration — wonder, reaching toward something greater than herself"], dadCarry: ["Share your own creative life with her — make something together without it being 'educational'", "Read her stories of heroes, goddesses, great deeds — the vital being is nourished by aspiration", "Practice simple physical disciplines together: yoga, walking, breath — the body is the first instrument", "Be enthusiastic about life — the vital being takes its cue from the adults closest to it"] },
      "6-8": { stage: "Mental Development", schoolFocus: "Mathematics, language, history, science — but all presented as windows into the real, not as facts to be memorised", childWorld: "The mental being is waking up and wants to understand, not just know. Aurobindo's schools teach everything through curiosity about what things really are.", momWatch: ["Notice what subjects she is genuinely curious about — these are the opening of her mental being", "Watch if learning feels like discovery or duty — Aurobindo's test of good education", "Observe whether she is developing concentration: the ability to enter deeply into something", "Notice if comparison and competition have entered her self-assessment"], dadCarry: ["Ask real questions together: 'Why do you think that is?' — model genuine mental inquiry", "Help her develop concentration through whatever she loves: music, drawing, building — depth over breadth", "Bring history alive as the story of human aspiration and fall — not as dates to memorise", "Protect her from too much passive screen time — the mental being needs active engagement to grow"] },
      "9-11": { stage: "Psychic Influence", schoolFocus: "Self-chosen projects, deepening of arts and skills, growing awareness of one's own inner life and motivations", childWorld: "In Aurobindo's view, the psychic being begins to exert more influence around this age — children start asking real questions about meaning and purpose.", momWatch: ["Notice if she has genuine enthusiasms that go beyond skill or performance — this is psychic stirring", "Watch how she relates to ethical questions — does she feel them or just recite rules?", "Observe if she has any relationship with silence, meditation, or prayer — without imposing it", "Notice her relationship with her body — Aurobindo sees physical culture as part of integral education"], dadCarry: ["Share stories of people who lived from their deepest selves — in any field, any tradition", "Have conversations about why you do what you do — not career but what you are actually serving", "Encourage her to take on real projects with real stakes and real beauty in the result", "Practice some form of body-discipline together: sport, yoga, martial arts — with genuine seriousness"] },
      "12-15": { stage: "Aspiration and Emergence", schoolFocus: "Self-directed education guided by inner aspiration, service, deepening of the psychic relationship with life", childWorld: "The teen is searching for meaning — Aurobindo would say the psychic being is looking for the conditions to emerge as the leader of the other parts of her nature.", momWatch: ["Notice if she has genuine aspirations — not ambitions (which are vital) but aspirations (which are psychic)", "Watch her relationship with beauty: does she maintain it even when peer culture pushes ugliness?", "Observe whether she is developing any form of inner practice — however informal", "Notice if she has people in her life she considers genuinely wise, not just popular or successful"], dadCarry: ["Share what you are genuinely aspiring toward in your own life — not achieving but becoming", "Help her find mentors who embody something she wants to move toward", "Protect her from cynicism — the integral view is that cynicism kills the psychic being's aspirations", "Have conversations about what education is actually for — not employment but the evolution of consciousness"] },
    },
  },

  "nai-talim": {
    name: "Nai Talim",
    subtitle: "Mahatma Gandhi · Basic Education · Learning by Doing",
    tagline: "The hand, the heart, and the head develop together through useful work — education must be rooted in life as it is actually lived",
    color: "#5a7a3a",
    schools: ["Gandhi Vidya Mandir, Sardarshahr (Rajasthan)", "Sevagram Ashram Pratishthan School, Wardha", "Nai Talim Samiti schools (Gujarat)", "Vidya Bhavan, Udaipur", "Basic School affiliated institutions (various states)"],
    philosophy: [
      "Craft and productive work as the centre of curriculum — not add-ons but the method itself",
      "Learning in the mother tongue, rooted in the child's own community and environment",
      "Self-sufficiency and dignity of labour — every child learns to produce something of real value",
      "No separation between hand-work and book-learning — they are unified in the same activity",
      "The village and community as the school — real problems, real solutions, real relationships",
    ],
    ages: {
      "0-2": { stage: "Root and Ground", schoolFocus: "Sensory richness, mother tongue immersion, physical care, meaningful routine", childWorld: "The child's earliest education is her relationship with home, earth, and the rhythms of daily life. Nai Talim sees this period as planting roots in culture and community.", momWatch: ["Notice how she engages with textures and natural materials — earth, water, cloth, wood", "Watch how she responds to the sounds of your mother tongue — songs, prayers, the daily sounds of your home", "Observe her participation in daily rhythms — cooking smells, household sounds, community life"], dadCarry: ["Let her be near your hands at work — watching real work is her earliest education", "Speak to her in your mother tongue — community language is the root of Nai Talim's vision", "Bring her into natural environments: soil, garden, open sky"] },
      "3-5": { stage: "Hands into the World", schoolFocus: "Simple craft, cooking participation, gardening, animal care, community observation", childWorld: "The child wants to do real work alongside real people. Gandhi's vision was that a child who kneads dough, waters plants, and sweeps the courtyard learns more than one who only reads about them.", momWatch: ["Notice which household tasks she gravitates toward — let her do them fully, even imperfectly", "Watch how much she wants to help versus be helped — Nai Talim sees this impulse as sacred", "Observe her relationship with natural materials: soil, clay, cloth, water, grain"], dadCarry: ["Include her in your actual work, not just child-versions of it", "Let her observe craftspeople, farmers, artisans at work whenever possible", "Make something together that has real use — a small garden, a simple tool, a prepared meal"] },
      "6-8": { stage: "Craft as Curriculum", schoolFocus: "Weaving, pottery, farming, cooking — mathematics and language learned through these crafts, not separately", childWorld: "A child who measures cloth for weaving learns geometry. One who keeps garden accounts learns arithmetic. Nai Talim asks: what is she making that is genuinely useful?", momWatch: ["Notice whether her learning feels alive or abstract — Nai Talim's test", "Watch for the dignity she feels when she produces something real — protect this feeling", "Observe how she handles imperfect work: does she improve it or give up?"], dadCarry: ["Ensure she has at least one real craft or productive skill developing this year", "Take her to see how things are made — food, cloth, tools, buildings", "Let her sell or share something she has made — the social dimension of work matters"] },
      "9-11": { stage: "Community Usefulness", schoolFocus: "Real service projects, growing craft sophistication, understanding the local economy and ecology", childWorld: "Education that does not connect to community and service has missed the point, in Gandhi's view. At this age, real contribution becomes possible.", momWatch: ["Notice whether she has a sense of being genuinely useful to people beyond herself", "Watch her relationship with people who do physical work — is there respect and curiosity?", "Observe if she understands where her food, clothing, and water actually come from"], dadCarry: ["Find ways for her to contribute something real to the community this year", "Have honest conversations about economic inequality and the dignity of all labour", "Encourage her to learn from people whose knowledge is embodied, not academic"] },
      "12-15": { stage: "Purposeful Self-Reliance", schoolFocus: "Independent craft mastery, community leadership, understanding the connections between personal choices and the wider world", childWorld: "Gandhi's vision was a young person who could sustain herself and serve her community — confident, grounded, not dependent on systems that exploit others.", momWatch: ["Notice if she has a sense of economic and practical self-reliance emerging", "Watch her relationship with consumption — can she distinguish need from want?", "Observe whether she has genuine respect for all forms of honest work"], dadCarry: ["Help her develop at least one skill of real economic value that is also meaningful to her", "Have conversations about what kind of economy she wants to participate in and build", "Model simplicity as a choice, not a deprivation — Gandhi's vision of the good life"] },
    },
  },

  "forest-school": {
    name: "Forest School",
    subtitle: "Outdoor Learning · Nature as Teacher · Risk and Discovery",
    tagline: "Regular, repeated access to the same natural place over time — learning that cannot happen anywhere else",
    color: "#2d5a27",
    schools: ["Prakriya Green Wisdom School, Bangalore (nature-integrated)", "Nirmala Niketan (nature programs, Coorg)", "The Earth School (various campuses)", "ACRES — A Child's Right to Education in the Outdoors", "Shibumi School, Bangalore (outdoor emphasis)", "Nila's Nature School, Bangalore"],
    philosophy: [
      "The natural environment as the primary classroom — weather, seasons, living things as curriculum",
      "Child-initiated learning: the adult facilitates and ensures safety, the child leads",
      "Long unstructured time outdoors — not nature walks but genuine wilderness immersion",
      "Risk-taking and physical challenge as developmentally essential — not to be eliminated",
      "Connection to place: returning to the same forest or land across seasons builds real ecological knowledge",
    ],
    ages: {
      "0-2": { stage: "Earth Contact", schoolFocus: "Unmediated contact with natural textures, sounds, light, water, and living things", childWorld: "A child who crawls on real earth, feels rain, watches insects, and touches bark is being educated in ways no indoor environment can replicate.", momWatch: ["Notice her response to natural sounds: rain, birds, wind, water — these are her earliest music", "Watch what she does when given unstructured outdoor time — follow her, don't direct her", "Observe how her body responds to natural light, fresh air, and physical freedom"], dadCarry: ["Create daily outdoor time, whatever the weather — this is the Forest School baseline", "Get down on the ground with her — see what she sees at ground level", "Resist the urge to sanitise her outdoor experience — muddy hands are not a problem"] },
      "3-5": { stage: "Wild Play", schoolFocus: "Open outdoor play, den-building, water play, fire observation, creature investigation", childWorld: "She wants to dig, climb, splash, build, and discover. The forest or garden is not a backdrop — it is the full curriculum at this age.", momWatch: ["Notice whether she is developing a relationship with a specific outdoor place — this is the Forest School concept of 'base camp'", "Watch her risk assessment: does she test things carefully before committing? This is emerging intelligence", "Observe her relationship with living things: insects, worms, plants — with wonder, not disgust"], dadCarry: ["Build something outdoors with her: a den, a dam, a fire pit, a bug hotel", "Let her get genuinely wet, muddy, cold sometimes — physical resilience builds from real exposure", "Find a wild place you can return to regularly across the year — the same place in different seasons"] },
      "6-8": { stage: "Nature Apprentice", schoolFocus: "Tracking, foraging basics, tool use (knives, fire), natural building, seasonal observation journals", childWorld: "Children at this age can learn real wilderness skills. Forest School argues this builds a kind of confidence no classroom can — because the challenge and the achievement are both completely real.", momWatch: ["Notice how she handles genuine physical challenge — not gym class but real terrain", "Watch her relationship with tools: is she careful, capable, curious?", "Observe whether time in nature is restorative for her — it should be"], dadCarry: ["Teach or learn together a real outdoor skill: fire-lighting, knot-tying, plant identification", "Take her somewhere genuinely wild for at least a night — tent, forest, stars", "Let her lead the way sometimes — in the forest or on a trail, let her make the navigation decisions"] },
      "9-11": { stage: "Ecological Thinking", schoolFocus: "Understanding ecosystems, conservation, citizen science, outdoor leadership, survival basics", childWorld: "Children who have spent years in nature begin to think ecologically — they see relationships, cycles, and consequences that children with only indoor education miss.", momWatch: ["Notice if she has emotional responses to environmental destruction — this is the Forest School outcome", "Watch how she reads weather, light, season — is ecological literacy growing?", "Observe whether outdoor challenge still excites rather than frightens her"], dadCarry: ["Do a multi-day outdoor expedition — trek, canoe, cycle trip", "Connect her with environmental organisations doing real fieldwork she can participate in", "Have honest conversations about climate and ecology — from the perspective of someone who loves the natural world"] },
      "12-15": { stage: "Stewardship", schoolFocus: "Environmental activism, leadership of younger children outdoors, deep ecological study, outdoor expedition", childWorld: "A teenager who has grown up with Forest School has a different relationship with the more-than-human world. Stewardship is not a lesson — it is an identity.", momWatch: ["Notice if she has a sense of responsibility toward particular places or species", "Watch whether outdoor experience is becoming self-directed rather than parent-arranged — it should be by now", "Observe her relationship with physical hardship — can she move through it without drama?"], dadCarry: ["Plan and execute an outdoor challenge together that is genuinely at the edge of both your abilities", "Support her leadership of outdoor experiences for others: younger siblings, community children", "Discuss your own relationship with the natural world honestly — what have you protected or neglected?"] },
    },
  },

  democratic: {
    name: "Democratic Education",
    subtitle: "Sudbury Model · Self-Directed Learning · Radical Trust",
    tagline: "Children who run their own school — making decisions, setting rules, directing their own learning — become capable of running their own lives",
    color: "#3d5a8a",
    schools: ["Swaraj University, Udaipur (young adults, unschooling-allied)", "The Learning Garden, Bangalore (democratic principles)", "Aarohi Life Education, Bangalore (open learning)", "Sudbury-inspired Homeschool Cooperatives (Bangalore, Pune, Hyderabad)", "Swashikshan, Pune"],
    philosophy: [
      "Children have the same rights as adults within the school community — all voices count equally",
      "Learning is entirely self-directed — no compulsory classes, no imposed curriculum",
      "The school meeting governs all rules by consensus — children and staff have equal votes",
      "Trust that children, given freedom and real community, will become genuinely capable people",
      "Mixed-age community where older children mentor younger ones naturally",
    ],
    ages: {
      "0-2": { stage: "Radical Trust Begins", schoolFocus: "Unconditional responsiveness, following the child's lead, no imposed schedule beyond basic needs", childWorld: "Democratic education starts with the premise that the child knows what she needs. Your attunement to her signals — rather than imposing schedules — lays the foundation.", momWatch: ["Notice how you respond to her bids for attention and connection — do you follow her lead or direct her?", "Watch what she chooses when given complete free time — this is democratic self-direction at its earliest", "Observe your own impulses to teach, correct, or direct — they are strong and worth examining"], dadCarry: ["Practice waiting — let her initiate, then respond", "Be a resource, not a director — available, not imposing", "Let her take the lead in play whenever possible"] },
      "3-5": { stage: "Community and Choice", schoolFocus: "Self-chosen play, participation in family decision-making, exposure to real community governance", childWorld: "The democratic child is learning that her voice matters and that decisions affect communities. Home family meetings, genuine choices, and explanations of why rules exist are the early curriculum.", momWatch: ["Notice if she is included in genuine family decisions appropriate to her understanding", "Watch how she handles the gap between what she wants and what is possible — negotiation is the skill", "Observe her relationship with fairness — strong feelings about fairness at this age are developmentally healthy"], dadCarry: ["Hold simple family meetings where her voice genuinely changes decisions", "Explain the reasoning behind every family rule rather than invoking authority", "Let her experience the natural consequences of her own choices — within safety"] },
      "6-8": { stage: "Self-Directed Learning", schoolFocus: "Child chooses what and how to learn — adult provides resources, conversation, and safety, not curriculum", childWorld: "Democratic schools at this age see children deeply engaged in what they have chosen: carpentry, coding, art, books, Lego, cooking — with intensity that imposed curriculum rarely produces.", momWatch: ["Notice what she pursues with intensity when given completely free time — this is her learning direction", "Watch how she handles boredom — boredom in democratic education is a creative threshold, not a problem to solve", "Observe her growing capacity to negotiate, argue, and resolve conflict — these are the core democratic skills"], dadCarry: ["Provide access to many materials and environments without directing their use", "Resist filling every moment with activities — unstructured time is the democratic curriculum", "Share your own genuine interests and let her choose whether to join"] },
      "9-11": { stage: "Governing Self and Community", schoolFocus: "Real participation in community governance, self-directed projects of growing complexity and duration", childWorld: "Children in democratic schools at this age run genuine committees, make real financial decisions, mediate conflicts, and take responsibility for community life. This is not a simulation.", momWatch: ["Notice if she has genuine responsibilities in the family or community — not chores but real stakes", "Watch how she reasons about fairness and rules — is she developing genuine ethical thinking?", "Observe whether she initiates her own learning projects without adult prompting"], dadCarry: ["Give her real responsibility for something in the family that affects everyone", "Have genuine debates with her about family decisions — and actually change your mind sometimes", "Help her find real audiences for things she wants to pursue: mentors, communities, makers"] },
      "12-15": { stage: "Self-Governance", schoolFocus: "Community leadership, entrepreneurship, self-designed education, real-world projects", childWorld: "A teenager raised democratically has a different relationship with authority — she understands it as something earned and given, not imposed. She is learning to govern herself.", momWatch: ["Notice if she can identify what she wants to learn and pursue it autonomously", "Watch her relationship with institutions and authority — is it critical and engaged or just rebellious?", "Observe whether she has built genuine peer communities around shared interests"], dadCarry: ["Support her in taking genuine risks on projects she has chosen", "Have honest conversations about how power and governance actually work", "Let her make significant decisions about her own education — and support her in living with the consequences"] },
    },
  },

  classical: {
    name: "Classical Education",
    subtitle: "Trivium · Great Books · Rhetoric and Reasoning",
    tagline: "Grammar, Logic, Rhetoric — the tools of clear thought and expression, taught through the greatest works of human civilisation",
    color: "#5a3a1e",
    schools: ["Greenwood High (classical elements, Bangalore)", "Delhi Public School (classical pedagogy in some branches)", "Suchitra Academy, Hyderabad", "Sri Kumaran Schools, Bangalore (rigorous classical approach)", "Bishop Cotton School, Bangalore (classical traditions)", "Sardar Patel Vidyalaya, Delhi"],
    philosophy: [
      "The Trivium: Grammar (absorbing knowledge) → Logic (questioning knowledge) → Rhetoric (expressing knowledge) aligned to developmental stages",
      "Great Books and primary sources rather than textbooks — learning from the best humanity has produced",
      "Latin, Sanskrit, or classical language as a tool for precision of thought",
      "Memorisation in the early years as a foundation for analytical work later",
      "Virtue and character formation as explicit goals of education, not incidental",
    ],
    ages: {
      "0-2": { stage: "Grammar Stage Begins", schoolFocus: "Language immersion, pattern recognition, rhythm, song, story — absorbing the forms of language and thought", childWorld: "The classical tradition sees these years as the earliest grammar stage: the child is absorbing the deep patterns of language, story, and human culture.", momWatch: ["Notice how she responds to rhythm, rhyme, and repetition — these are grammatical patterns being absorbed", "Watch her love of naming things — the classical tradition sees naming as the first intellectual act", "Observe how stories already organise her world — what characters and patterns does she return to?"], dadCarry: ["Read aloud richly and repeatedly — the classics of children's literature are the beginning of the Great Books tradition", "Sing nursery rhymes, folk songs, Sanskrit shlokas — rhythm is the earliest logic", "Tell stories from memory, not just books — this models the oral tradition at the heart of classical education"] },
      "3-5": { stage: "Absorbing the World", schoolFocus: "Memorisation of beautiful language, songs, poems, prayers, stories — laying up treasures for later reasoning", childWorld: "Classical educators argue that children at this age have a remarkable capacity for memorisation that later declines. What she absorbs now — poems, stories, songs, language — becomes the raw material for later thinking.", momWatch: ["Notice what she memorises naturally — songs, lines from books, prayers — without being asked", "Watch her love of repetition in stories: 'read it again' is not boredom, it is classical grammar-stage learning", "Observe how she uses stories to make sense of her world — this is the beginning of the rhetorical impulse"], dadCarry: ["Memorise a poem or prayer together each month — not as a test but as a treasure", "Read from classical myths, Panchatantra, Ramayana, folk tales — the Great Stories are her curriculum", "Avoid dumbing down language — the classical tradition uses rich vocabulary with young children"] },
      "6-8": { stage: "Logic Stage Awakening", schoolFocus: "Grammar of formal subjects, early logic puzzles, recitation, the beginnings of argument and debate", childWorld: "The questioning mind is waking up — in classical education this is the transition from grammar to logic. She is ready to ask 'why' and to start testing ideas rather than just absorbing them.", momWatch: ["Notice the 'why' questions — in classical education these are to be honoured and argued, not just answered", "Watch whether she can hold an argument: present evidence, rebut opposition, change her mind", "Observe her relationship with formal rules — grammar rules, math rules — does she see them as tools or impositions?"], dadCarry: ["Have real debates at the dinner table — model arguing with evidence and changing your position", "Introduce formal logic puzzles: chess, Sudoku, logic riddles — the playful version of the Trivium's logic stage", "Read history as argument, not fact: 'Why do you think Rome fell? Here is what different historians say'"] },
      "9-11": { stage: "Logic and Dialectic", schoolFocus: "Formal reasoning, debate, essay writing, studying the arguments behind ideas rather than just the ideas themselves", childWorld: "The classical student at this age is beginning to see that ideas have histories and that arguments can be evaluated. She is learning to think, not just to know.", momWatch: ["Notice if she can construct an argument rather than just state an opinion", "Watch whether she reads — deeply, not just widely — and can talk about what she has read with genuine engagement", "Observe her capacity to sit with a difficult text and work through it rather than needing it simplified"], dadCarry: ["Engage her in Socratic dialogue: ask questions, withhold your view, let her arrive at conclusions herself", "Help her write a genuine argument — not a five-paragraph essay but a real attempt to persuade someone of something true", "Read the same book together and disagree about it"] },
      "12-15": { stage: "Rhetoric", schoolFocus: "The art of persuasion, public speaking, long-form writing, the synthesis of knowledge into original expression", childWorld: "The classical tradition holds that the culmination of education is the ability to express truth beautifully and persuasively. The teenage years are when this becomes possible.", momWatch: ["Notice if she has found her voice — in writing, speaking, or another form of expression", "Watch how she presents arguments to adults: is she confident, clear, capable of adapting to her audience?", "Observe whether she reads classical works for pleasure — this is the highest compliment classical education can receive"], dadCarry: ["Give her real audiences: a family speech, a community presentation, a published piece of writing", "Help her prepare for debate or Model UN or similar forums — rhetoric needs practice with real stakes", "Discuss the classical canon with genuine seriousness: 'What do you think Homer was really saying?'"] },
    },
  },

  pbl: {
    name: "Project-Based Learning",
    subtitle: "Real Problems · Deep Investigation · Public Audience",
    tagline: "Students learn by doing sustained, complex projects that answer real questions, create real products, and serve real audiences",
    color: "#2a5f8f",
    schools: ["Inventure Academy, Bangalore", "Greenwood High, Bangalore", "Indus International School, Bangalore", "Ekya Schools, Bangalore", "Stonehill International, Bangalore", "Azim Premji School (project-oriented)"],
    philosophy: [
      "Driving question: every unit begins with a compelling, open question that requires investigation",
      "Sustained inquiry: deep work over days or weeks, not fragmented lessons",
      "Authenticity: real problems, real stakeholders, real products — not simulations",
      "Student voice and choice within the structure of the project",
      "Public product: the work is shared with an audience beyond the classroom — this raises the stakes and the quality",
    ],
    ages: {
      "0-2": { stage: "Earliest Projects", schoolFocus: "Sensory exploration as investigation, simple cause-and-effect experiments, play as proto-project", childWorld: "Every time she drops something to see it fall, or splashes water to watch it splash, she is running a project. PBL's roots go this deep.", momWatch: ["Notice her sustained attention on self-initiated investigations — even a few minutes at this age is significant", "Watch what questions her play is answering — 'what happens if...?' is the driving question in its earliest form", "Observe how she iterates: tries something, observes result, tries again"], dadCarry: ["Let her run the experiment to its conclusion before intervening", "Set up simple investigations: water and containers, ramps and balls, pots and spoons", "Narrate her investigations: 'You're figuring out how that works'"] },
      "3-5": { stage: "Project as Play", schoolFocus: "Building projects, cooking projects, garden projects — sustained over days with a visible end product", childWorld: "A sandcastle is a project. A mud kitchen is a project. Building a block city is a project. PBL at this age is about sustained commitment to something self-chosen.", momWatch: ["Notice which projects she returns to over multiple days — this is deep PBL engagement", "Watch whether she plans before she builds — this is the beginning of project design", "Observe her response when a project fails: does she investigate why and try again?"], dadCarry: ["Initiate a joint project with a real product: a birdbox, a small garden, a meal for the family", "Document her projects with photos and let her narrate what she is trying to do", "Find an audience for her work — grandparents, neighbours, community"] },
      "6-8": { stage: "Real Investigation", schoolFocus: "Research projects with real questions, community investigations, product design, presentation to an audience", childWorld: "PBL schools at this age give children real driving questions about their community, environment, or interests — and ask them to investigate and present findings.", momWatch: ["Notice whether her school projects have real driving questions or are just 'do a poster on X'", "Watch how she handles not knowing — PBL requires comfort with uncertainty before clarity", "Observe whether she has a public audience for her work — this is the PBL accountability that drives quality"], dadCarry: ["Help her frame a genuine question about something she cares about and investigate it seriously", "Connect her research to real people who can inform it: experts, community members, practitioners", "Help her prepare a genuine presentation — practise with you as audience, push her to go deeper"] },
      "9-11": { stage: "Complex Projects", schoolFocus: "Multi-week sustained projects, collaboration, iteration based on feedback, real stakeholder engagement", childWorld: "PBL at this stage involves real complexity: multiple phases, real feedback, genuine revision. The finished product should be something she is genuinely proud of.", momWatch: ["Notice her project management: can she work across days and weeks toward a goal?", "Watch how she incorporates critique — PBL requires genuine openness to feedback", "Observe her collaboration skills: does the group work, or does she do everything or nothing?"], dadCarry: ["Help her identify a real problem in your community that a project could address", "Introduce her to project management tools — simple ones: timelines, to-do lists, roles", "Attend her project presentations and ask real audience questions — not parent-softball questions"] },
      "12-15": { stage: "Capstone and Contribution", schoolFocus: "Student-designed capstone projects, real entrepreneurship or service, exhibitions of learning", childWorld: "The most ambitious PBL students at this age produce work that matters beyond school: apps used by real people, community programs that run, research presented at conferences.", momWatch: ["Notice whether she has identified a problem she genuinely wants to solve — not an assignment but a mission", "Watch if she has built genuine expertise through project work — deep knowledge in an area she has pursued", "Observe her public presentation skills — PBL's culminating product"], dadCarry: ["Help her find resources, connections, and platforms for work she is genuinely invested in", "Connect her with professionals who can evaluate her project from the outside", "Celebrate the process and the learning, not just the product — PBL's philosophy is that iteration is success"] },
    },
  },

  unschooling: {
    name: "Unschooling",
    subtitle: "Self-Directed · Life as Curriculum · Radical Trust",
    tagline: "Life is the curriculum — children learn what they need when they need it, through living deeply rather than being taught formally",
    color: "#6b4c8a",
    schools: ["Shikshantar Andolan, Udaipur (unschooling movement)", "Swashikshan (self-learning community, Pune)", "Aarohi Life Education, Bangalore", "The Learning Garden, Bangalore", "Self-organised unschooling cooperatives (Bangalore, Pune, Hyderabad, Chennai)", "Homeschool networks (HSLDA India, Unschoolers of India)"],
    philosophy: [
      "Deschooling the mind as much as the child: parents must unlearn the equation of learning with teaching",
      "Interest-led learning: the child's genuine passions are the curriculum, not a plan",
      "Trust that learning is the natural state — it does not need to be manufactured",
      "Adults as resource and companion, not teacher or authority",
      "Real life — cooking, travel, community, work, play — provides all necessary learning",
    ],
    ages: {
      "0-2": { stage: "Pure Unschooling", schoolFocus: "Complete responsiveness to the child's needs and curiosity — zero imposed agenda", childWorld: "The unschooled infant is already learning everything she will ever build on. Nothing needs to be added — only protected from unnecessary interference.", momWatch: ["Notice how much she learns without being taught — this is the core unschooling observation", "Watch what she pursues with intensity when left completely free", "Observe your own impulses to direct, teach, correct — unschooling begins with these impulses in the parent"], dadCarry: ["Be a safe presence that follows rather than leads", "Provide rich environments and then step back", "Notice what she figures out on her own and celebrate it internally — not as praise but as genuine wonder"] },
      "3-5": { stage: "Following Fascination", schoolFocus: "Wherever the child's deep interest leads — dinosaurs, trains, insects, cooking, music, construction", childWorld: "The unschooling child at this age may know extraordinary amounts about her chosen topic and almost nothing about topics she hasn't encountered. Unschooling parents trust that the interest will broaden organically.", momWatch: ["Notice what she returns to with sustained intensity across weeks and months — this is her curriculum", "Watch the depth of her knowledge in self-chosen areas — it is often astonishing", "Observe how she learns: by doing, by watching, by asking, by reading, by playing"], dadCarry: ["Provide resources that extend her current fascination as deeply as possible", "Connect her with mentors and communities around her interest", "Resist redirecting toward 'balanced' subjects — depth before breadth at this stage"] },
      "6-8": { stage: "Real World Learning", schoolFocus: "Learning through cooking, building, travel, nature, community — formal academic skills emerge from genuine need", childWorld: "Unschooling families at this age are often out in the world more than at desks. Reading emerges when there is something the child wants to read. Maths emerges when money, cooking, and building demand it.", momWatch: ["Notice when academic skills emerge from genuine need — and honour that timing", "Watch for the point at which she wants formal instruction in something she has chosen to master", "Observe whether she has rich relationships with adults outside the family who can mentor her interests"], dadCarry: ["Structure family life to include work, travel, community, and nature — this is the unschooling environment", "Let her participate in your real adult work as much as possible", "Don't panic about gaps — unschooling research shows they fill in when the child is ready and motivated"] },
      "9-11": { stage: "Deep Expertise", schoolFocus: "Deepening mastery in chosen areas, real-world projects, mentorships, growing academic self-direction", childWorld: "Many unschooled children at this age have genuine expertise in areas of passion and are able to engage with adult-level material in those areas. The challenge is breadth.", momWatch: ["Notice what she has mastered and what she genuinely doesn't care about yet — both are data", "Watch how she handles formal learning when she seeks it out for herself", "Observe her social world — unschooled children need intentional community"], dadCarry: ["Help her find mentors, apprenticeships, and communities around her deepest interests", "Introduce formal academic content gently in areas she is choosing to pursue", "Connect her with other unschooled or self-directed learners — the community is crucial"] },
      "12-15": { stage: "Autonomous Direction", schoolFocus: "Self-designed education, genuine mastery, building toward whatever comes next on her own terms", childWorld: "The unschooled teenager is often both more self-directed and more uncertain than her schooled peers. She knows what she loves but may not know how the world will receive her.", momWatch: ["Notice if she has a sense of direction — not a career plan but a genuine sense of what she is pursuing", "Watch how she handles credential questions: does she have a plan for formal recognition if needed?", "Observe whether she has healthy relationships with peers who share her values"], dadCarry: ["Help her understand the options for formal education re-entry if she wants them — exams, portfolios, equivalency", "Have honest conversations about what the world will ask of her and whether she wants to engage on its terms", "Celebrate what she has become through self-direction — then help her communicate it to the wider world"] },
    },
  },
};

function getAgeRange(age) {
  if (age <= 2) return "0-2";
  if (age <= 5) return "3-5";
  if (age <= 8) return "6-8";
  if (age <= 11) return "9-11";
  return "12-15";
}

// Stage boundaries in total months, and what comes next
const STAGE_MAP = [
  { key: "0-2",  startM: 0,   endM: 35  },
  { key: "3-5",  startM: 36,  endM: 71  },
  { key: "6-8",  startM: 72,  endM: 107 },
  { key: "9-11", startM: 108, endM: 143 },
  { key: "12-15",startM: 144, endM: 191 },
];

const NEXT_STAGE_PREVIEW = {
  "0-2":  "Ages 3–5: The practical life stage opens — she'll want to do real things herself. Start stepping back now.",
  "3-5":  "Ages 6–8: The reasoning mind arrives. Big 'why' questions are coming. Follow them, don't deflect them.",
  "6-8":  "Ages 9–11: The nine-year shift — a felt sense of aloneness and growing peer focus. Your relationship is the anchor.",
  "9-11": "Ages 12–15: Adolescence begins. The relationship you build now is the one she'll return to when it matters most.",
  "12-15":"Young adulthood: what you've given her in values, trust, and relationship becomes hers to carry forward.",
};

function getStageProgress(years, months) {
  const total = Number(years) * 12 + Number(months);
  const stage = STAGE_MAP.find(s => total >= s.startM && total <= s.endM)
             || STAGE_MAP[STAGE_MAP.length - 1];
  const monthsInStage = total - stage.startM;
  const stageLength   = stage.endM - stage.startM + 1;
  const pct           = Math.round((monthsInStage / stageLength) * 100);
  const monthsLeft    = stage.endM - total;
  const label         = pct < 33 ? "early" : pct < 67 ? "mid" : "late";
  const nextStage     = STAGE_MAP[STAGE_MAP.indexOf(stage) + 1] || null;
  return { pct, monthsInStage, monthsLeft, stageLength, label, nextStage, stageKey: stage.key };
}

const STAGE_POSITION_TEXT = {
  early: (stageName) => `Just entering the ${stageName} stage — the foundations being laid right now will carry the whole phase.`,
  mid:   (stageName) => `Well into the ${stageName} stage — the characteristic qualities of this period are fully in view.`,
  late:  (stageName) => `Approaching the end of the ${stageName} stage — begin preparing for the transition ahead.`,
};

// Gender-specific developmental notes layered on top of base age/school data
const GENDER_NOTES = {
  girl: {
    "0-2": {
      context: "Girls often develop language and social attunement slightly earlier. She's reading your emotional tone with remarkable precision from the first weeks.",
      priority: "Emotional mirroring — your face is her emotional curriculum right now.",
      momExtra: [
        "Notice how she tracks your facial expressions — she's calibrating her own emotional vocabulary from yours",
        "Watch her social engagement: girls often show strong preference for faces and voices earlier than boys",
      ],
      dadExtra: [
        "Don't underestimate her emotional sensitivity — she picks up household tension before she has words for it",
        "Your calm, present face is doing more developmental work than any toy or class",
      ],
      conversation: ["Narrate your emotions simply: 'Daddy is feeling happy.' She's building her emotion map from your words."],
    },
    "3-5": {
      context: "Relational identity forms early in girls. She's already working out who she is through friendships and play — protect the richness of that without narrowing it.",
      priority: "Keep her interests wide. This is the age gendered marketing tries hardest to narrow what she believes is for her.",
      momExtra: [
        "Notice if she's already limiting her own interests based on what's 'for girls' — gently push back",
        "Watch relational play: complex social scenarios in play are healthy, not drama",
        "Observe how she handles conflict with friends — she's building lifelong tools here",
      ],
      dadExtra: [
        "Be her model of a man who takes her ideas and opinions seriously — this shapes what she'll expect from men",
        "Do 'non-girl' activities with her: build things, climb things, fix things together",
        "Tell her she's brave and capable far more than you tell her she's pretty",
      ],
      conversation: ["'What do you want to be good at?' (not 'What do you want to be when you grow up')"],
    },
    "6-8": {
      context: "Girl social hierarchies begin forming with surprising complexity. This is also when math confidence gaps start — not from ability, but from messaging.",
      priority: "Math confidence. The gap isn't biological — it's cultural, and it starts right now.",
      momExtra: [
        "Watch for social exclusion dynamics in her friend group — even subtle ones matter at this age",
        "Notice how she talks about her own intelligence — does she say 'I'm not good at...' quickly?",
        "Observe if she's shrinking her opinions in group settings or with adults",
      ],
      dadExtra: [
        "Actively engage her in maths, science, and building — her confidence in these comes partly from you taking them seriously with her",
        "Let her see you value her ideas in front of others — this is when she starts measuring her worth by external response",
        "Ask 'what do you think?' before offering your own opinion",
      ],
      conversation: ["'What's something you tried that was hard?' — praise the attempt, not the result."],
    },
    "9-11": {
      context: "Social complexity peaks. Many girls begin puberty. Comparison culture sets in hard — with peers, with social media, with expectations. This is also when anxiety often first appears.",
      priority: "Her relationship with her body and her own mind. Both are under real pressure right now.",
      momExtra: [
        "Talk openly about puberty before it happens — shame lives in silence",
        "Notice body language and self-talk about her appearance — intervene early if it turns harsh",
        "Watch how she uses social media if she has access — comparison dynamics are brutal at this age",
        "Observe whether she's shrinking to fit in — with friends, in class, at home",
      ],
      dadExtra: [
        "Keep up physical activity together — it's protective against anxiety and body image issues",
        "Continue treating her as competent and capable in front of others — she's watching how men respond to her intelligence",
        "Talk about what you found hard at this age — normalize struggle without minimising hers",
        "Be the safe person she can say hard things to without fear of your reaction",
      ],
      conversation: ["'I noticed you seemed down about ___. You don't have to tell me, but I'm here.' — then be quiet."],
    },
    "12-15": {
      context: "Identity formation, puberty (likely underway), romantic interest beginning, female friendships can be intensely supportive and intensely painful. Anxiety often peaks. She needs to know her worth is not conditional.",
      priority: "She needs to see herself as more than how she looks, how she's liked, or how she performs.",
      momExtra: [
        "Share your own adolescence honestly — including the parts that were hard or embarrassing",
        "Notice if she's performing 'fineness' — many girls learn to say 'I'm fine' when they're not",
        "Watch her creative outlets — they are her emotional processing and deserve real attention",
        "Observe her peer group's relationship with achievement, bodies, and worth — she's absorbing their norms",
      ],
      dadExtra: [
        "Keep showing up physically — drive her somewhere, eat dinner together, ask about her week",
        "Your opinion of her intelligence and capability matters more than she'll admit right now",
        "Avoid commenting on her body or appearance, even positively — shift entirely to capability and character",
        "Let her see you respect women in the world with genuine words and actions",
      ],
      conversation: ["'I love watching who you're becoming.' — no condition attached, no advice after it."],
    },
  },
  boy: {
    "0-2": {
      context: "Boys often need more physical co-regulation — being held, moved, bounced. Language may come slightly later. Emotional attunement from fathers is especially developmentally important here.",
      priority: "Physical presence and safe containment. His nervous system is regulating through your body.",
      momExtra: [
        "Notice his need for physical movement — it's not restlessness, it's how he thinks and settles",
        "Watch his frustration signals — boys often communicate distress physically before verbally",
        "Observe how he responds to your emotional tone — he's highly attuned even without language yet",
      ],
      dadExtra: [
        "Physical closeness with you specifically matters — hold him, carry him, get on the floor with him",
        "Rough-and-tumble play with dad is genuinely developmental — not just fun",
        "Talk to him more than you think you need to — boys' verbal development benefits hugely from paternal narration",
      ],
      conversation: ["Name his emotions even before he can: 'You're frustrated. That was hard.' He's building vocabulary for later."],
    },
    "3-5": {
      context: "Physical energy is the primary mode of learning right now. Boys at this age think through their bodies. Sitting still is genuinely hard — not defiance.",
      priority: "Physical outlets are not optional. Without them, everything else becomes harder.",
      momExtra: [
        "Notice if his learning environment is tolerant of his need to move — it matters more than you think",
        "Watch superhero and war play without immediately redirecting — it's processing power and agency",
        "Observe his emotional vocabulary — boys need explicit teaching of feelings language more than girls typically do",
      ],
      dadExtra: [
        "Be physical together: wrestle, chase, build, climb, dig. This is his cognitive mode right now",
        "Model emotional vocabulary explicitly: 'I'm feeling frustrated because...' — he's learning from you directly",
        "Do things together without agenda — side-by-side activity is how he bonds",
        "Be the safe space for tears — boys whose fathers accept their tears develop healthier emotional range",
      ],
      conversation: ["'Show me what you made' — activity-based connection is how boys often feel closest."],
    },
    "6-8": {
      context: "Friendship through shared activity, not conversation. Sitting still in school can be genuinely hard. Physical risk-taking is healthy and important. His emotional life exists — it may just be less verbal.",
      priority: "Don't mistake his emotional quietness for emotional absence. The feelings are there.",
      momExtra: [
        "Notice how he expresses care and connection — often through acts and play rather than words",
        "Watch for signs of academic struggle — boys are more likely to mask difficulty through disruption",
        "Observe friendships: are they activity-based, rough-and-tumble? That's healthy for this age",
      ],
      dadExtra: [
        "Be physically active together — this is still the primary bonding mode",
        "Talk during activity, not face-to-face — car conversations, walks, building together work better",
        "Let him see you express a full range of emotions — not just strength and calm",
        "Take his physical courage seriously — it's connected to his developing sense of self",
      ],
      conversation: ["Talk in the car, on walks, during games — side-by-side, not face-to-face."],
    },
    "9-11": {
      context: "Testosterone begins rising. Risk-taking increases. Physical development varies widely and boys compare constantly. Emotional life becomes more private. Male peer group norms start shaping what feelings are 'allowed'.",
      priority: "Keep the emotional door open before it closes. This is when boys often start hiding feelings from parents.",
      momExtra: [
        "Notice if he's beginning to perform 'toughness' — boys learn quickly that emotions aren't cool",
        "Watch his relationship with physical risk — appropriate daring vs. genuinely dangerous",
        "Observe peer group norms around masculinity — what's being praised and mocked among his friends",
      ],
      dadExtra: [
        "Your presence in his life is the single most protective factor right now",
        "Talk about your own struggles at this age — he needs to know men have inner lives",
        "Maintain physical activity together — it's the thread that keeps connection alive",
        "Challenge narrow versions of masculinity when you see them — without lectures",
        "Be the adult male who demonstrates that emotional honesty is strength, not weakness",
      ],
      conversation: ["'When I was your age I felt...' — he needs evidence that men have real inner lives."],
    },
    "12-15": {
      context: "Testosterone surge. Physical changes. Identity forming around competence, belonging, and masculinity. Risk-taking peaks. Emotional intensity is high but often unexpressed. He needs meaning and purpose, not just achievement.",
      priority: "He needs to know what kind of man he's being invited to become — and that emotional intelligence is part of it.",
      momExtra: [
        "Notice changes in energy, mood, and withdrawal — some is normal, sustained shutdown is not",
        "Watch how he's defining masculinity for himself — gently widen what's possible",
        "Keep some physical affection going if he allows it — he still needs it even if he acts otherwise",
      ],
      dadExtra: [
        "This is the most important season of your relationship with him — show up even when he pushes back",
        "Talk about what it means to be a good man — not rules, but values you actually live",
        "Risk-taking is not defiance — he's building a sense of his own capacities. Help him do it safely",
        "Show him that asking for help is strength, not weakness — model it yourself",
        "His peer group will define a lot of his identity now. Know who he's spending time with and trust him unless there's evidence not to",
      ],
      conversation: ["'I'm proud of you' — said privately, about character not achievement, means everything at this age."],
    },
  },
};

// Synthesised priorities per stage, drawn from what the major pedagogies converge on
const COMBINED_PRIORITIES = {
  "0-2": [
    "Your consistent, attuned presence is the entire curriculum at this stage — no program can substitute it.",
    "Protect unstructured sensory time: touch, movement, natural light, silence, and varied textures matter more than stimulation.",
    "Language immersion in the mother tongue lays the deepest cognitive foundations — sing, narrate, converse constantly.",
    "Order and rhythm in daily life give the child's nervous system a felt sense of safety that underpins all future learning.",
    "The quality of your relationship with each other (as parents) is part of the child's environment — she absorbs it.",
  ],
  "3-5": [
    "Real work and real tools over toys: cooking, gardening, simple crafts, and household tasks develop far more than play kitchens.",
    "Stories, not screens — the narrative imagination being built now is the substrate for literacy, empathy, and moral reasoning.",
    "Outdoor, unstructured time in nature is non-negotiable: every philosophy from Waldorf to Forest School to Gurukul agrees.",
    "Don't narrow her world yet — resist gendered toys, competitive comparisons, and premature academic pressure.",
    "The child's inner life (feelings, imagination, spiritual wonder) is as real as her outer behaviour — attend to both.",
  ],
  "6-8": [
    "The reasoning mind is waking up: honour 'why' questions seriously rather than deflecting or giving rote answers.",
    "Hands-on, embodied learning cements understanding — what she makes, builds, or grows will be remembered; what she memorises often won't.",
    "This is when academic confidence gaps begin forming, especially in mathematics — protect her sense of capability actively.",
    "Nature contact, arts, and physical challenge are developmental requirements at this stage, not electives.",
    "Watch for the early signs of social comparison and peer hierarchy — this is when belonging starts to compete with authenticity.",
  ],
  "9-11": [
    "Peer relationships have become the central developmental arena — your role shifts from director to nearby witness.",
    "She needs real responsibility, not simulated responsibility: a project, a role, a community contribution with actual stakes.",
    "Keep the emotional door open before early adolescence closes it — regular one-on-one time matters more than parenting strategies.",
    "Depth over breadth: one genuine passion pursued seriously is more developmental than a full schedule of activities.",
    "Her moral reasoning is sophisticated now — treat ethical questions seriously, disagree openly, and change your mind when she's right.",
  ],
  "12-15": [
    "Identity is being built from the inside out — she needs to know her worth is not conditional on performance, appearance, or approval.",
    "The relationship she has with you must be worth having: be a person she actually wants to talk to, not just someone she reports to.",
    "Find mentors outside the family — people who embody something she wants to move toward carry different authority than parents.",
    "Physical, mental, and psychic health are one system at this stage: sleep, movement, silence, and beauty are not luxuries.",
    "Help her develop a relationship with her own mind — not what to think, but how to think, how to question, how to be still.",
  ],
};

const DEFAULT_SELECTED = new Set(["montessori","waldorf","reggio","gurukul","krishnamurti","aurobindo"]);

// Replace she/her pronouns based on gender selection
function applyPronouns(text, gender) {
  if (!gender || gender === "girl") return text;
  if (gender === "boy") {
    return text
      .replace(/\bShe\b/g, "He")
      .replace(/\bshe\b/g, "he")
      .replace(/\bHer\b/g, "His")
      .replace(/\bherself\b/g, "himself")
      .replace(/\bHerself\b/g, "Himself")
      // "her" at end of clause or before punctuation = object "him"
      .replace(/\bher([,\.\!\?;: "])/g, "him$1")
      .replace(/\bher$/g, "him")
      // remaining "her" (possessive before noun) → "his"
      .replace(/\bher\b/g, "his");
  }
  if (gender === "open") {
    return text
      .replace(/\bShe\b/g, "They")
      .replace(/\bshe\b/g, "they")
      .replace(/\bHer\b/g, "Their")
      .replace(/\bherself\b/g, "themselves")
      .replace(/\bHerself\b/g, "Themselves")
      .replace(/\bher([,\.\!\?;: "])/g, "them$1")
      .replace(/\bher$/g, "them")
      .replace(/\bher\b/g, "their");
  }
  return text;
}

function calcAgeFromDob(dob) {
  if (!dob) return { age: "", months: 0 };
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let mos = now.getMonth() - birth.getMonth();
  if (mos < 0) { years--; mos += 12; }
  if (now.getDate() < birth.getDate()) { mos--; if (mos < 0) { years--; mos += 12; } }
  if (years < 0) return { age: "0", months: 0 };
  return { age: String(Math.min(years, 15)), months: Math.max(0, mos) };
}

function ChildCompass() {
  const [dob, setDob] = useState("");
  const [selectedSchools, setSelectedSchools] = useState(new Set(DEFAULT_SELECTED));
  const [activeSchoolKey, setActiveSchoolKey] = useState("montessori");
  const [gender, setGender] = useState("");
  const [childName, setChildName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState("mom");

  const { age, months } = useMemo(() => calcAgeFromDob(dob), [dob]);
  const school = SCHOOL_DATA[activeSchoolKey];
  const ageRange = age !== "" ? getAgeRange(Number(age)) : null;
  const ageData = school && ageRange ? school.ages[ageRange] : null;
  const genderNotes = gender && gender !== "open" && ageRange ? GENDER_NOTES[gender]?.[ageRange] : null;
  const stageProgress = age !== "" ? getStageProgress(age, months) : null;
  const ageDisplay = age !== "" ? `${age}y${Number(months) > 0 ? ` ${months}m` : ""}` : "—";

  const childLabel = childName || (gender === "girl" ? "she" : gender === "boy" ? "he" : "your child");
  const childPronoun = gender === "girl" ? "her" : gender === "boy" ? "his" : "their";

  // today minus 15 years as max DOB
  const maxDob = new Date(); maxDob.setFullYear(maxDob.getFullYear() - 0);
  const minDob = new Date(); minDob.setFullYear(minDob.getFullYear() - 16);
  const maxDobStr = maxDob.toISOString().split("T")[0];
  const minDobStr = minDob.toISOString().split("T")[0];

  function toggleSchool(key) {
    setSelectedSchools(prev => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); }
      else next.add(key);
      return next;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!dob || selectedSchools.size === 0) return;
    // set active school to first selected (preserving insertion order)
    const first = [...selectedSchools].find(k => SCHOOL_DATA[k]) || [...selectedSchools][0];
    setActiveSchoolKey(first);
    setActiveTab("mom");
    setSubmitted(true);
  }

  function handleReset() {
    setSubmitted(false);
    setActiveTab("mom");
  }

  const tabStyle = (key) => ({
    padding: "8px 20px", fontWeight: 700, fontSize: "0.82rem", border: "none",
    borderRadius: 20, cursor: "pointer", transition: "all 0.15s",
    background: activeTab === key ? school?.color || "var(--leaf)" : "var(--band)",
    color: activeTab === key ? "#fff" : "var(--muted)",
  });

  const labelStyle = { fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 10 };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {!submitted ? (
        /* ── Setup form ── */
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 30 }}>

          {/* Row 1: Name + DOB */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={labelStyle}>Child's name <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
              <input type="text" placeholder="e.g. Ananya" value={childName}
                onChange={(e) => setChildName(e.target.value)}
                style={{ padding: "10px 14px", fontSize: "1rem", border: "1.5px solid var(--line)", borderRadius: 8, background: "var(--white)", color: "var(--ink)", outline: "none", width: "100%", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={labelStyle}>{childName ? `${childName}'s date of birth` : "Date of birth"}</label>
              <input type="date" value={dob} min={minDobStr} max={maxDobStr}
                onChange={(e) => setDob(e.target.value)}
                style={{ padding: "10px 14px", fontSize: "1rem", border: "1.5px solid var(--line)", borderRadius: 8, background: "var(--white)", color: dob ? "var(--ink)" : "var(--muted)", outline: "none", width: "100%", fontFamily: "inherit", boxSizing: "border-box", accentColor: "var(--leaf)" }} />
              {dob && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: "1.5rem", color: "var(--leaf)" }}>{ageDisplay}</span>
                  {ageRange && <span style={{ fontSize: "0.8rem", color: "var(--muted)", background: "var(--band)", padding: "3px 10px", borderRadius: 12 }}>{ageRange} stage</span>}
                </div>
              )}
            </div>
          </div>

          {/* Gender */}
          <div>
            <label style={labelStyle}>Gender</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[["girl","Girl","#b94c36"],["boy","Boy","#315f86"],["open","Open / Prefer not to say","#7a5c3a"]].map(([key, label, col]) => (
                <button key={key} type="button" onClick={() => setGender(key)}
                  style={{ padding: "10px 18px", fontWeight: 700, fontSize: "0.85rem",
                    border: `2px solid ${gender === key ? col : "var(--line)"}`,
                    borderRadius: 24, cursor: "pointer", background: gender === key ? `${col}15` : "var(--white)",
                    color: gender === key ? col : "var(--muted)", transition: "all 0.15s" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Pedagogy multi-select */}
          <div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Pedagogy / Philosophy</label>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                {selectedSchools.size} selected · tap to toggle
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
              {Object.entries(SCHOOL_DATA).map(([key, s]) => {
                const sel = selectedSchools.has(key);
                return (
                  <button key={key} type="button" onClick={() => toggleSchool(key)}
                    style={{ padding: "12px 14px", border: `2px solid ${sel ? s.color : "var(--line)"}`,
                      borderRadius: 10, background: sel ? `${s.color}12` : "var(--white)",
                      cursor: "pointer", textAlign: "left", transition: "all 0.15s", position: "relative" }}>
                    {sel && (
                      <span style={{ position: "absolute", top: 8, right: 10, width: 18, height: 18,
                        borderRadius: "50%", background: s.color, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.65rem", color: "#fff", fontWeight: 900 }}>✓</span>
                    )}
                    <div style={{ fontWeight: 700, fontSize: "0.86rem", color: sel ? s.color : "var(--ink)", paddingRight: sel ? 22 : 0 }}>{s.name}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: 3, lineHeight: 1.35 }}>{s.subtitle}</div>
                  </button>
                );
              })}
            </div>
            {/* Selected taglines preview */}
            {selectedSchools.size > 0 && (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                {[...selectedSchools].map(k => SCHOOL_DATA[k]).filter(Boolean).map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0, marginTop: 4 }} />
                    <span style={{ fontSize: "0.78rem", color: "var(--muted)", fontStyle: "italic", lineHeight: 1.4 }}>{s.tagline}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={!dob || selectedSchools.size === 0}
            style={{ padding: "14px 28px", fontWeight: 700, fontSize: "0.95rem", border: "none", borderRadius: 8,
              background: dob && selectedSchools.size > 0 ? "var(--leaf)" : "var(--line)",
              color: dob && selectedSchools.size > 0 ? "var(--white)" : "var(--muted)",
              cursor: dob && selectedSchools.size > 0 ? "pointer" : "not-allowed" }}>
            Show me what to look for this year →
          </button>
        </form>
      ) : (
        /* ── Results ── */
        <div>
          {/* Back */}
          <button onClick={handleReset}
            style={{ background: "none", border: "none", color: "var(--leaf)", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", padding: 0, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
            ← Change details
          </button>

          {/* Child summary pill row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
            {childName && <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--ink)" }}>{childName}</span>}
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--leaf)", background: "#f0f7f3", padding: "4px 12px", borderRadius: 12 }}>{ageDisplay}</span>
            {ageRange && <span style={{ fontSize: "0.8rem", color: "var(--muted)", background: "var(--band)", padding: "4px 12px", borderRadius: 12 }}>Stage {ageRange}</span>}
            {gender && gender !== "open" && (
              <span style={{ fontSize: "0.8rem", fontWeight: 700, padding: "4px 12px", borderRadius: 12,
                background: gender === "girl" ? "#b94c3615" : "#315f8615",
                color: gender === "girl" ? "#b94c36" : "#315f86" }}>
                {gender === "girl" ? "Girl" : "Boy"}
              </span>
            )}
          </div>

          {/* Pedagogy switcher tabs + Summary button */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20, padding: "12px 14px", background: "var(--band)", borderRadius: 12 }}>
            {/* Summary always first */}
            <button type="button" onClick={() => setActiveSchoolKey("__summary__")}
              style={{ padding: "6px 14px", fontWeight: 700, fontSize: "0.78rem",
                border: `2px solid ${activeSchoolKey === "__summary__" ? "var(--leaf)" : "transparent"}`,
                borderRadius: 20, cursor: "pointer",
                background: activeSchoolKey === "__summary__" ? "#f0f7f3" : "var(--white)",
                color: activeSchoolKey === "__summary__" ? "var(--leaf)" : "var(--muted)", transition: "all 0.15s" }}>
              ✦ Summary
            </button>
            {[...selectedSchools].map(k => {
              const s = SCHOOL_DATA[k]; if (!s) return null;
              const active = k === activeSchoolKey;
              return (
                <button key={k} type="button" onClick={() => { setActiveSchoolKey(k); setActiveTab("mom"); }}
                  style={{ padding: "6px 14px", fontWeight: 700, fontSize: "0.78rem",
                    border: `2px solid ${active ? s.color : "transparent"}`,
                    borderRadius: 20, cursor: "pointer", background: active ? `${s.color}15` : "var(--white)",
                    color: active ? s.color : "var(--muted)", transition: "all 0.15s" }}>
                  {s.name}
                </button>
              );
            })}
          </div>

          {/* ── SUMMARY VIEW ── */}
          {activeSchoolKey === "__summary__" ? (
            <div>
              {/* Combined priorities */}
              {ageRange && COMBINED_PRIORITIES[ageRange] && (
                <div style={{ background: "#f0f7f3", border: "1.5px solid var(--leaf)", borderRadius: 14, padding: "22px 24px", marginBottom: 24 }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--leaf)" }}>
                    Priorities for this year · Stage {ageRange} · {ageDisplay}
                  </p>
                  <p style={{ margin: "0 0 16px", fontSize: "0.82rem", color: "var(--muted)" }}>
                    What {[...selectedSchools].map(k => SCHOOL_DATA[k]?.name).filter(Boolean).join(", ")} all converge on for this stage
                  </p>
                  <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                    {COMBINED_PRIORITIES[ageRange].map((p, i) => (
                      <li key={i} style={{ fontSize: "0.92rem", lineHeight: 1.65, color: "var(--ink)", fontWeight: i === 0 ? 600 : 400 }}>
                        {applyPronouns(p, gender)}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Per-philosophy focus cards */}
              <p style={{ margin: "0 0 12px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
                What each philosophy focuses on at {ageDisplay}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
                {[...selectedSchools].map(k => {
                  const s = SCHOOL_DATA[k]; if (!s) return null;
                  const ad = ageRange ? s.ages?.[ageRange] : null;
                  return (
                    <div key={k} style={{ border: `1.5px solid ${s.color}30`, borderLeft: `4px solid ${s.color}`, borderRadius: "0 12px 12px 0", padding: "14px 18px", background: `${s.color}06` }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: "0.88rem", color: s.color }}>{s.name}</span>
                        {ad?.stage && <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{ad.stage}</span>}
                      </div>
                      {ad?.schoolFocus && (
                        <p style={{ margin: "0 0 8px", fontSize: "0.85rem", lineHeight: 1.55, color: "var(--ink)" }}>
                          {applyPronouns(ad.schoolFocus, gender)}
                        </p>
                      )}
                      {s.schools && (
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)" }}>
                          <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Schools: </span>
                          {s.schools.slice(0, 3).join(" · ")}
                        </p>
                      )}
                      <button type="button" onClick={() => { setActiveSchoolKey(k); setActiveTab("mom"); }}
                        style={{ marginTop: 10, padding: "5px 12px", fontSize: "0.72rem", fontWeight: 700, border: `1.5px solid ${s.color}`, borderRadius: 16, background: "transparent", color: s.color, cursor: "pointer" }}>
                        See full details →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
          <>
          {/* Header strip for active school */}
          <div style={{ borderLeft: `4px solid ${school.color}`, paddingLeft: 20, marginBottom: 16 }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: school.color }}>
              {school.name} · {ageData?.stage}
            </p>
            <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: "1.05rem", color: "var(--ink)", lineHeight: 1.4 }}>
              {applyPronouns(ageData?.childWorld || "", gender)}
            </p>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)", fontStyle: "italic" }}>{school.tagline}</p>
            {school.schools && (
              <div style={{ marginTop: 10 }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Schools in India: </span>
                <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{school.schools.join(" · ")}</span>
              </div>
            )}
          </div>

          {/* This year's priority — always shown, school-specific */}
          {ageData?.schoolFocus && (
            <div style={{ background: `${school.color}0f`, borderLeft: `4px solid ${school.color}`, borderRadius: "0 10px 10px 0", padding: "14px 18px", marginBottom: 16 }}>
              <p style={{ margin: "0 0 4px", fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: school.color }}>
                This year's focus · {school.name}
              </p>
              <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "var(--ink)", lineHeight: 1.5 }}>{applyPronouns(ageData.schoolFocus, gender)}</p>
            </div>
          )}

          {/* Gender context — supplemental, only when gender is selected */}
          {genderNotes && (
            <div style={{ background: "var(--band)", border: "1.5px solid var(--line)", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
                  {gender === "girl" ? "Girl" : "Boy"} · Stage {ageRange} context
                </p>
                <span style={{ fontSize: "0.7rem", color: "var(--muted)", fontStyle: "italic" }}>same across this whole stage</span>
              </div>
              {genderNotes.context && <p style={{ margin: "0 0 10px", fontSize: "0.88rem", color: "var(--ink)", lineHeight: 1.55 }}>{genderNotes.context}</p>}
              <div style={{ background: "var(--white)", borderRadius: 8, padding: "10px 14px", borderLeft: `3px solid var(--leaf)` }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--leaf)" }}>Stage priority · </span>
                <span style={{ fontSize: "0.87rem", fontWeight: 600, color: "var(--ink)" }}>{genderNotes.priority}</span>
              </div>
            </div>
          )}

          {/* School focus + philosophy row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div style={{ background: "var(--band)", borderRadius: 10, padding: "16px 18px" }}>
              <p style={{ margin: "0 0 6px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
                What {school.name} emphasises at {ageDisplay}
              </p>
              <p style={{ margin: 0, fontSize: "0.87rem", lineHeight: 1.55 }}>{applyPronouns(ageData?.schoolFocus || "", gender)}</p>
            </div>
            <div style={{ background: "var(--band)", borderRadius: 10, padding: "16px 18px" }}>
              <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: school.color }}>
                Core philosophy
              </p>
              <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 5 }}>
                {school.philosophy.slice(0, 3).map((p, i) => (
                  <li key={i} style={{ fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.45 }}>{p}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tabs: Mom / Dad / Together */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["mom","dad","together"].map(k => (
              <button key={k} style={tabStyle(k)} onClick={() => setActiveTab(k)}>
                {k === "mom" ? "Mom watches" : k === "dad" ? "Dad carries" : "Together"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ background: "var(--white)", border: "1.5px solid var(--line)", borderRadius: 14, padding: "24px 22px", marginBottom: 20 }}>
            {activeTab === "mom" && ageData && (
              <>
                <p style={{ margin: "0 0 4px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>What mom watches</p>
                <p style={{ margin: "0 0 16px", fontSize: "0.82rem", color: "var(--muted)" }}>Patterns and signals to pay attention to this year</p>
                <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...ageData.momWatch, ...(genderNotes?.momExtra || [])].map((item, i) => {
                    const isExtra = i >= ageData.momWatch.length;
                    const extraColor = gender === "boy" ? "#315f86" : "#7a5c3a";
                    return (
                      <li key={i} style={{ fontSize: "0.875rem", lineHeight: 1.6, color: isExtra ? extraColor : "var(--ink)" }}>
                        {applyPronouns(item, gender)}
                        {isExtra && <span style={{ fontSize: "0.7rem", fontWeight: 700, marginLeft: 6, opacity: 0.7 }}>· {gender}</span>}
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
            {activeTab === "dad" && ageData && (
              <>
                <p style={{ margin: "0 0 4px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>What dad carries</p>
                <p style={{ margin: "0 0 16px", fontSize: "0.82rem", color: "var(--muted)" }}>What to do, offer, and be this year</p>
                <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...ageData.dadCarry, ...(genderNotes?.dadExtra || [])].map((item, i) => {
                    const isExtra = i >= ageData.dadCarry.length;
                    const extraColor = gender === "boy" ? "#315f86" : "#7a5c3a";
                    return (
                      <li key={i} style={{ fontSize: "0.875rem", lineHeight: 1.6, color: isExtra ? extraColor : "var(--ink)" }}>
                        {applyPronouns(item, gender)}
                        {isExtra && <span style={{ fontSize: "0.7rem", fontWeight: 700, marginLeft: 6, opacity: 0.7 }}>· {gender}</span>}
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
            {activeTab === "together" && (
              <>
                <p style={{ margin: "0 0 4px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: school.color }}>Both parents together</p>
                <p style={{ margin: "0 0 20px", fontSize: "0.82rem", color: "var(--muted)" }}>Conversations to have, things to do as a family</p>
                {genderNotes?.conversation && (
                  <div style={{ background: `${school.color}10`, border: `1.5px solid ${school.color}30`, borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
                    <p style={{ margin: "0 0 4px", fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: school.color }}>Conversation to have this year</p>
                    {genderNotes.conversation.map((c, i) => (
                      <p key={i} style={{ margin: i === 0 ? 0 : "8px 0 0", fontSize: "0.9rem", fontStyle: "italic", fontWeight: 600, color: "var(--ink)" }}>"{applyPronouns(c, gender)}"</p>
                    ))}
                  </div>
                )}
                <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                  {school.philosophy.map((p, i) => (
                    <li key={i} style={{ fontSize: "0.875rem", lineHeight: 1.55, color: "var(--muted)" }}>{p}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Stage progress */}
          {stageProgress && (
            <div style={{ background: "#f0f7f3", borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--leaf)" }}>
                  Stage {ageRange} · {stageProgress.label === "early" ? "Just beginning" : stageProgress.label === "mid" ? "Mid stage" : "Approaching transition"}
                </p>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>{ageDisplay} · {stageProgress.monthsLeft}m left</span>
              </div>
              <div style={{ background: "var(--line)", borderRadius: 6, height: 8, marginBottom: 10, overflow: "hidden" }}>
                <div style={{ width: `${stageProgress.pct}%`, height: "100%", borderRadius: 6, background: stageProgress.label === "late" ? "#c46a1e" : "var(--leaf)", transition: "width 0.4s ease" }} />
              </div>
              <p style={{ margin: "0 0 8px", fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.6 }}>{STAGE_POSITION_TEXT[stageProgress.label](ageRange)}</p>
              {stageProgress.label === "late" && stageProgress.nextStage && (
                <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 4 }}>
                  <p style={{ margin: "0 0 3px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#c46a1e" }}>Coming next</p>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.55 }}>{NEXT_STAGE_PREVIEW[ageRange]}</p>
                </div>
              )}
            </div>
          )}
          </>
          )}
        </div>
      )}
    </div>
  );
}

function App() {
  const [route, setRoute] = useState(getRoute);
  const page = useMemo(() => {
    if (route === "/little-human") return <LittleHumanPage />;
    if (route === "/resume") return <ResumePage />;
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
