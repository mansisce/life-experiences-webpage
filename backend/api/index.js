/**
 * Weekend Picks API — Express server backed by Neo4j
 *
 * GET  /events?age=5&school=cfl          → ranked events (Neo4j catalogue)
 * GET  /events/live?age=5                → real-time events (Eventbrite + Meetup)
 * POST /events/live/refresh              → force cache refresh
 * GET  /events/:id                        → single event
 * POST /events/:id/like                   → record like signal
 * POST /events/:id/dismiss                → record dismiss signal
 * POST /events/:id/register               → record registration
 * GET  /events/:id/url                    → resolve best deep link URL
 * GET  /health                            → health check
 */

import express from "express";
import cors from "cors";
import neo4j from "neo4j-driver";
import cron from "node-cron";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { fetchLiveEvents, clearCache } from "./live-events.js";
import { parseEventFromText } from "./parse-event.js";
import { syncInstagramEvents, syncCustomAccounts } from "./ig-sync.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IG_STORE = path.join(__dirname, "data", "ig-events.json");

const app = express();
const PORT = process.env.PORT || 3001;

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "littlehuman123"
  )
);

app.use(cors());
app.use(express.json());

// ─── Health ───────────────────────────────────────────────────────────────────

app.get("/health", async (_req, res) => {
  const s = driver.session();
  try {
    await s.run("RETURN 1");
    res.json({ status: "ok", neo4j: "connected" });
  } catch (e) {
    res.status(503).json({ status: "error", neo4j: e.message });
  } finally { s.close(); }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTIVE_SCHOOLS = ["montessori", "cfl", "jk"];

async function getSchoolPillars(session, schoolKey) {
  const result = await session.run(
    `MATCH (s:School {key: $key})-[:VALUES]->(t:Tag) RETURN t.name AS tag`,
    { key: schoolKey }
  );
  return new Set(result.records.map((r) => r.get("tag")));
}

async function scoreEvent(session, eventId, schoolKeys, likedIds, dismissedIds) {
  // Get event tags
  const tagResult = await session.run(
    `MATCH (e:Event {id: $id})-[:HAS_TAG]->(t:Tag) RETURN t.name AS tag`,
    { id: eventId }
  );
  const eventTags = tagResult.records.map((r) => r.get("tag"));

  // Per-school scores
  const schoolScores = {};
  for (const key of schoolKeys) {
    const pillars = await getSchoolPillars(session, key);
    const overlap = eventTags.filter((t) => pillars.has(t)).length;
    schoolScores[key] = Math.round((overlap / Math.max(eventTags.length, 1)) * 100);
  }
  const combined = Math.round(
    Object.values(schoolScores).reduce((s, v) => s + v, 0) / schoolKeys.length
  );

  // Preference signals via graph traversal
  let preferenceBonus = 0;
  if (likedIds.length) {
    const bonusResult = await session.run(
      `MATCH (e:Event {id: $id})-[:HAS_TAG]->(t:Tag)<-[:HAS_TAG]-(liked:Event)
       WHERE liked.id IN $likedIds
       RETURN count(t) AS overlap`,
      { id: eventId, likedIds }
    );
    preferenceBonus = (bonusResult.records[0]?.get("overlap")?.toNumber() || 0) * 8;
  }

  let preferencePenalty = 0;
  if (dismissedIds.length) {
    const penaltyResult = await session.run(
      `MATCH (e:Event {id: $id})-[:HAS_TAG]->(t:Tag)<-[:HAS_TAG]-(dismissed:Event)
       WHERE dismissed.id IN $dismissedIds
       RETURN count(t) AS overlap`,
      { id: eventId, dismissedIds }
    );
    preferencePenalty = (penaltyResult.records[0]?.get("overlap")?.toNumber() || 0) * 6;
  }

  return {
    schoolScores,
    score: Math.max(0, Math.min(100, combined + preferenceBonus - preferencePenalty)),
  };
}

function formatEvent(record) {
  const e = record.get("e").properties;
  return {
    id: e.id,
    name: e.name,
    provider: record.get("provider"),
    venue: e.venue,
    area: record.get("area"),
    free: e.free,
    cost: e.cost,
    source: record.get("source"),
    url: e.scrapedUrl || e.url,          // prefer scraped deep link
    fallbackUrl: e.url,
    date: e.date,
    ageMin: e.ageMin?.toNumber?.() ?? e.ageMin,
    builds: e.builds ?? [],
    tags: [],
  };
}

// ─── GET /events ──────────────────────────────────────────────────────────────

app.get("/events", async (req, res) => {
  const { age, liked = "", dismissed = "", free } = req.query;
  const likedIds = liked ? liked.split(",").filter(Boolean) : [];
  const dismissedIds = dismissed ? dismissed.split(",").filter(Boolean) : [];
  const ageNum = age ? Number(age) : null;
  const freeOnly = free === "true";

  const s = driver.session();
  try {
    let query = `
      MATCH (e:Event)-[:BY]->(p:Provider),
            (e)-[:IN_AREA]->(a:Area),
            (e)-[:FROM_SOURCE]->(src:Source)
      WHERE NOT e.id IN $dismissedIds
        AND NOT e.id IN $registeredIds
    `;
    const params = { dismissedIds, registeredIds: [], likedIds };

    if (ageNum !== null) {
      query += " AND e.ageMin <= $age";
      params.age = ageNum;
    }
    if (freeOnly) {
      query += " AND e.free = true";
    }

    query += " RETURN e, p.name AS provider, a.name AS area, src.name AS source";

    const result = await s.run(query, params);
    const events = result.records.map(formatEvent);

    // Score all events
    const scored = await Promise.all(
      events.map(async (ev) => {
        const { schoolScores, score } = await scoreEvent(s, ev.id, ACTIVE_SCHOOLS, likedIds, dismissedIds);
        // Free boost
        const finalScore = Math.min(100, score + (ev.free ? 8 : 0));
        return { ...ev, schoolScores, score: finalScore };
      })
    );

    // Add tags to each event
    for (const ev of scored) {
      const tagResult = await s.run(
        `MATCH (e:Event {id: $id})-[:HAS_TAG]->(t:Tag) RETURN t.name AS tag`,
        { id: ev.id }
      );
      ev.tags = tagResult.records.map((r) => r.get("tag"));
    }

    scored.sort((a, b) => b.score - a.score);
    res.json({ events: scored, total: scored.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// ─── GET /events/live — real-time events from Eventbrite + Meetup ─────────────
//
// Returns normalised event objects ready for the frontend to merge with
// the static EVENT_CATALOGUE. Cached server-side for LIVE_CACHE_TTL_MIN minutes.
//
// Query params:
//   force=true   bypass the TTL cache and re-fetch immediately
//   age=N        filter out events where ageMin > N

app.get("/events/live", async (req, res) => {
  try {
    const force = req.query.force === "true";
    let events = await fetchLiveEvents({ force });

    const age = req.query.age ? Number(req.query.age) : null;
    if (age !== null) events = events.filter(e => (e.ageMin ?? 0) <= age);

    res.json({ events, total: events.length, cachedAt: new Date().toISOString() });
  } catch (e) {
    console.error("[/events/live]", e);
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /events/instagram — serve stored Instagram-parsed events ──────────────
// NOTE: must be before /events/:id

app.get("/events/instagram", async (req, res) => {
  try {
    const raw = await fs.readFile(IG_STORE, "utf8");
    const store = JSON.parse(raw);
    const age = req.query.age ? Number(req.query.age) : null;
    let events = store.events || [];
    if (age !== null) events = events.filter(e => (e.ageMin ?? 0) <= age);
    res.json({ events, total: events.length, syncedAt: store.syncedAt || null, bioLinks: store.bioLinks || {} });
  } catch {
    res.json({ events: [], total: 0, syncedAt: null, bioLinks: {} });
  }
});

// ─── GET /events/curate — all events (catalogue + IG) with curation status ──────

app.get("/events/curate", async (_req, res) => {
  const s = driver.session();
  try {
    // Neo4j catalogue events
    const result = await s.run(`
      MATCH (e:Event)-[:BY]->(p:Provider), (e)-[:IN_AREA]->(a:Area), (e)-[:FROM_SOURCE]->(src:Source)
      OPTIONAL MATCH (e)-[:HAS_TAG]->(t:Tag)
      RETURN e, p.name AS provider, a.name AS area, src.name AS source, collect(t.name) AS tags
    `);
    const catalogue = result.records.map(r => {
      const e = r.get("e").properties;
      return {
        ...e, id: e.id, provider: r.get("provider"), area: r.get("area"),
        source: r.get("source"), tags: r.get("tags"),
        _curation: e.curationStatus ? {
          status: e.curationStatus, starred: e.curationStarred || false,
          note: e.curationNote || "", fixes: e.curationFixes ? JSON.parse(e.curationFixes) : {}
        } : null
      };
    });

    // IG events from file
    let igEvents = [];
    try {
      const raw = JSON.parse(await fs.readFile(IG_STORE, "utf8"));
      igEvents = (raw.events || []).map(e => ({ ...e, _catalogueType: "instagram" }));
    } catch { /* no file */ }

    res.json({ catalogue, igEvents, total: catalogue.length + igEvents.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// ─── POST /events/curate/:id — save curation for an event ────────────────────

app.post("/events/curate/:id", async (req, res) => {
  const { status, starred, note, fixes } = req.body;
  const id = req.params.id;
  const s = driver.session();
  try {
    // MERGE the event (handles IG events not yet in Neo4j)
    if (req.body._igEvent) {
      const ev = req.body._igEvent;
      await s.run(
        `MERGE (e:Event {id: $id})
         SET e.name = $name, e.source = "Instagram", e.date = $date, e.time = $time,
             e.venue = $venue, e.cost = $cost, e.instagramAccount = $account
         MERGE (src:Source {name: "Instagram"}) MERGE (e)-[:FROM_SOURCE]->(src)`,
        { id, name: ev.name || id, date: ev.date || "", time: ev.time || "",
          venue: ev.venue || "", cost: ev.price || "", account: ev.instagramAccount || "" }
      );
    }
    await s.run(
      `MATCH (e:Event {id: $id})
       SET e.curationStatus = $status,
           e.curationStarred = $starred,
           e.curationNote = $note,
           e.curationFixes = $fixes`,
      { id, status: status || null, starred: starred || false,
        note: note || "", fixes: fixes ? JSON.stringify(fixes) : "{}" }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// ─── POST /events/parse — extract event from Instagram caption / freeform text ─
//
// Body: { text: "...", url?: "https://instagram.com/p/..." }
// Returns a structured event object ready to drop into Weekend Picks.

app.post("/events/parse", async (req, res) => {
  const { text, url } = req.body;
  if (!text || text.trim().length < 10) {
    return res.status(400).json({ error: "text is required (paste the caption or event description)" });
  }
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: "GROQ_API_KEY not set — add it to .env" });
  }
  try {
    const event = await parseEventFromText(text.trim(), url || null);
    res.json({ event });
  } catch (e) {
    console.error("[/events/parse]", e);
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /events/live/refresh — force cache refresh ──────────────────────────

app.post("/events/live/refresh", async (_req, res) => {
  clearCache();
  try {
    const events = await fetchLiveEvents({ force: true });
    res.json({ ok: true, total: events.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /events/:id ──────────────────────────────────────────────────────────

app.get("/events/:id", async (req, res) => {
  const s = driver.session();
  try {
    const result = await s.run(
      `MATCH (e:Event {id: $id})-[:BY]->(p:Provider),
             (e)-[:IN_AREA]->(a:Area),
             (e)-[:FROM_SOURCE]->(src:Source)
       RETURN e, p.name AS provider, a.name AS area, src.name AS source`,
      { id: req.params.id }
    );
    if (!result.records.length) return res.status(404).json({ error: "Not found" });
    const ev = formatEvent(result.records[0]);
    const tagResult = await s.run(
      `MATCH (e:Event {id: $id})-[:HAS_TAG]->(t:Tag) RETURN t.name AS tag`,
      { id: req.params.id }
    );
    ev.tags = tagResult.records.map((r) => r.get("tag"));
    res.json(ev);
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// ─── GET /events/:id/url — resolve the best available deep link ───────────────

app.get("/events/:id/url", async (req, res) => {
  const s = driver.session();
  try {
    const result = await s.run(
      `MATCH (e:Event {id: $id}) RETURN e.scrapedUrl AS scraped, e.url AS fallback, e.name AS name`,
      { id: req.params.id }
    );
    if (!result.records.length) return res.status(404).json({ error: "Not found" });
    const r = result.records[0];
    const url = r.get("scraped") || r.get("fallback");
    res.json({ id: req.params.id, name: r.get("name"), url, isScraped: !!r.get("scraped") });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// ─── POST /events/:id/like ────────────────────────────────────────────────────

app.post("/events/:id/like", async (req, res) => {
  const { userId = "default" } = req.body;
  const s = driver.session();
  try {
    await s.run(
      `MERGE (u:User {id: $userId})
       WITH u MATCH (e:Event {id: $id})
       MERGE (u)-[r:LIKED]->(e)
       SET r.at = datetime()`,
      { userId, id: req.params.id }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// ─── POST /events/:id/dismiss ─────────────────────────────────────────────────

app.post("/events/:id/dismiss", async (req, res) => {
  const { userId = "default" } = req.body;
  const s = driver.session();
  try {
    await s.run(
      `MERGE (u:User {id: $userId})
       WITH u MATCH (e:Event {id: $id})
       MERGE (u)-[r:DISMISSED]->(e)
       SET r.at = datetime()`,
      { userId, id: req.params.id }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// ─── POST /events/:id/register ────────────────────────────────────────────────

app.post("/events/:id/register", async (req, res) => {
  const { userId = "default" } = req.body;
  const s = driver.session();
  try {
    await s.run(
      `MERGE (u:User {id: $userId})
       WITH u MATCH (e:Event {id: $id})
       MERGE (u)-[r:REGISTERED]->(e)
       SET r.at = datetime()`,
      { userId, id: req.params.id }
    );
    // Also like it (registration is the strongest signal)
    await s.run(
      `MERGE (u:User {id: $userId})
       WITH u MATCH (e:Event {id: $id})
       MERGE (u)-[r:LIKED]->(e)
       SET r.at = datetime()`,
      { userId, id: req.params.id }
    );

    // Return the deep link URL for the frontend to open
    const urlResult = await s.run(
      `MATCH (e:Event {id: $id}) RETURN e.scrapedUrl AS scraped, e.url AS fallback`,
      { id: req.params.id }
    );
    const r = urlResult.records[0];
    const url = r?.get("scraped") || r?.get("fallback");
    res.json({ ok: true, url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// ─── GET /schools ─────────────────────────────────────────────────────────────

app.get("/schools", async (_req, res) => {
  const s = driver.session();
  try {
    const result = await s.run(
      `MATCH (s:School)-[:VALUES]->(t:Tag)
       RETURN s.key AS key, s.name AS name, s.subtitle AS subtitle,
              collect(t.name) AS pillars`
    );
    res.json(result.records.map((r) => ({
      key: r.get("key"),
      name: r.get("name"),
      subtitle: r.get("subtitle"),
      pillars: r.get("pillars"),
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// ─── POST /events/instagram/sync — trigger an immediate sync ──────────────────

app.post("/events/instagram/sync", async (_req, res) => {
  if (!process.env.APIFY_TOKEN) {
    return res.status(503).json({ error: "APIFY_TOKEN not set in .env" });
  }
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: "GROQ_API_KEY not set in .env" });
  }
  try {
    const events = await syncInstagramEvents({ force: true });
    res.json({ ok: true, total: events.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /events/instagram/sync-custom — sync user-specified accounts ────────

app.post("/events/instagram/sync-custom", async (req, res) => {
  const { accounts } = req.body || {};
  if (!Array.isArray(accounts) || !accounts.length) {
    return res.status(400).json({ error: "accounts array required" });
  }
  if (!process.env.APIFY_TOKEN) {
    return res.status(503).json({ error: "APIFY_TOKEN not set in .env" });
  }
  // Respond immediately — sync runs in background
  res.json({ ok: true, status: "syncing", accounts });
  syncCustomAccounts(accounts).catch(e =>
    console.error("[sync-custom] failed:", e.message)
  );
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀  Weekend Picks API running on http://localhost:${PORT}`);

  // ── Weekly Instagram sync — every Sunday at 10 PM ──────────────────────────
  // Fetches latest posts from curated accounts, parses with Claude, stores to
  // data/ig-events.json so Monday morning's Weekend Picks is already fresh.
  if (process.env.APIFY_TOKEN && process.env.GROQ_API_KEY) {
    cron.schedule("0 22 * * 0", () => {
      console.log("[cron] Sunday 10 PM — starting Instagram sync…");
      syncInstagramEvents().catch(e => console.error("[cron] Instagram sync failed:", e.message));
    });
    console.log("    Cron: Instagram sync every Sunday at 10 PM");
  } else {
    console.log("    Cron: Instagram sync DISABLED (add APIFY_TOKEN + GROQ_API_KEY to .env)");
  }
  console.log(`    Neo4j: ${process.env.NEO4J_URI || "bolt://localhost:7687"}`);
  console.log(`\n    Endpoints:`);
  console.log(`    GET  /events?age=5&liked=id1,id2&dismissed=id3`);
  console.log(`    GET  /events/:id/url`);
  console.log(`    POST /events/:id/like`);
  console.log(`    POST /events/:id/dismiss`);
  console.log(`    POST /events/:id/register`);
  console.log(`    GET  /schools`);
  console.log(`    GET  /health\n`);
});
