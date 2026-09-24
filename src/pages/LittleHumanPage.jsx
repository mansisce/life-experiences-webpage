import { useRenderTracker } from "../hooks/useRenderTracker";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";
import ScrollButton from "../components/ScrollButton";
import ExploreForHer from "../components/ExploreForHer";
import WeekendPicks from "../components/WeekendPicks";
import ChildCompass from "../components/ChildCompass";
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
