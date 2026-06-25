/**
 * ig-sync.js — weekly cron that:
 * 1. Fetches bio links from each account profile (Apify — details run)
 * 2. Fetches recent posts from each account (Apify — posts run)
 * 3. Parses event captions with Groq/Llama, using bio link as registrationUrl fallback
 * 4. Writes results to data/ig-events.json
 *
 * Requires: APIFY_TOKEN and GROQ_API_KEY in .env
 * Run manually: node ig-sync.js
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { IG_ACCOUNTS } from "./ig-accounts.js";
import { parseEventFromText } from "./parse-event.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, "data", "ig-events.json");
const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = "apify~instagram-scraper";
const POLL_INTERVAL_MS = 5_000;
const POLL_MAX_ATTEMPTS = 60; // 5 minutes max (more posts = longer run)

// ── Apify: run actor + poll ────────────────────────────────────────────────────

async function runActor(input) {
  const startResp = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }
  );
  if (!startResp.ok) {
    const txt = await startResp.text();
    throw new Error(`Apify start failed ${startResp.status}: ${txt}`);
  }
  const { data: run } = await startResp.json();
  console.log(`[ig-sync] Apify run started: ${run.id} (${input.resultsType})`);

  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await sleep(POLL_INTERVAL_MS);
    const statusResp = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}?token=${APIFY_TOKEN}`);
    const { data: status } = await statusResp.json();
    if (i % 6 === 0) console.log(`[ig-sync]   status: ${status.status} (${Math.round((i+1)*POLL_INTERVAL_MS/1000)}s)`);
    if (status.status === "SUCCEEDED") return status.defaultDatasetId;
    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(status.status)) throw new Error(`Apify run ${status.status}`);
  }
  throw new Error("Apify run timed out");
}

async function fetchDataset(datasetId) {
  const resp = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&clean=true&limit=500`
  );
  if (!resp.ok) throw new Error(`Dataset fetch failed: ${resp.status}`);
  return resp.json();
}

// ── Step 1: Fetch bio links from profiles ────────────────────────────────────

async function fetchBioLinks(usernames) {
  console.log(`[ig-sync] Fetching bio links for ${usernames.length} accounts…`);
  try {
    const datasetId = await runActor({
      directUrls: usernames.map(u => `https://www.instagram.com/${u}/`),
      resultsType: "details",
      resultsLimit: 1,
    });
    const profiles = await fetchDataset(datasetId);
    const bioLinks = {};
    for (const p of profiles) {
      const u = p.username || p.ownerUsername;
      const link = p.externalUrl || p.bioLink || p.external_url || null;
      if (u && link) {
        bioLinks[u] = link;
        console.log(`[ig-sync]   @${u} bio → ${link}`);
      }
    }
    console.log(`[ig-sync] Got ${Object.keys(bioLinks).length} bio links`);
    return bioLinks;
  } catch (e) {
    console.warn(`[ig-sync] Bio link fetch failed (non-fatal): ${e.message}`);
    return {};
  }
}

// ── Step 2: Fetch posts ───────────────────────────────────────────────────────

async function fetchPosts(usernames, maxPerAccount) {
  console.log(`[ig-sync] Fetching posts (up to ${maxPerAccount}/account)…`);
  const datasetId = await runActor({
    directUrls: usernames.map(u => `https://www.instagram.com/${u}/`),
    resultsType: "posts",
    resultsLimit: maxPerAccount,
    addParentData: false,
  });
  const posts = await fetchDataset(datasetId);
  console.log(`[ig-sync] Fetched ${posts.length} posts total`);
  return posts;
}

// ── Step 3: Parse posts → events ─────────────────────────────────────────────

async function extractEvents(posts, accountMap, bioLinks) {
  // Group by account, apply per-account limit
  const byAccount = {};
  for (const post of posts) {
    const u = post.ownerUsername;
    if (!byAccount[u]) byAccount[u] = [];
    const limit = accountMap[u]?.postsToFetch ?? 5;
    if (byAccount[u].length < limit) byAccount[u].push(post);
  }

  const allEvents = [];

  for (const [username, accountPosts] of Object.entries(byAccount)) {
    const label = accountMap[username]?.label || username;
    const bioLink = bioLinks[username] || null;
    console.log(`[ig-sync] @${username} — ${accountPosts.length} posts, bio: ${bioLink || "none"}`);

    for (const post of accountPosts) {
      const caption = post.caption || post.alt || "";
      if (caption.length < 30) continue;

      // Skip non-event posts
      const looksLikeEvent = /registr|workshop|event|join us|this (sat|sun|weekend|week)|₹|\d{1,2}:\d{2}|book now|limited seat|session|class|tour|walk|show|concert|performance|tickets|entry|\bpm\b|\bam\b|link in bio/i.test(caption);
      if (!looksLikeEvent) continue;

      // Skip retrospective posts
      const looksLikePast = /thank you for (coming|joining|attending)|last (weekend|saturday|sunday|week|night)|what a (night|evening|day|show)|recap|highlights from|yesterday's/i.test(caption);
      if (looksLikePast) continue;

      const igUrl = post.url || (post.shortCode ? `https://www.instagram.com/p/${post.shortCode}/` : null);

      try {
        const event = await parseEventFromText(caption, igUrl);
        if (!event || !event.name) continue;

        event.provider = event.provider || label;
        event.instagramAccount = username;

        // Use bio link as registrationUrl if caption mentions "link in bio" and no URL was extracted
        const mentionsBioLink = /link in bio|linkinbio|link in our bio/i.test(caption);
        if (!event.registrationUrl && (mentionsBioLink || !igUrl) && bioLink) {
          event.registrationUrl = bioLink;
        }

        allEvents.push(event);
      } catch (e) {
        console.warn(`[ig-sync] Parse error for @${username}: ${e.message}`);
      }

      await sleep(800); // stay well under Groq's token-per-minute limit
    }
  }

  // Deduplicate within this batch: keep first occurrence of each name+date
  const seen = new Set();
  return allEvents.filter(e => {
    const key = `${e.name.toLowerCase().trim()}|${e.date || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Main sync ─────────────────────────────────────────────────────────────────

export async function syncInstagramEvents({ force = false } = {}) {
  if (!APIFY_TOKEN) throw new Error("APIFY_TOKEN not set in .env");
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY not set in .env");

  console.log(`\n[ig-sync] ═══ Starting sync for ${IG_ACCOUNTS.length} accounts ═══`);

  const usernames = IG_ACCOUNTS.map(a => a.username);
  const accountMap = Object.fromEntries(IG_ACCOUNTS.map(a => [a.username, a]));
  const maxPerAccount = Math.max(...IG_ACCOUNTS.map(a => a.postsToFetch));

  // Run bio + posts fetches in parallel (independent Apify runs)
  const [bioLinks, posts] = await Promise.all([
    fetchBioLinks(usernames),
    fetchPosts(usernames, maxPerAccount),
  ]);

  const allEvents = await extractEvents(posts, accountMap, bioLinks);
  console.log(`[ig-sync] Extracted ${allEvents.length} events from posts`);

  // Load existing store
  let stored = [];
  try {
    const raw = JSON.parse(await fs.readFile(STORE_PATH, "utf8"));
    stored = Array.isArray(raw) ? raw : (raw.events || []);
  } catch { /* first run */ }

  const today = new Date().toISOString().slice(0, 10);

  function isFuture(e) {
    const d = e.date;
    if (!d) return true;
    if (/^(sat|sun|mon|tue|wed|thu|fri)$/.test(d)) return true;
    return d >= today;
  }

  // Merge: new events win; keep stored future events not duplicated by name+date
  const newKeys = new Set(allEvents.map(e => `${e.name}|${e.date}`));
  const kept = stored.filter(e => isFuture(e) && !newKeys.has(`${e.name}|${e.date}`));
  const fresh = [...allEvents, ...kept]
    .filter(isFuture)
    .sort((a, b) => {
      const da = a.date?.match(/^\d{4}/) ? a.date : "9999";
      const db = b.date?.match(/^\d{4}/) ? b.date : "9999";
      return da.localeCompare(db);
    });

  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify({
    syncedAt: new Date().toISOString(),
    bioLinks,
    events: fresh,
  }, null, 2));

  console.log(`[ig-sync] ═══ Done: ${fresh.length} events stored ═══\n`);
  return fresh;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Custom account sync (user-specified accounts) ─────────────────────────────

export async function syncCustomAccounts(usernames) {
  if (!APIFY_TOKEN) throw new Error("APIFY_TOKEN not set");
  const cleaned = usernames.map(u => u.replace(/^@/, "").trim()).filter(Boolean);
  if (!cleaned.length) return [];

  console.log(`\n[ig-sync] ═══ Custom sync for: ${cleaned.join(", ")} ═══`);

  const accountMap = Object.fromEntries(
    cleaned.map(u => [u, { username: u, label: u, postsToFetch: 5 }])
  );

  const [bioLinks, posts] = await Promise.all([
    fetchBioLinks(cleaned),
    fetchPosts(cleaned, 5),
  ]);

  const newEvents = await extractEvents(posts, accountMap, bioLinks);
  newEvents.forEach(e => { e.customAccount = true; });
  console.log(`[ig-sync] Custom sync extracted ${newEvents.length} events`);

  // Merge into store
  let stored = [];
  let storedBioLinks = {};
  try {
    const raw = JSON.parse(await fs.readFile(STORE_PATH, "utf8"));
    stored = Array.isArray(raw) ? raw : (raw.events || []);
    storedBioLinks = Array.isArray(raw) ? {} : (raw.bioLinks || {});
  } catch { /* first run */ }

  const today = new Date().toISOString().slice(0, 10);
  const isFuture = (e) => {
    const d = e.date;
    if (!d) return true;
    if (/^(sat|sun|mon|tue|wed|thu|fri)$/.test(d)) return true;
    return d >= today;
  };

  const newKeys = new Set(newEvents.map(e => `${e.name}|${e.date}`));
  const kept = stored.filter(e => isFuture(e) && !newKeys.has(`${e.name}|${e.date}`));
  const fresh = [...newEvents, ...kept].filter(isFuture).sort((a, b) => {
    const da = a.date?.match(/^\d{4}/) ? a.date : "9999";
    const db = b.date?.match(/^\d{4}/) ? b.date : "9999";
    return da.localeCompare(db);
  });

  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify({
    syncedAt: new Date().toISOString(),
    bioLinks: { ...storedBioLinks, ...bioLinks },
    events: fresh,
  }, null, 2));

  console.log(`[ig-sync] ═══ Custom sync done: ${fresh.length} events stored ═══\n`);
  return newEvents;
}

// ── Run directly: node ig-sync.js ─────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const env = await fs.readFile(path.join(__dirname, ".env"), "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^([^#=]+)=(.+)$/);
      if (m) process.env[m[1].trim()] = m[2].trim();
    }
  } catch { /* no .env */ }

  syncInstagramEvents({ force: true })
    .then(events => { console.log(`Done: ${events.length} events → data/ig-events.json`); process.exit(0); })
    .catch(e => { console.error("Sync failed:", e); process.exit(1); });
}
