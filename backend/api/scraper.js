/**
 * Scraper — finds real event deep-link URLs from Urbanaut and BookMyShow,
 * then writes them back into Neo4j as e.scrapedUrl on each Event node.
 *
 * Run: node scraper.js
 * Run with browser visible: node scraper.js --headed
 */

import { chromium } from "playwright";
import neo4j from "neo4j-driver";

const HEADED = process.argv.includes("--headed");
const NEO4J_URI = process.env.NEO4J_URI || "bolt://localhost:7687";
const NEO4J_USER = process.env.NEO4J_USER || "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "littlehuman123";

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
const session = driver.session();

// Known Urbanaut spot slugs — confirmed real pages
const URBANAUT_KNOWN = {
  "pottery-coro":           "https://urbanaut.app/spot/coro-commons",
  "coro-afternoon":         "https://urbanaut.app/spot/coro-commons",
  "map-trail":              "https://urbanaut.app/spot/museum-of-art-photography-map",
  "map-artcamp":            "https://urbanaut.app/spot/museum-of-art-photography-map",
  "atta-galatta-story":     "https://urbanaut.app/spot/atta-galatta",
  "atta-galatta-bookclub":  "https://urbanaut.app/spot/atta-galatta-book-club",
  "bcc-workshop":           "https://urbanaut.app/spot/bangalore-creative-circus-3207",
  "farmers-market":         "https://urbanaut.app/spot/bangalore-creative-circus-3207",
  "looroo-play":            "https://urbanaut.app/spot/kids-playdate-with-the-looroo-club-april-2025",
  "story-walk-indiranagar": "https://urbanaut.app/spot/a-story-walk-through-indiranagar-bangalore",
};

// ─── Scrape Urbanaut listing pages for event deep links ───────────────────────

async function scrapeUrbanaut(page) {
  console.log("\n🔍  Scraping Urbanaut for event deep links…");
  const found = { ...URBANAUT_KNOWN }; // start with known slugs

  const pages = [
    "https://urbanaut.app/featured-events/family-events-bangalore",
    "https://urbanaut.app/featured-forkids/summer-activities",
    "https://urbanaut.app/experience-bengaluru/things-to-do",
    "https://urbanaut.app/featured-events/things-to-do-in-bengaluru",
  ];

  for (const url of pages) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(2500);

      // Extract all /spot/ and /event/ links
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll("a[href]"))
          .map((a) => ({ href: a.href, text: a.innerText?.trim() }))
          .filter((l) => l.href.includes("/spot/") || l.href.includes("/event/"))
      );

      for (const { href, text } of links) {
        if (!text) continue;
        const slug = href.split("/").pop();
        found[slug] = href;
      }
      console.log(`  ✓ ${url} → ${links.length} links`);
    } catch (e) {
      console.log(`  ⚠ ${url} → ${e.message.slice(0, 60)}`);
    }
  }

  return found;
}

// ─── Scrape BookMyShow search results for event deep links ────────────────────

// BMS event-specific search: visit the search URL for each event, grab the first real event link
const BMS_EVENT_SEARCHES = [
  { id: "bms-ranga-shankara",    url: "https://in.bookmyshow.com/search?q=ranga+shankara" },
  { id: "bms-map-art",           url: "https://in.bookmyshow.com/search?q=MAP+museum+art+workshop+bangalore" },
  { id: "bms-dance-attakkalari", url: "https://in.bookmyshow.com/search?q=attakkalari+dance" },
  { id: "bms-science-ncbs",      url: "https://in.bookmyshow.com/search?q=NCBS+science+bangalore" },
  { id: "bms-pottery-craft",     url: "https://in.bookmyshow.com/search?q=pottery+workshop+kids+bangalore" },
  { id: "bms-nature-photography",url: "https://in.bookmyshow.com/search?q=nature+photography+kids+bangalore" },
  { id: "bms-music-concert",     url: "https://in.bookmyshow.com/search?q=chowdiah+concert" },
  { id: "bms-storytelling",      url: "https://in.bookmyshow.com/search?q=storytelling+bangalore" },
];

async function scrapeBookMyShow(page) {
  console.log("\n🔍  Scraping BookMyShow — searching each event by name…");
  const found = {}; // id → deep link URL

  for (const { id, url } of BMS_EVENT_SEARCHES) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
      await page.waitForTimeout(3000); // BMS is JS-heavy

      // Extract links that look like BMS event detail pages (contain /bengaluru/ or /activities/ or /plays/ + slug with ET code)
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll("a[href]"))
          .map((a) => a.href)
          .filter((h) =>
            h.includes("bookmyshow.com") &&
            // Real event pages have patterns like /bengaluru/plays/NAME-ET00XXXXXX or /activities/NAME-ETXXXXXXXXXX
            (/\/ET\d{8,}/i.test(h) || /\-ET[0-9A-Z]{8,}/i.test(h) || h.includes("/bengaluru/") || h.includes("/activities/") || h.includes("/plays/"))
          )
      );

      // Prefer links with ET event codes (specific events), fall back to category
      const etLink = links.find((h) => /ET\d{6,}/i.test(h) || /ET[0-9A-Z]{6,}/i.test(h));
      const bestLink = etLink || links.find((h) => h.length > 50) || null;

      if (bestLink) {
        found[id] = bestLink;
        console.log(`  ✓ ${id} → ${bestLink}`);
      } else {
        console.log(`  ⚠ ${id} → no event link found on search page`);
      }
    } catch (e) {
      console.log(`  ⚠ ${id} → ${e.message.slice(0, 70)}`);
    }
  }

  return found;
}

// ─── Match scraped URLs back to Event nodes ───────────────────────────────────

async function matchAndWrite(urbanautLinks, bmsLinks) {
  console.log("\n💾  Matching scraped URLs to Event nodes…");

  // Load all events from Neo4j
  const result = await session.run("MATCH (e:Event) RETURN e.id AS id, e.name AS name, e.source AS source, e.url AS url");
  const events = result.records.map((r) => ({
    id: r.get("id"),
    name: r.get("name"),
    source: r.get("source"),
    url: r.get("url"),
  }));

  let updated = 0;

  for (const ev of events) {
    let scrapedUrl = null;

    if (ev.source === "Urbanaut") {
      // 1. Direct id match
      if (urbanautLinks[ev.id]) {
        scrapedUrl = urbanautLinks[ev.id];
      } else {
        // 2. Fuzzy match by event name against scraped link texts
        const evWords = ev.name.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
        const best = Object.entries(urbanautLinks).find(([slug]) =>
          evWords.some((w) => slug.includes(w))
        );
        if (best) scrapedUrl = best[1];
      }
    } else if (ev.source === "BookMyShow") {
      // Direct id match — bmsLinks is now keyed by event id
      scrapedUrl = bmsLinks[ev.id] || ev.url;
    }

    // Write back
    await session.run(
      "MATCH (e:Event {id: $id}) SET e.scrapedUrl = $url",
      { id: ev.id, url: scrapedUrl || ev.url }
    );

    const label = scrapedUrl && scrapedUrl !== ev.url ? "✓ deep link" : "→ fallback";
    console.log(`  ${label}: ${ev.name}`);
    if (scrapedUrl && scrapedUrl !== ev.url) updated++;
  }

  console.log(`\n✅  Updated ${updated}/${events.length} events with scraped deep links`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🕷️   Weekend Registrar — URL Scraper");
  console.log(`    Mode: ${HEADED ? "Headed" : "Headless"}\n`);

  const browser = await chromium.launch({
    headless: !HEADED,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    const urbanautLinks = await scrapeUrbanaut(page);
    const bmsLinks = await scrapeBookMyShow(page);
    await matchAndWrite(urbanautLinks, bmsLinks);
  } finally {
    await browser.close();
    session.close();
    driver.close();
  }
}

main().catch(console.error);
