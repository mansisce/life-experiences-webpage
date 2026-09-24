/**
 * Seed script — loads schools, pedagogy tags, and events into Neo4j.
 * Run: node seed.js
 *
 * Graph model:
 *   (School)-[:VALUES]->(Tag)
 *   (Event)-[:HAS_TAG]->(Tag)
 *   (Event)-[:BY]->(Provider)
 *   (Event)-[:IN_AREA]->(Area)
 *   (Event)-[:FROM_SOURCE]->(Source)
 */

import neo4j from "neo4j-driver";

const NEO4J_URI = process.env.NEO4J_URI || "bolt://localhost:7687";
const NEO4J_USER = process.env.NEO4J_USER || "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "littlehuman123";

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
const session = driver.session();

// ─── Schools + their pedagogy pillars ──────────────────────────────────────────
const SCHOOLS = [
  {
    key: "montessori",
    name: "Anweshana Montessori",
    subtitle: "HBR Layout, Bangalore",
    pillars: [
      "hands-on", "self-directed", "practical-life", "sensorial", "nature-connection",
      "real-tools", "mixed-age", "independence", "no-competition", "intrinsic-motivation",
      "self-discipline", "eco-friendly", "joyful-learning", "freedom-with-responsibility",
      "prepared-environment", "self-formation",
    ],
  },
  {
    key: "cfl",
    name: "Centre for Learning",
    subtitle: "Whitefield, Bangalore",
    pillars: [
      "inquiry", "silence", "nature-connection", "self-knowledge", "dialogue",
      "no-competition", "inner-life", "open-ended", "ecological", "attention",
      "freedom-with-responsibility", "relationship", "choiceless-awareness",
    ],
  },
  {
    key: "jk",
    name: "JK Krishnamurti Schools",
    subtitle: "Valley School / The School KFI",
    pillars: [
      "inner-transformation", "freedom-from-authority", "holistic-human", "sensitivity",
      "self-knowledge", "no-competition", "no-comparison", "nature-connection", "ecological",
      "community", "questioning-mind", "choiceless-awareness", "silence", "goodness-ethics",
      "relationship", "intelligence-awakening", "inquiry", "open-ended",
    ],
  },
];

// ─── Event catalogue ───────────────────────────────────────────────────────────
const EVENTS = [
  // Urbanaut
  {
    id: "pottery-coro", name: "Golden Bridge Pottery",
    provider: "Coro", venue: "Indiranagar, Bangalore", area: "Creative & Making",
    free: false, cost: "₹1,200", source: "Urbanaut",
    url: "https://urbanaut.app/spot/coro-commons",
    scrapedUrl: null, date: "This weekend", ageMin: 4,
    tags: ["hands-on","sensorial","practical-life","real-tools","self-directed","self-discipline","intrinsic-motivation","prepared-environment"],
    builds: ["Fine motor","Patience","Making something real"],
  },
  {
    id: "map-trail", name: "Interactive Museum Trail for Kids",
    provider: "MAP — Museum of Art & Photography", venue: "Kasturba Road, Bangalore", area: "Story & Culture",
    free: true, cost: "Free", source: "Urbanaut",
    url: "https://urbanaut.app/spot/museum-of-art-photography-map",
    scrapedUrl: null, date: "This weekend", ageMin: 5,
    tags: ["inquiry","open-ended","heritage","dialogue","self-directed","ecological","questioning-mind","intelligence-awakening"],
    builds: ["Observation","Cultural identity","Asking questions"],
  },
  {
    id: "coro-afternoon", name: "Coro Afternoon Clubs",
    provider: "Coro", venue: "Indiranagar, Bangalore", area: "Play & Social",
    free: false, cost: "₹2,999", source: "Urbanaut",
    url: "https://urbanaut.app/spot/coro-commons",
    scrapedUrl: null, date: "Every weekend", ageMin: 4,
    tags: ["hands-on","inquiry","open-ended","self-directed","mixed-age","joyful-learning","intrinsic-motivation","freedom-with-responsibility"],
    builds: ["Peer interaction","Curiosity","Learning alongside others"],
  },
  {
    id: "atta-galatta-story", name: "Storytelling & Puppet Show",
    provider: "Atta Galatta", venue: "Koramangala, Bangalore", area: "Story & Culture",
    free: true, cost: "Free", source: "Urbanaut",
    url: "https://urbanaut.app/spot/atta-galatta",
    scrapedUrl: null, date: "This weekend", ageMin: 3,
    tags: ["dialogue","inner-life","open-ended","relationship","sensitivity","holistic-human","inner-transformation"],
    builds: ["Language","Empathy","Emotional vocabulary"],
  },
  {
    id: "atta-galatta-bookclub", name: "Atta Galatta Kids Book Club",
    provider: "Atta Galatta", venue: "Koramangala, Bangalore", area: "Story & Culture",
    free: true, cost: "Free", source: "Urbanaut",
    url: "https://urbanaut.app/spot/atta-galatta-book-club",
    scrapedUrl: null, date: "This weekend", ageMin: 5,
    tags: ["dialogue","inner-life","self-knowledge","open-ended","no-competition","inquiry","questioning-mind"],
    builds: ["Love of reading","Critical thinking","Shared inquiry"],
  },
  {
    id: "bcc-workshop", name: "Sustainability & Craft Workshop",
    provider: "Bangalore Creative Circus", venue: "Domlur, Bangalore", area: "Creative & Making",
    free: true, cost: "Free", source: "Urbanaut",
    url: "https://urbanaut.app/spot/bangalore-creative-circus-3207",
    scrapedUrl: null, date: "This weekend", ageMin: 3,
    tags: ["ecological","hands-on","real-tools","eco-friendly","community","goodness-ethics","joyful-learning","self-formation"],
    builds: ["Sustainability thinking","Creative voice","Making"],
  },
  {
    id: "nature-trail", name: "Urban Nature Trail & Birdwatching",
    provider: "Urbanaut Curated", venue: "Cubbon Park, Bangalore", area: "Nature & Outdoor",
    free: true, cost: "Free", source: "Urbanaut",
    url: "https://urbanaut.app/featured-events/things-to-do-in-bengaluru",
    scrapedUrl: null, date: "This weekend", ageMin: 3,
    tags: ["nature-connection","silence","ecological","inquiry","self-directed","inner-life","open-ended","no-competition","choiceless-awareness","sensitivity"],
    builds: ["Attention","Stillness","Ecological awareness"],
  },
  {
    id: "story-walk-indiranagar", name: "A Story Walk through Indiranagar",
    provider: "Urbanaut Curated", venue: "Indiranagar, Bangalore", area: "Story & Culture",
    free: true, cost: "Free", source: "Urbanaut",
    url: "https://urbanaut.app/spot/a-story-walk-through-indiranagar-bangalore",
    scrapedUrl: null, date: "This weekend", ageMin: 4,
    tags: ["heritage","nature-connection","inquiry","dialogue","open-ended","ecological","community","relationship"],
    builds: ["Narrative sense","Neighbourhood belonging","Observation"],
  },
  {
    id: "looroo-play", name: "Theme-Based Playdate",
    provider: "The Looroo Club", venue: "HSR Layout, Bangalore", area: "Play & Social",
    free: false, cost: "₹800", source: "Urbanaut",
    url: "https://urbanaut.app/spot/kids-playdate-with-the-looroo-club-april-2025",
    scrapedUrl: null, date: "This weekend", ageMin: 2,
    tags: ["mixed-age","joyful-learning","relationship","sensory","freedom-with-responsibility","holistic-human"],
    builds: ["Role-play","Social skills","Imagination"],
  },
  {
    id: "papagoya-play", name: "Nature-Led Play Morning",
    provider: "Papagoya Education", venue: "Whitefield, Bangalore", area: "Nature & Outdoor",
    free: false, cost: "₹600", source: "Urbanaut",
    url: "https://urbanaut.app/featured-events/family-events-bangalore",
    scrapedUrl: null, date: "This weekend", ageMin: 2,
    tags: ["nature-connection","independence","practical-life","sensorial","ecological","no-competition","self-directed","self-formation"],
    builds: ["Independence","Outdoor comfort","Experiential learning"],
  },
  {
    id: "heritage-walk", name: "Bangalore Heritage Walk",
    provider: "Urbanaut Curated", venue: "Pete area, Old Bangalore", area: "Nature & Outdoor",
    free: true, cost: "Free", source: "Urbanaut",
    url: "https://urbanaut.app/featured-events/things-to-do-in-bengaluru",
    scrapedUrl: null, date: "This weekend", ageMin: 6,
    tags: ["heritage","inquiry","dialogue","open-ended","ecological","self-knowledge","community","questioning-mind"],
    builds: ["History","Place-attachment","Observation"],
  },
  {
    id: "farmers-market", name: "Organic Farmers Market with Kids Corner",
    provider: "Bangalore Creative Circus", venue: "Domlur, Bangalore", area: "Nature & Outdoor",
    free: true, cost: "Free", source: "Urbanaut",
    url: "https://urbanaut.app/spot/bangalore-creative-circus-3207",
    scrapedUrl: null, date: "This weekend", ageMin: 2,
    tags: ["eco-friendly","ecological","practical-life","sensory","real-tools","community","nature-connection","self-formation"],
    builds: ["Where food comes from","Sustainability","Sensory"],
  },
  {
    id: "warli-art", name: "Warli Tribal Art Workshop",
    provider: "The Localway", venue: "Various, Bangalore", area: "Story & Culture",
    free: false, cost: "₹900", source: "Urbanaut",
    url: "https://urbanaut.app/featured-events/things-to-do-in-bengaluru",
    scrapedUrl: null, date: "This weekend", ageMin: 6,
    tags: ["heritage","hands-on","ecological","community","sensitivity","goodness-ethics","relationship"],
    builds: ["Indigenous art","Cultural respect","Heritage"],
  },
  {
    id: "music-morning", name: "Family Music Morning",
    provider: "Urbanaut Events", venue: "Various cafes, Bangalore", area: "Music & Movement",
    free: true, cost: "Free", source: "Urbanaut",
    url: "https://urbanaut.app/featured-events/things-to-do-in-bengaluru",
    scrapedUrl: null, date: "This weekend", ageMin: 2,
    tags: ["sensitivity","inner-life","holistic-human","joyful-learning","relationship","inner-transformation"],
    builds: ["Listening","Rhythm","Aesthetic sense"],
  },
  // BookMyShow
  {
    id: "bms-ranga-shankara", name: "Children's Theatre Weekend",
    provider: "Ranga Shankara", venue: "JP Nagar 5th Phase, Bangalore", area: "Music & Movement",
    free: false, cost: "₹200–₹500", source: "BookMyShow",
    url: "https://in.bookmyshow.com/bengaluru/plays",
    scrapedUrl: null, date: "This weekend", ageMin: 4,
    tags: ["dialogue","inner-life","holistic-human","sensitivity","relationship","inner-transformation","community","goodness-ethics"],
    builds: ["Empathy","Emotional depth","Narrative imagination"],
  },
  {
    id: "bms-map-art", name: "Kids Art Workshop at MAP",
    provider: "MAP — Museum of Art & Photography", venue: "Kasturba Road, Bangalore", area: "Creative & Making",
    free: false, cost: "₹400–₹700", source: "BookMyShow",
    url: "https://in.bookmyshow.com/bengaluru/activities",
    scrapedUrl: null, date: "This weekend", ageMin: 5,
    tags: ["hands-on","inquiry","heritage","self-directed","sensitivity","intelligence-awakening","joyful-learning"],
    builds: ["Visual literacy","Indian art history","Creative expression"],
  },
  {
    id: "bms-dance-attakkalari", name: "Movement & Dance for Kids",
    provider: "Attakkalari Centre", venue: "Millers Road, Bangalore", area: "Music & Movement",
    free: false, cost: "₹500", source: "BookMyShow",
    url: "https://in.bookmyshow.com/bengaluru/activities",
    scrapedUrl: null, date: "This weekend", ageMin: 4,
    tags: ["holistic-human","sensitivity","self-knowledge","inner-transformation","freedom-with-responsibility","choiceless-awareness","joyful-learning"],
    builds: ["Body awareness","Rhythm","Expressive freedom"],
  },
  {
    id: "bms-science-ncbs", name: "Science Open Day for Families",
    provider: "NCBS / IndiaBioscience", venue: "Hebbal, Bangalore", area: "Creative & Making",
    free: true, cost: "Free", source: "BookMyShow",
    url: "https://in.bookmyshow.com/bengaluru/activities",
    scrapedUrl: null, date: "This weekend", ageMin: 6,
    tags: ["inquiry","questioning-mind","intelligence-awakening","open-ended","self-directed","ecological","hands-on"],
    builds: ["Scientific curiosity","Observation","Wonder"],
  },
  {
    id: "bms-pottery", name: "Clay & Pottery Workshop for Kids",
    provider: "Various studios", venue: "Indiranagar / Koramangala", area: "Creative & Making",
    free: false, cost: "₹600–₹900", source: "BookMyShow",
    url: "https://in.bookmyshow.com/bengaluru/activities",
    scrapedUrl: null, date: "This weekend", ageMin: 4,
    tags: ["hands-on","sensorial","practical-life","real-tools","self-discipline","intrinsic-motivation","self-formation","prepared-environment"],
    builds: ["Fine motor","Focus","Relationship with materials"],
  },
  {
    id: "bms-nature-photo", name: "Kids Nature Photography Walk",
    provider: "Various", venue: "Lalbagh / Cubbon Park, Bangalore", area: "Nature & Outdoor",
    free: false, cost: "₹350", source: "BookMyShow",
    url: "https://in.bookmyshow.com/bengaluru/activities",
    scrapedUrl: null, date: "This weekend", ageMin: 7,
    tags: ["nature-connection","silence","choiceless-awareness","ecological","sensitivity","self-knowledge","inquiry"],
    builds: ["Attention","Observation","Love of nature"],
  },
  {
    id: "bms-music-concert", name: "Family Classical Music Concert",
    provider: "Chowdiah Memorial Hall", venue: "Vyalikaval, Bangalore", area: "Music & Movement",
    free: false, cost: "₹100–₹300", source: "BookMyShow",
    url: "https://in.bookmyshow.com/bengaluru/plays",
    scrapedUrl: null, date: "This weekend", ageMin: 5,
    tags: ["sensitivity","inner-life","silence","holistic-human","joyful-learning","inner-transformation","relationship"],
    builds: ["Listening depth","Aesthetic sense","Cultural grounding"],
  },
  {
    id: "bms-storytelling", name: "Interactive Storytelling Session",
    provider: "Bangalore Storytelling Society", venue: "Various venues, Bangalore", area: "Story & Culture",
    free: true, cost: "Free", source: "BookMyShow",
    url: "https://in.bookmyshow.com/bengaluru/activities",
    scrapedUrl: null, date: "This weekend", ageMin: 3,
    tags: ["dialogue","inner-life","relationship","open-ended","community","sensitivity","self-knowledge"],
    builds: ["Language","Imagination","Listening"],
  },
];

// ─── Seed ───────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱  Seeding Neo4j…");

  // Constraints
  await session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE");
  await session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (s:School) REQUIRE s.key IS UNIQUE");
  await session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (t:Tag) REQUIRE t.name IS UNIQUE");
  await session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (p:Provider) REQUIRE p.name IS UNIQUE");
  await session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (a:Area) REQUIRE a.name IS UNIQUE");
  await session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (src:Source) REQUIRE src.name IS UNIQUE");

  // Schools + their Tags
  for (const school of SCHOOLS) {
    await session.run(
      `MERGE (s:School {key: $key})
       SET s.name = $name, s.subtitle = $subtitle`,
      { key: school.key, name: school.name, subtitle: school.subtitle }
    );
    for (const pillar of school.pillars) {
      await session.run(
        `MERGE (t:Tag {name: $name})
         WITH t
         MATCH (s:School {key: $key})
         MERGE (s)-[:VALUES]->(t)`,
        { name: pillar, key: school.key }
      );
    }
    console.log(`  ✓ School: ${school.name} (${school.pillars.length} pillars)`);
  }

  // Events
  for (const ev of EVENTS) {
    await session.run(
      `MERGE (e:Event {id: $id})
       SET e.name = $name, e.venue = $venue, e.free = $free,
           e.cost = $cost, e.date = $date, e.ageMin = $ageMin,
           e.url = $url, e.scrapedUrl = $scrapedUrl`,
      { id: ev.id, name: ev.name, venue: ev.venue, free: ev.free,
        cost: ev.cost, date: ev.date, ageMin: ev.ageMin,
        url: ev.url, scrapedUrl: ev.scrapedUrl }
    );

    // Provider
    await session.run(
      `MERGE (p:Provider {name: $name})
       WITH p MATCH (e:Event {id: $id}) MERGE (e)-[:BY]->(p)`,
      { name: ev.provider, id: ev.id }
    );

    // Area
    await session.run(
      `MERGE (a:Area {name: $name})
       WITH a MATCH (e:Event {id: $id}) MERGE (e)-[:IN_AREA]->(a)`,
      { name: ev.area, id: ev.id }
    );

    // Source
    await session.run(
      `MERGE (src:Source {name: $name})
       WITH src MATCH (e:Event {id: $id}) MERGE (e)-[:FROM_SOURCE]->(src)`,
      { name: ev.source, id: ev.id }
    );

    // Tags
    for (const tag of ev.tags) {
      await session.run(
        `MERGE (t:Tag {name: $tag})
         WITH t MATCH (e:Event {id: $id}) MERGE (e)-[:HAS_TAG]->(t)`,
        { tag, id: ev.id }
      );
    }

    // Builds (as array property)
    await session.run(
      `MATCH (e:Event {id: $id}) SET e.builds = $builds`,
      { id: ev.id, builds: ev.builds }
    );

    console.log(`  ✓ Event: ${ev.name} [${ev.source}]`);
  }

  console.log(`\n✅  Seeded ${SCHOOLS.length} schools, ${EVENTS.length} events into Neo4j`);
  console.log("   Open Neo4j Browser: http://localhost:7474");
  console.log("   Run: MATCH (e:Event)-[:HAS_TAG]->(t:Tag)<-[:VALUES]-(s:School) RETURN e,t,s LIMIT 50");
}

seed().catch(console.error).finally(() => { session.close(); driver.close(); });
