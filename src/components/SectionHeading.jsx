import { useRenderTracker } from "../hooks/useRenderTracker";

export default function SectionHeading({ eyebrow, title }) {
  useRenderTracker("SectionHeading");
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
    </div>
  );
}
