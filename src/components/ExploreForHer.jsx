import { useState } from "react";

// ─── Explore for Her data ──────────────────────────────────────────────────────

const EXPLORE_AREAS = [
  {
    area: "Creative & Making",
    color: "#b94c36",
    icon: "✦",
    activities: [
      {
        name: "Golden Bridge Pottery",
        provider: "Coro",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app",
        builds: ["Fine motor", "Patience", "Sensory", "Making something real"],
        tags: ["Hands-on", "Ages 4+"],
      },
      {
        name: "Summer Art Camps",
        provider: "MAP — Museum of Art & Photography",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app",
        builds: ["Visual literacy", "Indian culture", "Creative expression"],
        tags: ["Cultural", "Ages 5+"],
      },
      {
        name: "DIY Science + Story Projects",
        provider: "Coro Afternoon Clubs",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app/featured-events/family-events-bangalore",
        builds: ["Curiosity", "Cause-and-effect", "Imagination"],
        tags: ["STEM + Arts", "Ages 5+"],
      },
      {
        name: "Sustainability Workshops",
        provider: "Bangalore Creative Circus",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app/spot/bangalore-creative-circus-3207",
        builds: ["Creative voice", "Sustainability thinking", "Making"],
        tags: ["Eco", "All ages"],
      },
    ],
  },
  {
    area: "Story & Culture",
    color: "#315f86",
    icon: "◈",
    activities: [
      {
        name: "Storytelling & Puppet Shows",
        provider: "Atta Galatta",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app",
        builds: ["Love of story", "Language", "Emotional vocabulary"],
        tags: ["Literary", "Ages 3+"],
      },
      {
        name: "Theatre Performances for Kids",
        provider: "Atta Galatta",
        source: "BookMyShow",
        sourceUrl: "https://in.bookmyshow.com",
        builds: ["Empathy", "Narrative", "Listening"],
        tags: ["Performance", "Ages 4+"],
      },
      {
        name: "Interactive Museum Trails",
        provider: "MAP",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app/featured-forkids/summer-activities",
        builds: ["Observation", "Asking questions", "Cultural identity"],
        tags: ["Cultural", "Ages 5+"],
      },
      {
        name: "Warli Tribal Art Experience",
        provider: "The Localway",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app",
        builds: ["Indigenous art", "Cultural respect", "Heritage"],
        tags: ["Cultural", "Ages 6+"],
      },
    ],
  },
  {
    area: "Nature & Outdoor",
    color: "#2f6f58",
    icon: "⬡",
    activities: [
      {
        name: "Nature Trails & Birdwatching",
        provider: "Urbanaut Curated",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app/experience-bengaluru/things-to-do",
        builds: ["Attention", "Stillness", "Ecological awareness"],
        tags: ["Outdoor", "All ages"],
      },
      {
        name: "Bat Walk — Wildlife Experience",
        provider: "Urbanaut Curated",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app",
        builds: ["Wonder", "Scientific curiosity", "Patience"],
        tags: ["Outdoor", "Ages 6+"],
      },
      {
        name: "Heritage Walks",
        provider: "Urbanaut Curated",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app/experience-bengaluru/things-to-do",
        builds: ["History", "Place-attachment", "Observation"],
        tags: ["Cultural", "Ages 7+"],
      },
      {
        name: "Farm-to-Table & Farmers Market",
        provider: "Bangalore Creative Circus",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app/spot/bangalore-creative-circus-3207",
        builds: ["Where food comes from", "Sustainability", "Sensory"],
        tags: ["Eco", "All ages"],
      },
    ],
  },
  {
    area: "Play & Social",
    color: "#7a5c3a",
    icon: "◎",
    activities: [
      {
        name: "Theme-Based Playdates",
        provider: "The Looroo Club",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app",
        builds: ["Role-play", "Social skills", "Imagination"],
        tags: ["Play", "Ages 2–6"],
      },
      {
        name: "Nature-Led Play (Norwegian Model)",
        provider: "Papagoya Education",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app",
        builds: ["Independence", "Outdoor comfort", "Experiential learning"],
        tags: ["Outdoor play", "Ages 2–6"],
      },
      {
        name: "Afternoon Clubs",
        provider: "Coro",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app/featured-events/family-events-bangalore",
        builds: ["Peer interaction", "Learning alongside others", "Curiosity"],
        tags: ["Social", "Ages 4+"],
      },
    ],
  },
  {
    area: "Music & Movement",
    color: "#5a3a7a",
    icon: "♩",
    activities: [
      {
        name: "Live Music & Choir Experiences",
        provider: "Urbanaut Events",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app/experience-bengaluru/things-to-do",
        builds: ["Listening", "Rhythm", "Aesthetic sense"],
        tags: ["Music", "All ages"],
      },
      {
        name: "Wellness & Movement Mornings",
        provider: "Urbanaut Wellness",
        source: "Urbanaut",
        sourceUrl: "https://urbanaut.app",
        builds: ["Body awareness", "Breath", "Community"],
        tags: ["Movement", "All ages"],
      },
      {
        name: "Dance & Theatre Workshops",
        provider: "Various",
        source: "BookMyShow",
        sourceUrl: "https://in.bookmyshow.com",
        builds: ["Expression", "Coordination", "Confidence"],
        tags: ["Performance", "Ages 4+"],
      },
    ],
  },
];

const DEV_TAGS = {
  "Fine motor": "#b94c36",
  "Curiosity": "#2f6f58",
  "Language": "#315f86",
  "Outdoor": "#2f6f58",
  "Cultural": "#7a5c3a",
  "Social": "#5a3a7a",
  "Sensory": "#b94c36",
};

export default function ExploreForHer() {
  const [activeArea, setActiveArea] = useState(null);

  const displayed = activeArea
    ? EXPLORE_AREAS.filter((a) => a.area === activeArea)
    : EXPLORE_AREAS;

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 36 }}>
        <button
          onClick={() => setActiveArea(null)}
          style={{
            padding: "7px 16px",
            borderRadius: 20,
            border: `1.5px solid ${activeArea === null ? "var(--leaf)" : "var(--line)"}`,
            background: activeArea === null ? "var(--leaf)" : "transparent",
            color: activeArea === null ? "var(--white)" : "var(--muted)",
            fontWeight: 600,
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          All areas
        </button>
        {EXPLORE_AREAS.map((a) => (
          <button
            key={a.area}
            onClick={() => setActiveArea(activeArea === a.area ? null : a.area)}
            style={{
              padding: "7px 16px",
              borderRadius: 20,
              border: `1.5px solid ${activeArea === a.area ? a.color : "var(--line)"}`,
              background: activeArea === a.area ? a.color : "transparent",
              color: activeArea === a.area ? "var(--white)" : "var(--muted)",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {a.icon} {a.area}
          </button>
        ))}
      </div>

      {/* Activity cards */}
      {displayed.map((area) => (
        <div key={area.area} style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: "1.1rem", color: area.color }}>{area.icon}</span>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: area.color, letterSpacing: "0.04em" }}>
              {area.area}
            </h3>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {area.activities.map((act) => (
              <div
                key={act.name}
                style={{
                  background: "var(--white)",
                  border: "1.5px solid var(--line)",
                  borderRadius: 12,
                  padding: "18px 18px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div>
                  <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)" }}>
                    {act.name}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>
                    {act.provider}
                  </p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {act.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: `${area.color}15`,
                        color: area.color,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted)" }}>
                    Builds
                  </p>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink)", lineHeight: 1.5 }}>
                    {act.builds.join(" · ")}
                  </p>
                </div>
                <a
                  href={act.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginTop: "auto",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: area.color,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  View on {act.source} →
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Dev map footer */}
      <div style={{ background: "var(--band)", borderRadius: 12, padding: "20px 24px", marginTop: 8 }}>
        <p style={{ margin: "0 0 12px", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
          What each area builds in her
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
          {[
            ["Creative & Making", "Fine motor, patience, creative confidence"],
            ["Story & Culture", "Language, empathy, cultural identity"],
            ["Nature & Outdoor", "Attention, wonder, ecological sense"],
            ["Play & Social", "Peer skills, independence, imagination"],
            ["Music & Movement", "Rhythm, body awareness, expression"],
          ].map(([area, desc]) => (
            <div key={area}>
              <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "0.8rem" }}>{area}</p>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
