import { useRenderTracker } from "../hooks/useRenderTracker";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";
import ScrollButton from "../components/ScrollButton";
import { resumeSkills, resumeExperience, resumeEducation } from "../data";

export default function ResumePage() {
  useRenderTracker("ResumePage");

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
