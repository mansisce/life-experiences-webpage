import { useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { API_BASE, apiCall } from "../utils/weekendPicksApi";

// ─── Weekend Picks — Recommendation Engine ─────────────────────────────────────

// Pedagogy pillars per school — events are scored by overlap with these tags
const SCHOOL_PILLARS = {
  // Anweshana Montessori: head-heart-hands, self-formation, intrinsic motivation
  montessori: [
    "hands-on", "self-directed", "practical-life", "sensorial", "nature-connection",
    "real-tools", "mixed-age", "independence", "no-competition", "intrinsic-motivation",
    "self-discipline", "eco-friendly", "joyful-learning", "freedom-with-responsibility",
    "prepared-environment", "self-formation",
  ],
  // Centre for Learning (CFL): Krishnamurti-rooted, inquiry, silence, relationship
  cfl: [
    "inquiry", "silence", "nature-connection", "self-knowledge", "dialogue",
    "no-competition", "inner-life", "open-ended", "ecological", "attention",
    "freedom-with-responsibility", "relationship", "choiceless-awareness",
  ],
  // JK Krishnamurti schools (Valley School, The School KFI): inner transformation, holistic human
  jk: [
    "inner-transformation", "freedom-from-authority", "holistic-human", "sensitivity",
    "self-knowledge", "no-competition", "no-comparison", "nature-connection", "ecological",
    "community", "questioning-mind", "choiceless-awareness", "silence", "goodness-ethics",
    "relationship", "intelligence-awakening", "inquiry", "open-ended",
  ],
  // Creative School & Valley School overlap pillars
  valley: ["arts", "ecological", "nature-connection", "mixed-age", "dialogue", "music", "pottery", "heritage", "self-directed"],
  creative: ["whole-child", "emotional", "spiritual", "creative-freedom", "small-group", "eco-friendly", "sensory", "expressive", "story"],
};

// The 3 schools we score against simultaneously
const ACTIVE_SCHOOLS = ["montessori", "cfl", "jk"];

// Master event catalogue — each event tagged with pedagogy pillars it aligns with
// recurring: true means "this program runs every weekend — check venue link for exact timings this week"
const EVENT_CATALOGUE = [

  // ── PERFORMING ARTS ───────────────────────────────────────────────────────
  {
    id: "ranga-shankara-weekend",
    name: "Children's Theatre Weekend",
    provider: "Ranga Shankara",
    venue: "JP Nagar 2nd Phase, Bangalore",
    area: "Story & Culture",
    free: false, cost: "₹100–₹250",
    source: "Ranga Shankara",
    registrationUrl: "https://rangashankara.org/events/",
    date: "sat", time: "3:30 PM – 5:30 PM",
    recurring: true,
    pedagogyTags: ["story", "aesthetic-sense", "imagination", "dialogue", "community", "hundred-languages", "creative-expression"],
    builds: ["Empathy through story", "Cultural literacy", "Attention & imagination"],
    ageMin: 4, venueZone: "south",
  },
  {
    id: "ranga-shankara-sunday",
    name: "Family Play — Sunday Matinee",
    provider: "Ranga Shankara",
    venue: "JP Nagar 2nd Phase, Bangalore",
    area: "Story & Culture",
    free: false, cost: "₹100–₹250",
    source: "Ranga Shankara",
    registrationUrl: "https://rangashankara.org/events/",
    date: "sun", time: "3:30 PM – 5:30 PM",
    recurring: true,
    pedagogyTags: ["story", "aesthetic-sense", "imagination", "dialogue", "community", "hundred-languages"],
    builds: ["Narrative comprehension", "Aesthetic sensitivity", "Language richness"],
    ageMin: 4, venueZone: "south",
  },
  {
    id: "chowdiah-classical",
    name: "Family Classical Music Concert",
    provider: "Chowdiah Memorial Hall",
    venue: "Vyalikaval, Bangalore",
    area: "Music & Movement",
    free: false, cost: "₹100–₹500",
    source: "Chowdiah / BookMyShow",
    registrationUrl: "https://www.chowdiahmemorialhall.com/",
    date: "sat", time: "6:00 PM – 8:00 PM",
    recurring: true,
    pedagogyTags: ["sensitivity", "inner-life", "silence", "holistic-human", "joyful-learning", "relationship", "aesthetic-sense"],
    builds: ["Listening depth", "Aesthetic sense", "Cultural grounding"],
    ageMin: 5, venueZone: "central",
  },
  {
    id: "attakkalari-workshop",
    name: "Movement & Dance Workshop",
    provider: "Attakkalari Centre for Movement Arts",
    venue: "Lavelle Road, Bangalore",
    area: "Music & Movement",
    free: false, cost: "₹500–₹800",
    source: "Attakkalari",
    registrationUrl: "https://www.attakkalari.org/",
    date: "sat", time: "10:00 AM – 12:00 PM",
    recurring: true,
    pedagogyTags: ["physical-development", "embodied-learning", "expression", "hundred-languages", "movement", "creative-freedom"],
    builds: ["Body awareness", "Rhythmic intelligence", "Creative expression"],
    ageMin: 5, venueZone: "central",
  },
  {
    id: "spic-macay-concert",
    name: "SPIC MACAY — Indian Classical Heritage",
    provider: "SPIC MACAY Bangalore Chapter",
    venue: "Various venues, Bangalore",
    area: "Music & Movement",
    free: true, cost: "Free",
    source: "SPIC MACAY",
    registrationUrl: "https://spicmacay.com/chapter/bangalore",
    date: "sun", time: "10:00 AM – 1:00 PM",
    recurring: true,
    pedagogyTags: ["sensitivity", "cultural-roots", "holistic-human", "inner-life", "silence", "heritage", "aesthetic-sense"],
    builds: ["Cultural identity", "Classical art exposure", "Deep listening"],
    ageMin: 6, venueZone: "central",
  },

  // ── POTTERY & CRAFTS ──────────────────────────────────────────────────────
  {
    id: "golden-bridge-pottery",
    name: "Golden Bridge Pottery — Weekend Session",
    provider: "Golden Bridge Pottery / Coro",
    venue: "Indiranagar, Bangalore",
    area: "Creative & Making",
    free: false, cost: "₹1,200–₹1,800",
    source: "Urbanaut",
    registrationUrl: "https://urbanaut.app/spot/coro-commons",
    date: "sat", time: "9:00 AM – 11:00 AM",
    recurring: true,
    pedagogyTags: ["hands-on", "practical-life", "real-tools", "tactile", "self-paced", "making", "concentration"],
    builds: ["Fine motor skills", "Patience & focus", "Creative problem-solving"],
    ageMin: 4, venueZone: "east",
  },
  {
    id: "pottery-sunday",
    name: "Family Pottery Afternoon",
    provider: "Golden Bridge Pottery / Coro",
    venue: "Indiranagar, Bangalore",
    area: "Creative & Making",
    free: false, cost: "₹1,200–₹1,800",
    source: "Urbanaut",
    registrationUrl: "https://urbanaut.app/spot/coro-commons",
    date: "sun", time: "2:00 PM – 4:00 PM",
    recurring: true,
    pedagogyTags: ["hands-on", "practical-life", "real-tools", "tactile", "making", "concentration"],
    builds: ["Tactile intelligence", "Sustained attention", "Pride in making"],
    ageMin: 4, venueZone: "east",
  },
  {
    id: "bcc-workshop",
    name: "Craft & Sustainability Workshop",
    provider: "Bangalore Creative Circus",
    venue: "Domlur, Bangalore",
    area: "Creative & Making",
    free: false, cost: "₹600–₹900",
    source: "Urbanaut",
    registrationUrl: "https://urbanaut.app/spot/bangalore-creative-circus-3207",
    date: "sat", time: "11:00 AM – 1:00 PM",
    recurring: true,
    pedagogyTags: ["hands-on", "ecological", "practical-life", "making", "real-tools", "upcycling"],
    builds: ["Eco-awareness", "Making from materials", "Creative resourcefulness"],
    ageMin: 5, venueZone: "east",
  },

  // ── MUSEUMS & SCIENCE ─────────────────────────────────────────────────────
  {
    id: "map-workshop",
    name: "Kids Art Workshop — MAP",
    provider: "Museum of Art & Photography (MAP)",
    venue: "Kasturba Road, Bangalore",
    area: "Creative & Making",
    free: false, cost: "₹400–₹700",
    source: "MAP",
    registrationUrl: "https://map.cumulus.co.in/events/",
    date: "sat", time: "10:30 AM – 12:30 PM",
    recurring: true,
    pedagogyTags: ["aesthetic-sense", "hundred-languages", "art-studio", "creative-expression", "documentation", "visual-thinking"],
    builds: ["Visual thinking", "Artistic vocabulary", "Creative confidence"],
    ageMin: 5, venueZone: "central",
  },
  {
    id: "map-trail",
    name: "Family Gallery Trail — MAP",
    provider: "Museum of Art & Photography (MAP)",
    venue: "Kasturba Road, Bangalore",
    area: "Story & Culture",
    free: false, cost: "₹100–₹300",
    source: "MAP",
    registrationUrl: "https://map.cumulus.co.in/visit/",
    date: "sun", time: "11:00 AM – 1:00 PM",
    recurring: true,
    pedagogyTags: ["aesthetic-sense", "cultural-roots", "visual-thinking", "questioning-mind", "documentation", "inquiry"],
    builds: ["Art appreciation", "Observational skills", "Cultural awareness"],
    ageMin: 4, venueZone: "central",
  },
  {
    id: "planetarium-show",
    name: "Sky Show — Jawaharlal Nehru Planetarium",
    provider: "Jawaharlal Nehru Planetarium",
    venue: "Raj Bhavan Road, Bangalore",
    area: "Nature & Science",
    free: false, cost: "₹40–₹80",
    source: "Planetarium",
    registrationUrl: "https://www.taralaya.org/",
    date: "sat", time: "2:30 PM – 3:30 PM",
    recurring: true,
    pedagogyTags: ["inquiry", "questioning-mind", "science-wonder", "ecological", "joyful-learning", "real-world"],
    builds: ["Scientific curiosity", "Wonder & awe", "Astronomy basics"],
    ageMin: 5, venueZone: "central",
  },
  {
    id: "ncbs-open-day",
    name: "Science Open Day for Families",
    provider: "NCBS (National Centre for Biological Sciences)",
    venue: "GKVK Campus, Hebbal, Bangalore",
    area: "Nature & Science",
    free: true, cost: "Free",
    source: "NCBS",
    registrationUrl: "https://www.ncbs.res.in/outreach/",
    date: "sun", time: "10:00 AM – 1:00 PM",
    recurring: false,
    pedagogyTags: ["inquiry", "questioning-mind", "ecological", "real-tools", "science-wonder", "hands-on"],
    builds: ["Scientific thinking", "Research exposure", "Nature literacy"],
    ageMin: 7, venueZone: "north",
  },

  // ── STORIES & BOOKS ───────────────────────────────────────────────────────
  {
    id: "atta-galatta-story",
    name: "Storytelling & Puppet Show",
    provider: "Atta Galatta",
    venue: "Koramangala, Bangalore",
    area: "Story & Culture",
    free: false, cost: "₹200–₹350",
    source: "Atta Galatta",
    registrationUrl: "https://attagalatta.com/events/",
    date: "sat", time: "11:00 AM – 12:30 PM",
    recurring: true,
    pedagogyTags: ["story", "imagination", "oral-tradition", "relationship", "language", "hundred-languages"],
    builds: ["Narrative imagination", "Language richness", "Empathy"],
    ageMin: 3, venueZone: "south-east",
  },
  {
    id: "atta-galatta-bookclub",
    name: "Kids Book Club",
    provider: "Atta Galatta",
    venue: "Koramangala, Bangalore",
    area: "Story & Culture",
    free: false, cost: "₹200",
    source: "Atta Galatta",
    registrationUrl: "https://attagalatta.com/events/",
    date: "sun", time: "11:00 AM – 12:30 PM",
    recurring: true,
    pedagogyTags: ["story", "dialogue", "reading", "community", "language", "relationship"],
    builds: ["Reading stamina", "Critical thinking", "Community of readers"],
    ageMin: 6, venueZone: "south-east",
  },
  {
    id: "story-walk-indiranagar",
    name: "Story Walk Through Indiranagar",
    provider: "Bangalore Storytelling Society",
    venue: "Indiranagar, Bangalore",
    area: "Story & Culture",
    free: true, cost: "Free",
    source: "Urbanaut",
    registrationUrl: "https://urbanaut.app/spot/a-story-walk-through-indiranagar-bangalore",
    date: "sun", time: "8:00 AM – 9:30 AM",
    recurring: true,
    pedagogyTags: ["story", "heritage", "neighbourhood", "oral-tradition", "walking", "community"],
    builds: ["Sense of place", "Listening & narrative", "Urban awareness"],
    ageMin: 5, venueZone: "east",
  },

  // ── NATURE & OUTDOORS ─────────────────────────────────────────────────────
  {
    id: "nature-trail-cubbon",
    name: "Kids Nature Trail — Cubbon Park",
    provider: "Nature Bangalore / Gubbi Labs",
    venue: "Cubbon Park, Bangalore",
    area: "Nature & Science",
    free: true, cost: "Free",
    source: "Meetup",
    registrationUrl: "https://www.meetup.com/find/events/?keywords=nature+kids+cubbon&location=Bangalore%2C+India",
    date: "sun", time: "7:00 AM – 9:00 AM",
    recurring: true,
    pedagogyTags: ["ecological", "sensory", "nature-connection", "outdoor-learning", "observation", "place-based"],
    builds: ["Ecological literacy", "Observation skills", "Love of nature"],
    ageMin: 4, venueZone: "central",
  },
  {
    id: "looroo-play",
    name: "Theme-Based Playdate — Looroo",
    provider: "The Looroo Club",
    venue: "Indiranagar, Bangalore",
    area: "Outdoor & Active",
    free: false, cost: "₹600–₹900",
    source: "Urbanaut",
    registrationUrl: "https://urbanaut.app/featured-forkids/summer-activities",
    date: "sat", time: "10:00 AM – 12:00 PM",
    recurring: true,
    pedagogyTags: ["outdoor-learning", "child-led", "sensory", "nature-connection", "free-play", "social"],
    builds: ["Social confidence", "Physical literacy", "Imaginative play"],
    ageMin: 2, venueZone: "east",
  },
  {
    id: "farmers-market",
    name: "Organic Farmers Market & Kids Corner",
    provider: "Farmers Market Bangalore",
    venue: "UB City / Hebbal Lake, Bangalore",
    area: "Nature & Science",
    free: true, cost: "Free",
    source: "Farmers Market",
    registrationUrl: "https://www.farmersmarketbangalore.com/",
    date: "sun", time: "8:00 AM – 12:00 PM",
    recurring: true,
    pedagogyTags: ["practical-life", "ecological", "community", "real-world", "sensory", "hands-on"],
    builds: ["Food awareness", "Community connection", "Economic understanding"],
    ageMin: 2, venueZone: "central",
  },
  {
    id: "heritage-walk",
    name: "Bangalore Heritage Walk",
    provider: "Bangalore Walks / INTACH",
    venue: "Pete area / Basavanagudi, Bangalore",
    area: "Story & Culture",
    free: false, cost: "₹250–₹400",
    source: "Bangalore Walks",
    registrationUrl: "https://www.bangalorewalks.com/",
    date: "sun", time: "7:00 AM – 9:30 AM",
    recurring: true,
    pedagogyTags: ["heritage", "cultural-roots", "place-based", "history", "community", "story"],
    builds: ["Sense of history", "Cultural identity", "Observation in the city"],
    ageMin: 6, venueZone: "old-city",
  },
  {
    id: "rock-climbing",
    name: "Kids Rock Climbing — Cliffhanger",
    provider: "Cliffhanger Climbing Gym",
    venue: "Koramangala, Bangalore",
    area: "Outdoor & Active",
    free: false, cost: "₹400–₹600",
    source: "Cliffhanger",
    registrationUrl: "https://www.cliffhangerbangalore.com/",
    date: "sat", time: "10:00 AM – 12:00 PM",
    recurring: true,
    pedagogyTags: ["physical-development", "risk-taking", "resilience", "embodied-learning", "challenge", "outdoor-learning"],
    builds: ["Physical confidence", "Risk assessment", "Grit and persistence"],
    ageMin: 7, venueZone: "south-east",
  },

  // ── MUSIC & MOVEMENT ─────────────────────────────────────────────────────
  {
    id: "tabla-music",
    name: "Introduction to Tabla & Indian Percussion",
    provider: "Saptak School of Music / Various",
    venue: "Basavanagudi, Bangalore",
    area: "Music & Movement",
    free: false, cost: "₹300–₹500",
    source: "insider.in",
    registrationUrl: "https://insider.in/bangalore/music",
    date: "sun", time: "10:00 AM – 11:30 AM",
    recurring: true,
    pedagogyTags: ["sensitivity", "cultural-roots", "rhythm", "discipline", "inner-life", "heritage"],
    builds: ["Rhythmic intelligence", "Cultural grounding", "Concentration"],
    ageMin: 6, venueZone: "old-city",
  },
  {
    id: "music-morning",
    name: "Family Music Morning",
    provider: "Jagriti / Various Bangalore venues",
    venue: "Whitefield, Bangalore",
    area: "Music & Movement",
    free: false, cost: "₹300–₹600",
    source: "insider.in",
    registrationUrl: "https://insider.in/bangalore/music",
    date: "sat", time: "10:00 AM – 11:30 AM",
    recurring: true,
    pedagogyTags: ["sensitivity", "community", "hundred-languages", "joyful-learning", "rhythm", "inner-life"],
    builds: ["Musical ear", "Shared experience", "Joyful expression"],
    ageMin: 3, venueZone: "east-far",
  },

  // ── LEARNING & WORKSHOPS ──────────────────────────────────────────────────
  {
    id: "chess-kids",
    name: "Kids Chess Club",
    provider: "Bangalore Chess Academy",
    venue: "Koramangala / Indiranagar, Bangalore",
    area: "Games & Strategy",
    free: false, cost: "₹200–₹400",
    source: "Meetup",
    registrationUrl: "https://www.meetup.com/find/events/?keywords=kids+chess+bangalore&location=Bangalore%2C+India",
    date: "sun", time: "10:00 AM – 12:00 PM",
    recurring: true,
    pedagogyTags: ["reasoning", "patience", "strategy", "self-regulation", "focus", "discipline"],
    builds: ["Strategic thinking", "Patience & focus", "Sportsmanship"],
    ageMin: 6, venueZone: "south-east",
  },
  {
    id: "creative-writing",
    name: "Young Writers Workshop",
    provider: "The Writer's Workshop Bangalore",
    venue: "Koramangala, Bangalore",
    area: "Story & Culture",
    free: false, cost: "₹500–₹800",
    source: "Eventbrite",
    registrationUrl: "https://www.eventbrite.co.in/d/india--bangalore/kids-writing/",
    date: "sat", time: "10:00 AM – 12:00 PM",
    recurring: true,
    pedagogyTags: ["story", "expression", "language", "imagination", "dialogue", "self-knowledge"],
    builds: ["Written expression", "Story structure", "Confidence in voice"],
    ageMin: 8, venueZone: "south-east",
  },
  {
    id: "robotics-tinkering",
    name: "Robotics & Tinkering Lab",
    provider: "Maker's Asylum / TinkerHub Bangalore",
    venue: "Indiranagar, Bangalore",
    area: "Nature & Science",
    free: false, cost: "₹600–₹1,000",
    source: "Meetup",
    registrationUrl: "https://www.meetup.com/find/events/?keywords=kids+robotics+bangalore&location=Bangalore%2C+India",
    date: "sat", time: "11:00 AM – 1:00 PM",
    recurring: true,
    pedagogyTags: ["hands-on", "inquiry", "real-tools", "problem-solving", "making", "self-directed"],
    builds: ["Computational thinking", "Making & iteration", "Problem-solving"],
    ageMin: 8, venueZone: "east",
  },
  {
    id: "improv-theatre",
    name: "Improv Theatre for Kids & Teens",
    provider: "Jagriti Theatre / The Improv Company",
    venue: "Whitefield, Bangalore",
    area: "Story & Culture",
    free: false, cost: "₹500–₹700",
    source: "insider.in",
    registrationUrl: "https://insider.in/bangalore/workshops",
    date: "sun", time: "3:00 PM – 5:00 PM",
    recurring: true,
    pedagogyTags: ["expression", "community", "dialogue", "risk-taking", "self-knowledge", "hundred-languages"],
    builds: ["Confidence", "Quick thinking", "Empathy through play"],
    ageMin: 9, venueZone: "east-far",
  },
  {
    id: "cooking-science",
    name: "Kitchen Science & Food Chemistry",
    provider: "Various Bangalore schools / workshops",
    venue: "Koramangala, Bangalore",
    area: "Nature & Science",
    free: false, cost: "₹500–₹800",
    source: "Eventbrite",
    registrationUrl: "https://www.eventbrite.co.in/d/india--bangalore/kids-science/",
    date: "sat", time: "11:00 AM – 1:00 PM",
    recurring: true,
    pedagogyTags: ["hands-on", "inquiry", "practical-life", "real-tools", "science-wonder", "questioning-mind"],
    builds: ["Science curiosity", "Kitchen independence", "Understanding chemistry through food"],
    ageMin: 7, venueZone: "south-east",
  },
  {
    id: "debate-young",
    name: "Young Thinkers Debate Forum",
    provider: "Bangalore Debate Academy",
    venue: "Indiranagar, Bangalore",
    area: "Games & Strategy",
    free: false, cost: "₹300–₹500",
    source: "Meetup",
    registrationUrl: "https://www.meetup.com/find/events/?keywords=debate+teens+bangalore&location=Bangalore%2C+India",
    date: "sat", time: "10:00 AM – 12:30 PM",
    recurring: true,
    pedagogyTags: ["reasoning", "dialogue", "self-expression", "questioning-mind", "community", "self-knowledge"],
    builds: ["Critical thinking", "Public speaking", "Evidence-based reasoning"],
    ageMin: 10, venueZone: "east",
  },
];

// Score an event against a single school's pillars (0–100)
function scoreAgainstSchool(event, schoolKey) {
  const pillars = SCHOOL_PILLARS[schoolKey] || [];
  if (!pillars.length) return 0;
  const overlap = event.pedagogyTags.filter((t) => pillars.includes(t)).length;
  return Math.round((overlap / Math.max(event.pedagogyTags.length, 1)) * 100);
}

// Multi-school score: score against Montessori + CFL + JK, return per-school + combined
function multiSchoolScore(event) {
  const scores = {};
  ACTIVE_SCHOOLS.forEach((s) => { scores[s] = scoreAgainstSchool(event, s); });
  // Combined = weighted average (equal weight)
  const combined = Math.round(ACTIVE_SCHOOLS.reduce((sum, s) => sum + scores[s], 0) / ACTIVE_SCHOOLS.length);
  return { scores, combined };
}

// Full event score: multi-school combined + preference signals + free + age fit + proximity
function scoreEvent(event, schoolKey, liked, dismissed, childAge, pincode) {
  const { combined } = multiSchoolScore(event);

  let preferenceBonus = 0;
  liked.forEach((id) => {
    const prev = EVENT_CATALOGUE.find((e) => e.id === id);
    if (!prev) return;
    const overlap = event.pedagogyTags.filter((t) => prev.pedagogyTags.includes(t)).length;
    preferenceBonus += overlap * 8;
  });

  let preferencePenalty = 0;
  dismissed.forEach((id) => {
    const prev = EVENT_CATALOGUE.find((e) => e.id === id);
    if (!prev) return;
    const overlap = event.pedagogyTags.filter((t) => prev.pedagogyTags.includes(t)).length;
    preferencePenalty += overlap * 6;
  });

  const freeBoost = event.free ? 8 : 0;
  const ageFit = ageSuitabilityScore(event, childAge);
  const proximity = proximityScore(event, pincode);
  return Math.max(0, Math.min(130, combined + freeBoost + ageFit + proximity + preferenceBonus - preferencePenalty));
}

const SCHOOL_LABELS = { montessori: "Montessori", cfl: "CFL", jk: "JK" };
const SCHOOL_COLORS = { montessori: "#2f6f58", cfl: "#315f86", jk: "#7a5c3a" };

// ─── Location proximity ────────────────────────────────────────────────────────
// Bangalore zones + inter-zone travel distance (0=same, 1=close, 2=medium, 3=far)
const ZONE_DISTANCE = {
  central:   { central:0, east:1, "old-city":1, north:1, "south-east":2, south:2, "east-far":3 },
  east:      { central:1, east:0, "old-city":2, north:2, "south-east":1, south:2, "east-far":2 },
  "old-city":{ central:1, east:2, "old-city":0, north:2, "south-east":1, south:1, "east-far":3 },
  north:     { central:1, east:2, "old-city":2, north:0, "south-east":3, south:3, "east-far":3 },
  "south-east":{ central:2, east:1, "old-city":1, north:3, "south-east":0, south:1, "east-far":2 },
  south:     { central:2, east:2, "old-city":1, north:3, "south-east":1, south:0, "east-far":3 },
  "east-far":{ central:3, east:2, "old-city":3, north:3, "south-east":2, south:3, "east-far":0 },
};

// Pincode prefix → zone (first 6 digits)
const PINCODE_ZONE = {
  "560001": "central", "560002": "central", "560003": "central", "560004": "central",
  "560005": "central", "560007": "central", "560009": "central", "560027": "central",
  "560033": "central",
  "560006": "north",   "560008": "north",   "560032": "north",   "560036": "north",
  "560040": "north",   "560043": "north",   "560045": "north",   "560076": "north",
  "560012": "east",    "560013": "east",    "560019": "east",    "560026": "east",
  "560029": "east",    "560031": "east",
  "560010": "old-city","560028": "old-city","560030": "old-city","560041": "old-city",
  "560016": "south-east","560034": "south-east","560071": "south-east","560095": "south-east",
  "560011": "south",   "560017": "south",   "560020": "south",   "560021": "south",
  "560022": "south",   "560024": "south",   "560069": "south",   "560078": "south",
  "560025": "south",
  "560035": "east-far","560037": "east-far","560068": "east-far","560085": "east-far",
  "560087": "east-far","560093": "east-far","560102": "east-far",
  "560103": "south",
};

const ZONE_LABELS = { central:"Central", east:"East / Indiranagar", "old-city":"Old City", north:"North / Hebbal", "south-east":"Koramangala / HSR", south:"South / JP Nagar", "east-far":"Whitefield" };

function pincodeToZone(pin) {
  return PINCODE_ZONE[String(pin).slice(0, 6)] || null;
}

function proximityScore(event, pincode) {
  if (!pincode || !event.venueZone) return 0;
  const userZone = pincodeToZone(pincode);
  if (!userZone) return 0;
  const dist = ZONE_DISTANCE[userZone]?.[event.venueZone] ?? 2;
  return [20, 12, 4, 0][dist] ?? 0;
}

function proximityLabel(event, pincode) {
  if (!pincode || !event.venueZone) return null;
  const userZone = pincodeToZone(pincode);
  if (!userZone) return null;
  const dist = ZONE_DISTANCE[userZone]?.[event.venueZone] ?? 2;
  return ["Nearby", "~30 min", "~45 min", "~60 min+"][dist] ?? null;
}

// Age-fit bonus: rewards events pitched at the child's actual age bracket
function ageSuitabilityScore(event, childAge) {
  if (childAge === "" || childAge == null) return 0;
  const age = Number(childAge);
  const diff = age - event.ageMin; // 0 = perfect bottom-of-range fit
  if (diff <= 2) return 18;  // perfect match (age is at or just above min)
  if (diff <= 4) return 8;   // slightly younger event, still good
  return 0;                  // event designed for much younger kids
}

// Compute actual next-weekend dates dynamically so they're always current
function getWeekendDates() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 6=Sat
  const daysToSat = day === 6 ? 7 : (6 - day); // next Saturday (not today if today is Sat)
  const sat = new Date(today); sat.setDate(today.getDate() + daysToSat);
  const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
  const fmt = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  return { sat: fmt(sat), sun: fmt(sun), satDate: sat, sunDate: sun };
}


const AREA_COLORS = {
  "Creative & Making": "#b94c36",
  "Story & Culture": "#315f86",
  "Nature & Outdoor": "#2f6f58",
  "Play & Social": "#7a5c3a",
  "Music & Movement": "#5a3a7a",
};

export default function WeekendPicks() {
  const [profile, setProfile] = useLocalStorage("wknd_profile", { schoolKey: "", age: "" });
  const [liked, setLiked] = useLocalStorage("wknd_liked", []);
  const [dismissed, setDismissed] = useLocalStorage("wknd_dismissed", []);
  const [registered, setRegistered] = useLocalStorage("wknd_registered", []);
  const [setup, setSetup] = useState(!profile.schoolKey);
  const [justRegistered, setJustRegistered] = useState(null);
  const [apiEvents, setApiEvents] = useState(null); // null = not loaded yet
  const [apiOnline, setApiOnline] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]); // real-time events from Eventbrite/Meetup
  const [manualEvents, setManualEvents] = useLocalStorage("wknd_manual", []); // user-added via Instagram parser
  const [igOpen, setIgOpen] = useState(false); // show Instagram paste panel
  const [igText, setIgText] = useState("");
  const [igUrl, setIgUrl] = useState("");
  const [igParsing, setIgParsing] = useState(false);
  const [igResult, setIgResult] = useState(null); // parsed event preview
  const [igError, setIgError] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const [dateFilters, setDateFilters] = useState([]); // empty = show all
  const [timeFilters, setTimeFilters] = useState([]); // empty = show all
  const [sourceFilters, setSourceFilters] = useState([]); // empty = show all
  const [ageFilter, setAgeFilter] = useState(null); // null = use profile age
  const [starredEvents, setStarredEvents] = useLocalStorage("wknd_starred", []);
  const [deprioritized, setDeprioritized] = useLocalStorage("wknd_deprioritized", []);
  const [eventNotes, setEventNotes] = useLocalStorage("wknd_notes", {});
  const [noteEditing, setNoteEditing] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [syncError, setSyncError] = useState("");
  const [customAccounts, setCustomAccounts] = useLocalStorage("wknd_ig_accounts", []);
  const [accountInput, setAccountInput] = useState("");
  const [customSyncing, setCustomSyncing] = useState(false);
  const [accountsPanelOpen, setAccountsPanelOpen] = useState(false);

  const { schoolKey, age, pincode } = profile;

  // Try loading from API whenever liked/dismissed/age changes
  useEffect(() => {
    if (setup || age === "") return;
    const params = new URLSearchParams({
      age,
      ...(liked.length && { liked: liked.join(",") }),
      ...(dismissed.length && { dismissed: dismissed.join(",") }),
    });
    apiCall(`/events?${params}`).then((data) => {
      if (data?.events) {
        setApiEvents(data.events);
        setApiOnline(true);
      } else {
        setApiEvents(null);
        // /events needs Neo4j — check if backend is at least reachable via Instagram endpoint
        apiCall(`/events/instagram?age=${age}`).then(igData => {
          setApiOnline(!!(igData?.events));
        });
      }
    });
  }, [setup, age, liked, dismissed]);

  async function handleParseInstagram() {
    if (!igText.trim()) return;
    setIgParsing(true); setIgError(""); setIgResult(null);
    const data = await apiCall("/events/parse", "POST", { text: igText, url: igUrl || undefined });
    setIgParsing(false);
    if (data?.event) { setIgResult(data.event); }
    else { setIgError(data?.error || "Backend not reachable — start it with: cd backend/api && node index.js"); }
  }

  function handleAddParsedEvent() {
    if (!igResult) return;
    setManualEvents(prev => [igResult, ...prev.filter(e => e.id !== igResult.id)]);
    setIgOpen(false); setIgText(""); setIgUrl(""); setIgResult(null);
  }

  // Fetch live events (Eventbrite + Meetup + Instagram) when age is known
  useEffect(() => {
    if (setup || age === "") return;
    Promise.all([
      apiCall(`/events/live?age=${age}`),
      apiCall(`/events/instagram?age=${age}`),
    ]).then(([liveData, igData]) => {
      const live = liveData?.events || [];
      const ig = igData?.events || [];
      // deduplicate by id
      const seen = new Set();
      const combined = [...ig, ...live].filter(e => seen.has(e.id) ? false : seen.add(e.id));
      if (combined.length) setLiveEvents(combined);
    });
  }, [setup, age]);

  // Static fallback scoring — sort: date (Sat→Sun) → age-fit → proximity
  // Merges live events (Eventbrite/Meetup) at the top of the pool
  const staticRecommendations = useMemo(() => {
    const existingIds = new Set(EVENT_CATALOGUE.map(e => e.id));
    const merged = [
      ...manualEvents,
      ...liveEvents.filter(e => !existingIds.has(e.id) && !manualEvents.find(m => m.id === e.id)),
      ...EVENT_CATALOGUE,
    ];
    const pool = merged.filter(
      (e) =>
        !dismissed.includes(e.id) &&
        !registered.includes(e.id) &&
        (age === "" || Number(age) >= e.ageMin)
    );
    return pool
      .map((e) => {
        const { scores } = multiSchoolScore(e);
        const score = scoreEvent(e, schoolKey, liked, dismissed, age, pincode);
        const ageFit = ageSuitabilityScore(e, age);
        const prox = proximityScore(e, pincode);
        const dayOrder = e.date === "sat" ? 0 : 1;
        return { ...e, schoolScores: scores, score, _dayOrder: dayOrder, _ageFit: ageFit, _prox: prox };
      })
      .sort((a, b) => {
        if (a._dayOrder !== b._dayOrder) return a._dayOrder - b._dayOrder; // Sat before Sun
        if (b._ageFit !== a._ageFit) return b._ageFit - a._ageFit;         // better age fit first
        return b._prox - a._prox;                                           // closer first
      });
  }, [schoolKey, age, pincode, liked, dismissed, registered]);

  // Use API data when available, else static
  const recommendations = (apiEvents
    ? apiEvents.filter((e) => !registered.includes(e.id))
    : staticRecommendations
  );

  // Kick off custom account sync on mount if accounts saved
  useEffect(() => {
    if (customAccounts.length > 0 && apiOnline) {
      triggerCustomSync(customAccounts, false);
    }
  }, [apiOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  function parseStartHour(time) {
    if (!time) return null;
    const m = time.match(/(\d+):\d+\s*(AM|PM)/i);
    if (!m) return null;
    let h = parseInt(m[1]);
    const period = m[2].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h;
  }

  // Sort: custom-account Instagram first, then other Instagram, then Urbanaut, then rest
  const sortedRecommendations = useMemo(() => {
    const customSet = new Set(customAccounts.map(u => u.replace(/^@/, "").trim().toLowerCase()));
    const tier = (e) => {
      if (e.source === "Instagram" && customSet.has((e.instagramAccount || "").toLowerCase())) return 0;
      if (e.source === "Instagram") return 1;
      if (e.source === "Urbanaut") return 2;
      return 3;
    };
    return [...recommendations].sort((a, b) => tier(a) - tier(b));
  }, [recommendations, customAccounts]);

  // Apply date + time filters
  const { sat: satLabel, sun: sunLabel, satDate, sunDate } = getWeekendDates();
  const satISO = satDate.toISOString().slice(0, 10);
  const sunISO = sunDate.toISOString().slice(0, 10);
  const todayISO = new Date().toISOString().slice(0, 10);
  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  function toggleDateFilter(key) {
    setDateFilters(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }
  function toggleTimeFilter(key) {
    setTimeFilters(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }
  function toggleSourceFilter(src) {
    setSourceFilters(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]);
  }
  function toggleStar(id, ev) {
    const nowStarred = !starredEvents.includes(id);
    setStarredEvents(prev => nowStarred ? [...prev, id] : prev.filter(s => s !== id));
    apiCall(`/events/${id}/star`, "POST", { starred: nowStarred, eventMeta: getEventMeta(ev) });
  }
  function toggleDeprioritize(id, ev) {
    const nowDeprior = !deprioritized.includes(id);
    setDeprioritized(prev => nowDeprior ? [...prev, id] : prev.filter(s => s !== id));
    apiCall(`/events/${id}/deprioritize`, "POST", { deprioritized: nowDeprior, eventMeta: getEventMeta(ev) });
  }
  function saveNote(id, ev) {
    setEventNotes(prev => ({ ...prev, [id]: noteDraft }));
    apiCall(`/events/${id}/note`, "POST", { note: noteDraft, eventMeta: getEventMeta(ev) });
    setNoteEditing(null);
  }

  const filteredRecommendations = useMemo(() => {
    return sortedRecommendations.filter(e => {
      // Date filter — any selected date is a match
      if (dateFilters.length > 0) {
        const matchesDate = dateFilters.some(f => {
          if (f === "today") return e.date === todayISO;
          if (f === "sat") return e.date === "sat" || e.date === satISO;
          if (f === "sun") return e.date === "sun" || e.date === sunISO;
          return false;
        });
        if (!matchesDate) return false;
      }
      // Time filter — any selected slot is a match
      if (timeFilters.length > 0) {
        const h = parseStartHour(e.time);
        if (h !== null) {
          const matchesTime = timeFilters.some(f => {
            if (f === "morning") return h < 12;
            if (f === "afternoon") return h >= 12 && h < 17;
            if (f === "evening") return h >= 17;
            return false;
          });
          if (!matchesTime) return false;
        }
      }
      // Source filter
      if (sourceFilters.length > 0 && !sourceFilters.includes(e.source)) return false;
      // Age filter — override profile age
      if (ageFilter !== null && (e.ageMin ?? 0) > ageFilter) return false;
      return true;
    });
  }, [sortedRecommendations, dateFilters, timeFilters, sourceFilters, ageFilter, todayISO, satISO, sunISO]);

  // Reset visible count when filtered list changes
  useEffect(() => { setVisibleCount(6); }, [filteredRecommendations.length]);

  const displayedRecommendations = useMemo(() => {
    const normal = filteredRecommendations.filter(e => !deprioritized.includes(e.id));
    const bottom = filteredRecommendations.filter(e => deprioritized.includes(e.id));
    return [...normal, ...bottom];
  }, [filteredRecommendations, deprioritized]);

  const visibleEvents = displayedRecommendations.slice(0, visibleCount);

  function eventDateLabel(e) {
    return e.date === "sat" ? satLabel : e.date === "sun" ? sunLabel : e.date;
  }

  async function triggerCustomSync(accounts, showSyncing = true) {
    if (!accounts.length) return;
    setSyncError("");
    if (!apiOnline) {
      setSyncError("Backend is offline — start it with: cd backend/api && node index.js");
      return;
    }
    if (showSyncing) setCustomSyncing(true);
    try {
      await apiCall("/events/instagram/sync-custom", "POST", { accounts });
      // Refresh events after ~3 min (Apify takes ~2–3 min)
      if (showSyncing) {
        setTimeout(async () => {
          const data = await apiCall(`/events/instagram?age=${age}`);
          if (data?.events?.length) {
            const live = await apiCall(`/events/live?age=${age}`);
            const liveArr = live?.events || [];
            const seen = new Set();
            const combined = [...data.events, ...liveArr].filter(e => seen.has(e.id) ? false : seen.add(e.id));
            if (combined.length) setLiveEvents(combined);
          }
          setCustomSyncing(false);
        }, 3 * 60 * 1000);
      }
    } catch (e) {
      setSyncError(e.message || "Sync failed");
      setCustomSyncing(false);
    }
  }

  function handleSaveAccounts() {
    const newParsed = accountInput.trim()
      ? accountInput.split(/[\s,@]+/).map(s => s.trim()).filter(Boolean)
      : [];
    const merged = newParsed.length
      ? [...new Set([...customAccounts, ...newParsed])]
      : customAccounts;
    if (!merged.length) return;
    setCustomAccounts(merged);
    setAccountInput("");
    triggerCustomSync(merged, true);
  }

  function getEventMeta(ev) {
    if (!ev || ev.source !== "Instagram") return undefined;
    return { name: ev.name, date: ev.date, time: ev.time, venue: ev.venue,
             cost: ev.cost, price: ev.price, instagramAccount: ev.instagramAccount,
             registrationUrl: ev.registrationUrl };
  }

  async function handleLike(id, url, ev) {
    if (!liked.includes(id)) {
      setLiked([...liked, id]);
      await apiCall(`/events/${id}/like`, "POST", { eventMeta: getEventMeta(ev) });
    }
    if (url) window.open(url, "_blank", "noopener");
  }

  async function handleDismiss(id, ev) {
    if (!dismissed.includes(id)) {
      setDismissed([...dismissed, id]);
      await apiCall(`/events/${id}/dismiss`, "POST", { eventMeta: getEventMeta(ev) });
    }
  }

  async function handleRegister(event) {
    setRegistered([...registered, event.id]);
    setLiked([...liked, event.id]);
    setJustRegistered(event);

    // Get best deep link from API (may 404 for IG events not yet in Neo4j — that's fine)
    const urlData = await apiCall(`/events/${event.id}/url`).catch(() => null);
    const deepUrl = urlData?.url || event.registrationUrl || event.url || event.instagramUrl;

    await apiCall(`/events/${event.id}/register`, "POST", { eventMeta: getEventMeta(event) });
    if (deepUrl) window.open(deepUrl, "_blank", "noopener");
  }

  function handleReset() {
    setLiked([]); setDismissed([]); setRegistered([]);
    setProfile({ schoolKey: "", age: "" });
    setSetup(true);
    setJustRegistered(null);
  }

  if (setup) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
              Child's age
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <input
                type="range" min={0} max={15}
                value={profile.age === "" ? 0 : profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                style={{ flex: 1, accentColor: "var(--leaf)" }}
              />
              <span style={{ fontWeight: 800, fontSize: "1.4rem", color: "var(--leaf)", minWidth: 44 }}>
                {profile.age === "" ? "—" : `${profile.age}y`}
              </span>
            </div>
          </div>
          <div>
            <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
              Her school's philosophy
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {Object.entries(SCHOOL_DATA).map(([key, s]) => (
                <button
                  key={key} type="button"
                  onClick={() => setProfile({ ...profile, schoolKey: key })}
                  style={{
                    padding: "12px 14px", textAlign: "left", cursor: "pointer",
                    border: `2px solid ${profile.schoolKey === key ? s.color : "var(--line)"}`,
                    borderRadius: 10,
                    background: profile.schoolKey === key ? `${s.color}12` : "var(--white)",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: profile.schoolKey === key ? s.color : "var(--ink)" }}>{s.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2 }}>{s.subtitle}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
              Your Bangalore pincode <span style={{ fontWeight: 400, textTransform: "none" }}>(for nearby events)</span>
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="text" maxLength={6} placeholder="e.g. 560029"
                value={profile.pincode || ""}
                onChange={(e) => setProfile({ ...profile, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                style={{
                  padding: "10px 14px", fontSize: "1rem", border: "1.5px solid var(--line)", borderRadius: 8,
                  background: "var(--white)", color: "var(--ink)", outline: "none", width: 140,
                  fontFamily: "inherit",
                }}
              />
              {profile.pincode && pincodeToZone(profile.pincode) && (
                <span style={{ fontSize: "0.8rem", color: "var(--leaf)", fontWeight: 600 }}>
                  📍 {ZONE_LABELS[pincodeToZone(profile.pincode)]}
                </span>
              )}
              {profile.pincode && profile.pincode.length === 6 && !pincodeToZone(profile.pincode) && (
                <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Pincode not in map — still works</span>
              )}
            </div>
          </div>
          <button
            disabled={!profile.schoolKey || profile.age === ""}
            onClick={() => setSetup(false)}
            style={{
              padding: "13px 24px", fontWeight: 700, fontSize: "0.92rem", border: "none", borderRadius: 8,
              background: profile.schoolKey && profile.age !== "" ? "var(--leaf)" : "var(--line)",
              color: profile.schoolKey && profile.age !== "" ? "var(--white)" : "var(--muted)",
              cursor: profile.schoolKey && profile.age !== "" ? "pointer" : "not-allowed",
            }}
          >
            Show this weekend's picks →
          </button>
        </div>
      </div>
    );
  }

  const school = SCHOOL_DATA[schoolKey];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Profile bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {ACTIVE_SCHOOLS.map((sk) => (
              <span key={sk} style={{ fontSize: "0.72rem", fontWeight: 700, padding: "3px 9px", borderRadius: 12, background: `${SCHOOL_COLORS[sk]}18`, color: SCHOOL_COLORS[sk] }}>
                {SCHOOL_LABELS[sk]}
              </span>
            ))}
          </div>
          <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
            · Age {age}
            {pincode && pincodeToZone(pincode) && ` · ${ZONE_LABELS[pincodeToZone(pincode)]}`}
            · {recommendations.length} events
          </span>
          {liked.length > 0 && (
            <span style={{ fontSize: "0.75rem", color: "var(--leaf)", fontWeight: 600 }}>
              · {liked.length} signal{liked.length > 1 ? "s" : ""} learnt
            </span>
          )}
          <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 10, fontWeight: 600,
            background: apiOnline ? "#f0f7f3" : "var(--band)",
            color: apiOnline ? "var(--leaf)" : "var(--muted)" }}>
            {apiOnline ? "● Neo4j live" : "○ Static mode"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => { setIgOpen(o => !o); setIgResult(null); setIgError(""); }}
            style={{ background: igOpen ? "var(--leaf)" : "none", border: `1.5px solid ${igOpen ? "var(--leaf)" : "var(--line)"}`,
              color: igOpen ? "#fff" : "var(--muted)", fontSize: "0.78rem", cursor: "pointer",
              fontWeight: 700, borderRadius: 8, padding: "4px 12px" }}>
            + Instagram
          </button>
          <button onClick={handleReset} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}>
            Reset ↺
          </button>
        </div>
      </div>

      {/* Instagram caption parser */}
      {igOpen && (
        <div style={{ background: "var(--band)", border: "1.5px solid var(--line)", borderRadius: 14, padding: "20px 22px", marginBottom: 16 }}>
          <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: "0.9rem" }}>Add event from Instagram</p>
          <p style={{ margin: "0 0 14px", fontSize: "0.78rem", color: "var(--muted)" }}>
            Open the Instagram post → tap ··· → Copy → paste the caption below. Claude extracts the event details.
          </p>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Post URL (optional)</label>
            <input value={igUrl} onChange={e => setIgUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--line)", fontSize: "0.82rem", background: "var(--white)", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Caption / event text *</label>
            <textarea value={igText} onChange={e => setIgText(e.target.value)} rows={5}
              placeholder="Paste the Instagram caption or WhatsApp event message here..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid var(--line)", fontSize: "0.82rem", resize: "vertical", background: "var(--white)", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          {igError && <p style={{ color: "#b94c36", fontSize: "0.8rem", margin: "0 0 10px" }}>{igError}</p>}

          {igResult ? (
            <div style={{ background: "var(--white)", border: "2px solid var(--leaf)", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
              <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: "0.95rem" }}>{igResult.name}</p>
              <p style={{ margin: "0 0 6px", fontSize: "0.8rem", color: "var(--muted)" }}>
                {igResult.provider && `${igResult.provider} · `}{igResult.venue}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                {igResult.date && <span style={{ fontSize: "0.75rem", background: "#f0f7f3", color: "var(--leaf)", fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>
                  📅 {igResult.date}{igResult.time ? ` · ${igResult.time}` : ""}
                </span>}
                {igResult.cost && <span style={{ fontSize: "0.75rem", background: "var(--band)", padding: "2px 8px", borderRadius: 8 }}>{igResult.cost}</span>}
                {igResult.ageMin > 0 && <span style={{ fontSize: "0.75rem", background: "var(--band)", padding: "2px 8px", borderRadius: 8 }}>Age {igResult.ageMin}+</span>}
                <span style={{ fontSize: "0.75rem", background: "var(--band)", padding: "2px 8px", borderRadius: 8 }}>{igResult.area}</span>
              </div>
              {igResult.builds?.length > 0 && <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>Builds: {igResult.builds.join(" · ")}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={handleAddParsedEvent}
                  style={{ padding: "8px 20px", background: "var(--leaf)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
                  Add to Weekend Picks
                </button>
                <button onClick={() => setIgResult(null)}
                  style={{ padding: "8px 14px", background: "none", border: "1.5px solid var(--line)", borderRadius: 8, fontSize: "0.82rem", cursor: "pointer", color: "var(--muted)" }}>
                  Re-extract
                </button>
              </div>
            </div>
          ) : (
            <button onClick={handleParseInstagram} disabled={igParsing || !igText.trim()}
              style={{ padding: "9px 22px", background: igParsing || !igText.trim() ? "var(--band)" : "var(--leaf)",
                color: igParsing || !igText.trim() ? "var(--muted)" : "#fff", border: "none",
                borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: igParsing ? "default" : "pointer" }}>
              {igParsing ? "Extracting with Claude…" : "Extract event →"}
            </button>
          )}

          {manualEvents.length > 0 && (
            <p style={{ margin: "14px 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>
              {manualEvents.length} event{manualEvents.length > 1 ? "s" : ""} added manually ·{" "}
              <button onClick={() => setManualEvents([])} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                clear all
              </button>
            </p>
          )}
        </div>
      )}

      {/* Just registered confirmation */}
      {justRegistered && (
        <div style={{ background: "#f0f7f3", border: "1.5px solid var(--leaf)", borderRadius: 10, padding: "14px 18px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "0.9rem", color: "var(--leaf)" }}>Registered → {justRegistered.name}</p>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>Registration page opened. Saved to your list.</p>
          </div>
          <button onClick={() => setJustRegistered(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1.1rem" }}>✕</button>
        </div>
      )}

      {/* Registered events list */}
      {registered.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--leaf)" }}>
            Registered this weekend
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {registered.map((id) => {
              const e = EVENT_CATALOGUE.find((ev) => ev.id === id);
              return e ? (
                <span key={id} style={{ fontSize: "0.8rem", padding: "4px 12px", borderRadius: 20, background: "#f0f7f3", color: "var(--leaf)", fontWeight: 600 }}>
                  ✓ {e.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* ── Filters: date + time ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Date chips — multiselect */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 36 }}>Date</span>
          {dateFilters.length > 0 && (
            <button onClick={() => setDateFilters([])}
              style={{ padding: "4px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", border: "1.5px solid var(--line)", background: "var(--band)", color: "var(--muted)" }}>
              Clear ✕
            </button>
          )}
          {[
            { key: "today", label: `Today · ${todayLabel}` },
            { key: "sat", label: satLabel },
            { key: "sun", label: sunLabel },
          ].map(({ key, label }) => {
            const on = dateFilters.includes(key);
            return (
              <button key={key} onClick={() => toggleDateFilter(key)}
                style={{
                  padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                  border: `1.5px solid ${on ? "var(--leaf)" : "var(--line)"}`,
                  background: on ? "var(--leaf)" : "var(--white)",
                  color: on ? "#fff" : "var(--ink)",
                }}>
                {label}
              </button>
            );
          })}
        </div>
        {/* Time chips — multiselect */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 36 }}>Time</span>
          {timeFilters.length > 0 && (
            <button onClick={() => setTimeFilters([])}
              style={{ padding: "4px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", border: "1.5px solid var(--line)", background: "var(--band)", color: "var(--muted)" }}>
              Clear ✕
            </button>
          )}
          {[
            { key: "morning", label: "Morning ☀️ before 12" },
            { key: "afternoon", label: "Afternoon 🌤 12–5" },
            { key: "evening", label: "Evening 🌆 after 5" },
          ].map(({ key, label }) => {
            const on = timeFilters.includes(key);
            return (
              <button key={key} onClick={() => toggleTimeFilter(key)}
                style={{
                  padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                  border: `1.5px solid ${on ? "var(--leaf)" : "var(--line)"}`,
                  background: on ? "var(--leaf)" : "var(--white)",
                  color: on ? "#fff" : "var(--ink)",
                }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Age filter chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 36 }}>Age</span>
          {ageFilter !== null && (
            <button onClick={() => setAgeFilter(null)}
              style={{ padding: "4px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", border: "1.5px solid var(--line)", background: "var(--band)", color: "var(--muted)" }}>
              Clear ✕
            </button>
          )}
          {[2, 3, 4, 5, 6, 7, 8].map(n => {
            const on = ageFilter === n;
            return (
              <button key={n} onClick={() => setAgeFilter(on ? null : n)}
                style={{
                  padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                  border: `1.5px solid ${on ? "var(--leaf)" : "var(--line)"}`,
                  background: on ? "var(--leaf)" : "var(--white)",
                  color: on ? "#fff" : "var(--ink)",
                }}>
                {n}+
              </button>
            );
          })}
        </div>

        {/* Source filter chips */}
        {(() => {
          const sources = [...new Set(sortedRecommendations.map(e => e.source).filter(Boolean))];
          if (sources.length < 2) return null;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 36 }}>From</span>
              {sourceFilters.length > 0 && (
                <button onClick={() => setSourceFilters([])}
                  style={{ padding: "4px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", border: "1.5px solid var(--line)", background: "var(--band)", color: "var(--muted)" }}>
                  Clear ✕
                </button>
              )}
              {sources.map(src => {
                const on = sourceFilters.includes(src);
                return (
                  <button key={src} onClick={() => toggleSourceFilter(src)}
                    style={{
                      padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                      border: `1.5px solid ${on ? "var(--leaf)" : "var(--line)"}`,
                      background: on ? "var(--leaf)" : "var(--white)",
                      color: on ? "#fff" : "var(--ink)",
                    }}>
                    {src}
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* Instagram accounts panel */}
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 2 }}>
          <button onClick={() => setAccountsPanelOpen(p => !p)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: "0.78rem", fontWeight: 600 }}>
            <span style={{ fontSize: "0.85rem" }}>📸</span>
            Follow accounts
            {customAccounts.length > 0 && (
              <span style={{ background: "#c13584", color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: "0.68rem", fontWeight: 700 }}>
                {customAccounts.length}
              </span>
            )}
            {customSyncing && <span style={{ fontSize: "0.7rem", color: "#c13584", fontWeight: 700 }}>· syncing…</span>}
            <span style={{ marginLeft: 2 }}>{accountsPanelOpen ? "▲" : "▼"}</span>
          </button>

          {accountsPanelOpen && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {customAccounts.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {customAccounts.map(a => (
                    <span key={a} style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: 20, background: "#fce4f3", color: "#c13584", fontWeight: 600 }}>
                      {a.startsWith("@") ? a : `@${a}`}
                      <button onClick={() => {
                        const next = customAccounts.filter(x => x !== a);
                        setCustomAccounts(next);
                      }} style={{ background: "none", border: "none", cursor: "pointer", color: "#c13584", padding: "0 0 0 4px", fontSize: "0.7rem" }}>✕</button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <textarea
                  rows={2}
                  placeholder="@attagalatta, @rangashankara, @craftymeets"
                  value={accountInput}
                  onChange={e => { setAccountInput(e.target.value); setSyncError(""); }}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1.5px solid var(--line)", fontSize: "0.8rem", resize: "none", fontFamily: "inherit", color: "var(--ink)", background: "var(--white)" }}
                />
                <button
                  onClick={handleSaveAccounts}
                  disabled={(!accountInput.trim() && !customAccounts.length) || customSyncing}
                  style={{
                    padding: "8px 14px",
                    background: customSyncing ? "var(--band)" : ((!accountInput.trim() && !customAccounts.length) ? "var(--band)" : "#c13584"),
                    color: customSyncing || (!accountInput.trim() && !customAccounts.length) ? "var(--muted)" : "#fff",
                    border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap",
                  }}>
                  {customSyncing ? "Syncing…" : accountInput.trim() ? "Fetch →" : "Re-sync →"}
                </button>
              </div>
              {syncError && (
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#b45309", background: "#fef3c7", padding: "6px 10px", borderRadius: 6 }}>
                  ⚠ {syncError}
                </p>
              )}
              <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--muted)" }}>
                Add handles and tap Fetch, or tap Re-sync to refresh saved ones. Takes ~3 min via Instagram.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Event cards */}
      {dismissed.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "8px 14px", background: "var(--band)", borderRadius: 8 }}>
          <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{dismissed.length} event{dismissed.length > 1 ? "s" : ""} hidden</span>
          <button onClick={() => setDismissed([])} style={{ background: "none", border: "none", color: "var(--leaf)", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", padding: 0 }}>
            Show all →
          </button>
        </div>
      )}

      {filteredRecommendations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
          {dateFilters.length > 0 || timeFilters.length > 0 || sourceFilters.length > 0 || ageFilter !== null ? (
            <>
              <p style={{ fontSize: "1.1rem", fontWeight: 700 }}>No events match this filter.</p>
              <button onClick={() => { setDateFilters([]); setTimeFilters([]); setSourceFilters([]); setAgeFilter(null); }}
                style={{ padding: "10px 22px", background: "var(--leaf)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}>
                Clear all filters
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: "1.1rem", fontWeight: 700 }}>You've seen everything this weekend.</p>
              <p style={{ fontSize: "0.88rem", marginBottom: 16 }}>Reset to start fresh.</p>
              <button onClick={() => setDismissed([])} style={{ padding: "10px 22px", background: "var(--leaf)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}>
                Show all events
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {visibleEvents.map((event, idx) => {
            const color = AREA_COLORS[event.area] || "var(--leaf)";
            const isTop = idx === 0;
            return (
              <div
                key={event.id}
                style={{
                  background: "var(--white)",
                  border: isTop ? `2px solid ${color}` : "1.5px solid var(--line)",
                  borderRadius: 14,
                  padding: "20px 22px",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 16,
                  alignItems: "start",
                  position: "relative",
                }}
              >
                {isTop && (
                  <div style={{ position: "absolute", top: -11, left: 20, background: color, color: "#fff", fontSize: "0.68rem", fontWeight: 800, padding: "2px 10px", borderRadius: 20, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Best match
                  </div>
                )}
                <div>
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color, background: `${color}15`, padding: "2px 8px", borderRadius: 10 }}>
                      {event.area}
                    </span>
                    {event.free ? (
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--leaf)", background: "#f0f7f3", padding: "2px 8px", borderRadius: 10 }}>
                        FREE
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.7rem", color: "var(--muted)", background: "var(--band)", padding: "2px 8px", borderRadius: 10 }}>
                        {event.cost}
                      </span>
                    )}
                    <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                      Ages {event.ageMin}+
                      {age !== "" && (() => {
                        const diff = Number(age) - event.ageMin;
                        if (diff <= 2) return <span style={{ marginLeft: 4, color: "var(--leaf)", fontWeight: 700 }}>✓ Right age</span>;
                        if (diff <= 4) return null;
                        return <span style={{ marginLeft: 4, color: "var(--muted)" }}>(younger crowd)</span>;
                      })()}
                    </span>
                  </div>

                  <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: "1rem", color: "var(--ink)", display: "flex", alignItems: "center", gap: 6 }}>
                    {event.name}
                    {starredEvents.includes(event.id) && <span style={{ color: "#f59e0b", fontSize: "0.95rem" }}>★</span>}
                  </p>
                  {(event.date || event.time) ? (
                    <p style={{ margin: "0 0 4px", fontSize: "0.82rem", fontWeight: 700, color: color, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span>📅 {eventDateLabel(event)}{event.time ? ` · ${event.time}` : ""}</span>
                      {event.source === "Instagram" && (
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fff", background: "#c13584", padding: "1px 7px", borderRadius: 8 }}>
                          Instagram
                        </span>
                      )}
                      {event.live && event.source !== "Instagram" && (
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fff", background: "var(--leaf)", padding: "1px 7px", borderRadius: 8 }}>
                          LIVE
                        </span>
                      )}
                      {event.recurring && !event.live && (
                        <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--muted)", background: "var(--band)", padding: "1px 7px", borderRadius: 8 }}>
                          recurring · check venue
                        </span>
                      )}
                    </p>
                  ) : (
                    <p style={{ margin: "0 0 4px", fontSize: "0.78rem", fontWeight: 600, color: "#b45309", background: "#fef3c7", display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 10px", borderRadius: 8 }}>
                      ⚠ Date not confirmed — check with organiser
                    </p>
                  )}
                  <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: "var(--muted)" }}>
                    {event.provider} · {event.venue}
                    {proximityLabel(event, pincode) && (
                      <span style={{ marginLeft: 8, color: proximityLabel(event, pincode) === "Nearby" ? "var(--leaf)" : "var(--muted)", fontWeight: proximityLabel(event, pincode) === "Nearby" ? 700 : 400 }}>
                        · {proximityLabel(event, pincode)}
                      </span>
                    )}
                  </p>

                  {/* Builds */}
                  <p style={{ margin: "0 0 10px", fontSize: "0.8rem", color: "var(--ink)" }}>
                    <span style={{ fontWeight: 700 }}>Builds: </span>{event.builds.join(" · ")}
                  </p>

                  {/* Per-school pedagogy fit bars */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {ACTIVE_SCHOOLS.map((sk) => {
                      const s = multiSchoolScore(event).scores[sk];
                      return (
                        <div key={sk} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: SCHOOL_COLORS[sk], minWidth: 72 }}>
                            {SCHOOL_LABELS[sk]}
                          </span>
                          <div style={{ flex: 1, height: 4, background: "var(--band)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${s}%`, height: "100%", background: SCHOOL_COLORS[sk], borderRadius: 2, transition: "width 0.4s" }} />
                          </div>
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: SCHOOL_COLORS[sk], minWidth: 28 }}>{s}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 120 }}>
                  {event.free ? (
                    <button
                      onClick={() => handleRegister(event)}
                      style={{
                        padding: "9px 16px", fontWeight: 700, fontSize: "0.82rem",
                        background: "var(--leaf)", color: "var(--white)",
                        border: "none", borderRadius: 8, cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Register free →
                    </button>
                  ) : event.registrationUrl ? (
                    <a
                      href={event.registrationUrl} target="_blank" rel="noopener noreferrer"
                      style={{
                        padding: "9px 16px", fontWeight: 700, fontSize: "0.82rem",
                        background: color, color: "var(--white)",
                        border: "none", borderRadius: 8, cursor: "pointer",
                        textDecoration: "none", textAlign: "center",
                        whiteSpace: "nowrap", display: "block",
                      }}
                    >
                      Book / Register →
                    </a>
                  ) : event.instagramUrl ? (
                    <a
                      href={event.instagramUrl} target="_blank" rel="noopener noreferrer"
                      style={{
                        padding: "9px 16px", fontWeight: 700, fontSize: "0.82rem",
                        background: "#c13584", color: "#fff",
                        border: "none", borderRadius: 8, cursor: "pointer",
                        textDecoration: "none", textAlign: "center",
                        whiteSpace: "nowrap", display: "block",
                      }}
                    >
                      View post →
                    </a>
                  ) : null}
                  <button
                    onClick={() => handleLike(event.id, event.registrationUrl, event)}
                    style={{
                      padding: "7px 16px", fontWeight: 600, fontSize: "0.78rem",
                      background: liked.includes(event.id) ? "#f0f7f3" : "transparent",
                      color: liked.includes(event.id) ? "var(--leaf)" : "var(--muted)",
                      border: "1.5px solid var(--line)", borderRadius: 8, cursor: "pointer",
                    }}
                  >
                    {liked.includes(event.id) ? "✓ Saved" : "Looks good →"}
                  </button>
                  <button
                    onClick={() => handleDismiss(event.id, event)}
                    style={{
                      padding: "7px 16px", fontWeight: 600, fontSize: "0.78rem",
                      background: "transparent", color: "var(--muted)",
                      border: "1.5px solid var(--line)", borderRadius: 8, cursor: "pointer",
                    }}
                  >
                    Not for us
                  </button>
                  <button
                    onClick={() => toggleDeprioritize(event.id, event)}
                    title={deprioritized.includes(event.id) ? "Restore to top" : "Move to bottom"}
                    style={{
                      padding: "7px 14px", fontWeight: 600, fontSize: "0.78rem",
                      background: deprioritized.includes(event.id) ? "#f1f5f9" : "transparent",
                      color: "var(--muted)",
                      border: "1.5px solid var(--line)", borderRadius: 8, cursor: "pointer",
                    }}
                  >
                    {deprioritized.includes(event.id) ? "↑ Restore" : "↓ Bottom"}
                  </button>
                  <button
                    onClick={() => toggleStar(event.id, event)}
                    title={starredEvents.includes(event.id) ? "Unstar" : "Star this pick"}
                    style={{
                      padding: "7px 12px", fontWeight: 600, fontSize: "0.85rem",
                      background: starredEvents.includes(event.id) ? "#fef9c3" : "transparent",
                      color: starredEvents.includes(event.id) ? "#f59e0b" : "var(--muted)",
                      border: `1.5px solid ${starredEvents.includes(event.id) ? "#f59e0b" : "var(--line)"}`,
                      borderRadius: 8, cursor: "pointer",
                    }}
                  >
                    {starredEvents.includes(event.id) ? "★" : "☆"}
                  </button>
                  <button
                    onClick={() => { setNoteEditing(event.id); setNoteDraft(eventNotes[event.id] || ""); }}
                    title="Add note"
                    style={{
                      padding: "7px 12px", fontWeight: 600, fontSize: "0.78rem",
                      background: eventNotes[event.id] ? "#fef3c7" : "transparent",
                      color: eventNotes[event.id] ? "#92400e" : "var(--muted)",
                      border: `1.5px solid ${eventNotes[event.id] ? "#fcd34d" : "var(--line)"}`,
                      borderRadius: 8, cursor: "pointer",
                    }}
                  >
                    ✏
                  </button>
                </div>
                {/* Note display + inline edit */}
                {eventNotes[event.id] && noteEditing !== event.id && (
                  <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "#92400e", background: "#fef3c7", padding: "4px 10px", borderRadius: 6, display: "inline-block" }}>
                    📝 {eventNotes[event.id]}
                  </p>
                )}
                {noteEditing === event.id && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <input
                      autoFocus
                      value={noteDraft}
                      onChange={e => setNoteDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveNote(event.id, event); if (e.key === "Escape") setNoteEditing(null); }}
                      placeholder="e.g. outdoor · bring snacks · sold out as of Jun 25"
                      style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1.5px solid var(--line)", fontSize: "0.8rem" }}
                    />
                    <button onClick={() => saveNote(event.id, event)} style={{ padding: "6px 12px", background: "var(--leaf)", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>Save</button>
                    <button onClick={() => setNoteEditing(null)} style={{ padding: "6px 10px", background: "var(--band)", border: "none", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer" }}>✕</button>
                  </div>
                )}
              </div>
            );
          })}
          {visibleCount < displayedRecommendations.length && (
            <button
              onClick={() => setVisibleCount((c) => Math.min(c + 6, filteredRecommendations.length))}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--leaf)", fontWeight: 700, fontSize: "0.88rem",
                padding: "10px 0", textAlign: "center", width: "100%",
                textDecoration: "underline", textUnderlineOffset: 3,
              }}
            >
              Show more ({displayedRecommendations.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
