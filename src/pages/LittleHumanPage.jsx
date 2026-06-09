import { useRenderTracker } from "../hooks/useRenderTracker";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";
import ScrollButton from "../components/ScrollButton";
import { littleHumanRhythms, littleHumanQuestions } from "../data";

export default function LittleHumanPage() {
  useRenderTracker("LittleHumanPage");

  return (
    <main>
      <PageHero
        eyebrow="Where my time goes"
        title="Building a little human"
        copy="This is the page for the work that does not always look like work: shaping her thoughts, language, confidence, routines, imagination, and the way she learns to move through the world."
        actions={
          <>
            <ScrollButton target="rhythms">Daily rhythms</ScrollButton>
            <ScrollButton target="questions" variant="secondary">
              Reflection questions
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
    </main>
  );
}
