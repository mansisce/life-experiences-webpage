const navItems = [
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

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Mansi Gupta home">
        MG
      </a>
      <nav className="nav" aria-label="Primary navigation">
        {navItems.map(([label, id]) => (
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

function App() {
  return (
    <>
      <Header />
      <main id="top">
        <section className="hero" aria-label="Personal introduction">
          <img className="hero-image" src="/life-journal-hero.png" alt="A journal desk scene with food, notes, and work tools." />
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="eyebrow">Life experiments, thoughtfully collected</p>
            <h1>Mansi Gupta</h1>
            <p className="hero-copy">
              Frontend engineer, React SME, team leader, and curious learner documenting the real threads of life:
              food, health, work, memories, and what each chapter keeps teaching me.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#work">
                Explore my work
              </a>
              <a className="button secondary" href="#resume">
                View resume snapshot
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

      <footer className="footer">
        <p>Built as a living page for Mansi Gupta.</p>
        <a href="#top">Back to top</a>
      </footer>
    </>
  );
}

export default App;
