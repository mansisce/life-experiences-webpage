import { useRenderTracker } from "../hooks/useRenderTracker";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";
import ScrollButton from "../components/ScrollButton";
import { reactConcepts, interviewQuestions } from "../data";

export default function ReactLabPage() {
  useRenderTracker("ReactLabPage");

  return (
    <main>
      <PageHero
        eyebrow="React learning lab"
        title="Tricky React Compiler concepts I am mastering"
        copy="A focused page for the concepts, examples, and interview questions I am collecting while learning modern React, compiler-friendly patterns, hooks, rendering behavior, and performance."
        actions={
          <>
            <ScrollButton target="concepts">Concepts</ScrollButton>
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
