import { useRenderTracker } from "../hooks/useRenderTracker";

export default function SectionHeading({ eyebrow, title }) {
  const { trackStateInit, trackElementReturn } = useRenderTracker("SectionHeading");
  trackStateInit("eyebrow");
  trackStateInit("title");

  trackElementReturn();
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
    </div>
  );
}
