import { useRenderTracker } from "../hooks/useRenderTracker";

export default function PageHero({ eyebrow, title, copy, actions }) {
  useRenderTracker("PageHero");
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
