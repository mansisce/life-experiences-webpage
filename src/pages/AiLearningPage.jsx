import { useRenderTracker } from "../hooks/useRenderTracker";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";
import ScrollButton from "../components/ScrollButton";
import { aiLearning, bolnaNotes, aiProjects } from "../data";

export default function AiLearningPage() {
  useRenderTracker("AiLearningPage");

  return (
    <main>
      <PageHero
        eyebrow="AI learning"
        title="How I am learning AI by building agents"
        copy="A page for my AI notes, experiments, voice-agent learnings, prompt iterations, and the Bolna agent I have developed."
        actions={
          <>
            <ScrollButton target="bolna-agent">Bolna agent</ScrollButton>
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
