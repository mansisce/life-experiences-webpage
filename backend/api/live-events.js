/**
 * live-events.js — fetch real upcoming family/kids events in Bangalore
 * from Eventbrite and Meetup, normalised to the internal event format.
 *
 * Results are cached in-memory for LIVE_CACHE_TTL_MIN minutes so we
 * don't hammer rate limits on every frontend reload.
 */

const BANGALORE_LAT = 12.9716;
const BANGALORE_LON = 77.5946;
const RADIUS_KM = 25;
const TTL_MS = (Number(process.env.LIVE_CACHE_TTL_MIN) || 60) * 60 * 1000;

// Simple in-memory cache: { ts, events[] }
let _cache = null;

// ── Tag inference ─────────────────────────────────────────────────────────────

const KEYWORD_TAG_MAP = [
  // Core craft & making (CraftyMeets speciality)
  [/pottery|clay|wheel|ceramic/i,          ["hands-on", "practical-life", "making", "tactile", "concentration"]],
  [/craft|macramé|macrame|terrarium|resin|candle|origami|journaling|collage|mosaic|block.?print/i,
                                            ["hands-on", "making", "creative-expression", "practical-life"]],
  [/paint|watercolour|watercolor|acrylic|mandala|sketch|draw|illustration/i,
                                            ["aesthetic-sense", "creative-expression", "concentration", "hands-on"]],
  [/knit|sew|weave|embroidery|crochet/i,   ["hands-on", "practical-life", "making", "patience"]],
  [/photography|photo.?walk/i,             ["aesthetic-sense", "observation", "creative-expression"]],
  // Performing arts
  [/music|concert|sing|drum|tabla|carnatic|hindustani|classical/i,
                                            ["sensitivity", "rhythm", "aesthetic-sense", "inner-life"]],
  [/dance|movement|ballet|bharatnatyam|kathak|zumba/i,
                                            ["physical-development", "embodied-learning", "expression", "rhythm"]],
  [/theatre|drama|play|improv|storytelling|puppet/i,
                                            ["story", "expression", "community", "imagination"]],
  // Nature & science
  [/nature|trail|garden|plant|bird|ecology|forest/i,
                                            ["ecological", "sensory", "nature-connection", "outdoor-learning"]],
  [/science|robotics|tinker|lab|experiment|astronomy/i,
                                            ["inquiry", "questioning-mind", "science-wonder", "hands-on"]],
  [/cook|bake|food|kitchen|ferment|sourdough/i,
                                            ["practical-life", "real-world", "hands-on", "ecological"]],
  // Wellness & mindfulness
  [/yoga|mindful|meditation|breathwork/i,  ["inner-life", "silence", "holistic-human", "self-regulation"]],
  [/fitness|climb|sport|outdoor|adventure|trek/i,
                                            ["physical-development", "risk-taking", "resilience", "embodied-learning"]],
  // Story & culture
  [/story|book|read|tale|poetry|slam/i,    ["story", "imagination", "language", "oral-tradition"]],
  [/heritage|history|culture|walk|archive/i,
                                            ["cultural-roots", "heritage", "place-based", "story"]],
  [/farm|market|organic|permaculture/i,    ["ecological", "community", "real-world", "practical-life"]],
  // Strategy
  [/chess|puzzle|strategy|board.?game/i,   ["reasoning", "patience", "strategy", "focus"]],
];

function inferTags(text) {
  const tags = new Set();
  for (const [re, t] of KEYWORD_TAG_MAP) {
    if (re.test(text)) t.forEach(x => tags.add(x));
  }
  return [...tags];
}

function inferArea(text) {
  if (/music|concert|drum|tabla|carnatic|hindustani|dance|movement|ballet|bharatnatyam|kathak|zumba/.test(text)) return "Music & Movement";
  if (/theatre|drama|play|improv|story|book|puppet|poetry|slam/.test(text)) return "Story & Culture";
  if (/science|robotics|tinker|lab|nature|ecology|plant|bird|astronomy/.test(text)) return "Nature & Science";
  if (/craft|pottery|clay|art|paint|draw|macr|terrarium|resin|candle|journaling|collage|knit|sew|weave|embroid|photography/.test(text)) return "Creative & Making";
  if (/climb|sport|outdoor|adventure|yoga|trek|fitness/.test(text)) return "Outdoor & Active";
  if (/chess|puzzle|board.?game/.test(text)) return "Games & Strategy";
  return "Creative & Making";
}

// ── Eventbrite ────────────────────────────────────────────────────────────────

async function fetchEventbrite() {
  const token = process.env.EVENTBRITE_TOKEN;
  if (!token) return [];

  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // next 7 days

  const params = new URLSearchParams({
    "location.latitude": BANGALORE_LAT,
    "location.longitude": BANGALORE_LON,
    "location.within": `${RADIUS_KM}km`,
    "q": "kids family children",
    "start_date.range_start": now.toISOString().replace(/\.\d{3}Z$/, "Z"),
    "start_date.range_end": end.toISOString().replace(/\.\d{3}Z$/, "Z"),
    "expand": "venue,organizer,ticket_availability",
    "sort_by": "date",
    "page_size": "50",
  });

  const resp = await fetch(`https://www.eventbriteapi.com/v3/events/search/?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    console.warn("[live-events] Eventbrite error:", resp.status, await resp.text());
    return [];
  }

  const json = await resp.json();
  return (json.events || []).map(e => {
    const title = e.name?.text || "";
    const desc = e.description?.text || title;
    const venueName = e.venue?.name || "Bangalore";
    const venueCity = e.venue?.address?.city || "Bangalore";
    const start = new Date(e.start?.local || e.start?.utc || "");
    const isFree = e.is_free;
    const ticketUrl = e.url;
    const combined = `${title} ${desc}`;

    return {
      id: `eb-${e.id}`,
      name: title,
      provider: e.organizer?.name || "Eventbrite",
      venue: `${venueName}, ${venueCity}`,
      area: inferArea(combined),
      free: isFree,
      cost: isFree ? "Free" : "Check Eventbrite",
      source: "Eventbrite",
      registrationUrl: ticketUrl,
      date: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][start.getDay()],
      time: start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
      recurring: false,
      live: true,
      liveDate: start.toISOString(),
      ageMin: /teen|12\+|13\+|14\+|15\+/.test(combined) ? 12
             : /junior|6\+|7\+|8\+|9\+|10\+|11\+/.test(combined) ? 6
             : /toddler|1\+|2\+|3\+|4\+|5\+/.test(combined) ? 2
             : 3,
      venueZone: "central",
      pedagogyTags: inferTags(combined),
      builds: [],
    };
  });
}

// ── Meetup (GraphQL API) ──────────────────────────────────────────────────────

async function fetchMeetup() {
  const key = process.env.MEETUP_KEY;
  if (!key) return [];

  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const query = `
    query($filter: ConnectionFilter) {
      keywordSearch(filter: $filter, first: 40) {
        edges {
          node {
            result {
              ... on Event {
                id
                title
                dateTime
                endTime
                eventUrl
                isOnline
                venue { name address city }
                group { name }
                going
                feeSettings { amount currency }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    filter: {
      query: "kids family children education",
      lat: BANGALORE_LAT,
      lon: BANGALORE_LON,
      radius: RADIUS_KM,
      startDateRange: now.toISOString(),
      endDateRange: end.toISOString(),
    },
  };

  const resp = await fetch("https://api.meetup.com/gql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!resp.ok) {
    console.warn("[live-events] Meetup error:", resp.status, await resp.text());
    return [];
  }

  const json = await resp.json();
  const edges = json.data?.keywordSearch?.edges || [];

  return edges
    .map(edge => edge?.node?.result)
    .filter(e => e && e.dateTime && !e.isOnline)
    .map(e => {
      const start = new Date(e.dateTime);
      const combined = `${e.title} ${e.group?.name || ""}`;
      const isFree = !e.feeSettings?.amount;

      return {
        id: `mu-${e.id}`,
        name: e.title,
        provider: e.group?.name || "Meetup",
        venue: `${e.venue?.name || ""}, ${e.venue?.city || "Bangalore"}`.replace(/^, /, ""),
        area: inferArea(combined),
        free: isFree,
        cost: isFree ? "Free" : `₹${e.feeSettings?.amount || "?"}`,
        source: "Meetup",
        registrationUrl: e.eventUrl,
        date: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][start.getDay()],
        time: start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
        recurring: false,
        live: true,
        liveDate: start.toISOString(),
        ageMin: 3,
        venueZone: "central",
        pedagogyTags: inferTags(combined),
        builds: [],
      };
    });
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchLiveEvents({ force = false } = {}) {
  if (!force && _cache && Date.now() - _cache.ts < TTL_MS) {
    console.log(`[live-events] cache hit (${_cache.events.length} events)`);
    return _cache.events;
  }

  console.log("[live-events] fetching from Eventbrite + Meetup ...");
  const [eb, mu] = await Promise.allSettled([fetchEventbrite(), fetchMeetup()]);

  const events = [
    ...(eb.status === "fulfilled" ? eb.value : []),
    ...(mu.status === "fulfilled" ? mu.value : []),
  ];

  if (eb.status === "rejected") console.warn("[live-events] Eventbrite failed:", eb.reason);
  if (mu.status === "rejected") console.warn("[live-events] Meetup failed:", mu.reason);

  // Sort by date ascending
  events.sort((a, b) => new Date(a.liveDate) - new Date(b.liveDate));

  _cache = { ts: Date.now(), events };
  console.log(`[live-events] cached ${events.length} live events`);
  return events;
}

export function clearCache() { _cache = null; }
