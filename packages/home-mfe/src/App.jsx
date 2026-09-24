/**
 * Home MFE App Component
 *
 * This is what shell loads and renders
 * Imported by shell as: const HomePage = lazy(() => import('home/App'))
 *
 * This component:
 * - Uses React from shell (singleton)
 * - Uses components from @lifeexp/shared (eager)
 * - Renders home page content
 * - Is independent from other MFEs
 */

import React from 'react';
import { SectionHeading, ScrollButton } from '@lifeexp/shared';
import { experiences, interests, recipes, workLessons, healthHabits } from './data';
import './HomePage.css';

export default function HomePageApp() {
  const [expandedSection, setExpandedSection] = React.useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Hi, I'm Mansi 👋</h1>
          <p className="hero-subtitle">
            Experienced engineer exploring React, AI, and life lessons
          </p>
        </div>
      </section>

      {/* Experiences Timeline */}
      <section className="section">
        <SectionHeading label="Experiences" />
        <div className="experiences-grid">
          {experiences.map((exp) => (
            <article key={exp.title} className="experience-card">
              <time className="exp-time">{exp.label}</time>
              <h3>{exp.title}</h3>
              <p>{exp.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Interests Section */}
      <section className="section">
        <SectionHeading label="Current Interests" />
        <div className="interests-grid">
          {interests.map((interest) => (
            <div
              key={interest.title}
              className="interest-card"
              onClick={() => toggleSection(interest.title)}
            >
              <h4>{interest.emoji} {interest.title}</h4>
              {expandedSection === interest.title && (
                <p className="interest-detail">{interest.description}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Recipes Section */}
      <section className="section">
        <SectionHeading label="Food Experiments" />
        <div className="recipes-grid">
          {recipes.map((recipe) => (
            <article key={recipe.title} className="recipe-card">
              <h3>{recipe.emoji} {recipe.title}</h3>
              <p>{recipe.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Work Lessons Section */}
      <section className="section">
        <SectionHeading label="Work Lessons" />
        <div className="lessons-grid">
          {workLessons.map((lesson) => (
            <div key={lesson.title} className="lesson-card">
              <h4>{lesson.title}</h4>
              <p>{lesson.insight}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Health Habits Section */}
      <section className="section">
        <SectionHeading label="Health & Habits" />
        <div className="habits-grid">
          {healthHabits.map((habit) => (
            <div key={habit.category} className="habit-item">
              <strong>{habit.category}</strong>: {habit.current}
            </div>
          ))}
        </div>
      </section>

      {/* Scroll Button */}
      <ScrollButton target="home-page" smooth={true} />
    </div>
  );
}

/**
 * ISOLATION & INDEPENDENCE:
 *
 * This Home MFE:
 * ✓ Own data file (./data.js with experiences, interests, etc)
 * ✓ Own styles (./HomePage.css)
 * ✓ Own state management (expandedSection)
 * ✓ Shared components via @lifeexp/shared (SectionHeading, ScrollButton)
 * ✓ Shared React via singleton (from shell)
 *
 * It does NOT:
 * ✗ Import from other MFEs (resume, reactLab, etc)
 * ✗ Share state with other MFEs
 * ✗ Know about routing (shell handles that)
 * ✗ Bundle React (shell provides it)
 *
 * Can be deployed independently:
 * - Edit ./data.js → Re-deploy home-mfe only
 * - Resume page unchanged, ReactLab unchanged
 * - Shell automatically loads new home-mfe when user navigates
 */
