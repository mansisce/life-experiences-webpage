/**
 * whatsapp-chat.js — AI chat handler for WhatsApp integration
 *
 * POST /chat  { message, sessionId, from }
 *   → { reply }   (plain text, WhatsApp-friendly)
 *
 * Intents handled:
 *   recommend   — "what's on this weekend?" → top ranked events
 *   detail      — "tell me about [event]"   → venue, cost, how to book
 *   add_event   — "add this event: [caption]" → parse + add to ig-events.json
 *   reminder    — "what did I save?"        → starred / registered events
 *   general     — anything else             → helpful reply
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";
import { parseEventFromText } from "./parse-event.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IG_STORE  = path.join(__dirname, "data", "ig-events.json");

let groq = null;
function getGroq() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

// ── In-memory session context (survives server restart only if you add Redis) ──
const sessions = {};

// ── Human takeover — durable in Neo4j since Vercel functions don't stay warm ────

const ADMIN_COMMAND_RE = /^#(pause|resume)\s+(\+?\d{6,15})/i;

function normalizePhone(p) {
  return (p || "").replace(/\D/g, "");
}

async function isPaused(phone, neo4jDriver) {
  if (!neo4jDriver) return false;
  const s = neo4jDriver.session();
  try {
    const r = await s.run("MATCH (c:Conversation {phone: $phone}) RETURN c.paused AS paused", { phone });
    return r.records[0]?.get("paused") === true;
  } finally { s.close(); }
}

async function setPaused(phone, paused, neo4jDriver) {
  const s = neo4jDriver.session();
  try {
    await s.run(
      "MERGE (c:Conversation {phone: $phone}) SET c.paused = $paused, c.updatedAt = datetime()",
      { phone, paused }
    );
  } finally { s.close(); }
}

async function handleAdminCommand(message, neo4jDriver) {
  const match = message.trim().match(ADMIN_COMMAND_RE);
  if (!match) return null;
  const phone = normalizePhone(match[2]);
  const paused = match[1].toLowerCase() === "pause";
  await setPaused(phone, paused, neo4jDriver);
  return paused
    ? `🤖⏸ Bot paused for ${phone}. Reply to them directly in WhatsApp. Send *#resume ${phone}* when you're done.`
    : `🤖▶️ Bot resumed for ${phone} — it'll auto-reply again.`;
}

// ── Intent detection ──────────────────────────────────────────────────────────

const INTENT_PROMPT = `You are classifying a WhatsApp message from a Bangalore parent looking for weekend activities for their young child.

Classify the message into exactly one of these intents:
- recommend    : wants event suggestions for this weekend
- detail       : asking about a specific event (venue, cost, age, how to book)
- add_event    : pasting an Instagram caption or event text to be added
- reminder     : wants to see their saved/starred events
- general      : anything else (greeting, question about the app, etc.)

Reply with ONLY the intent word, nothing else.`;

async function detectIntent(message) {
  const resp = await getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 10,
    messages: [
      { role: "system", content: INTENT_PROMPT },
      { role: "user",   content: message },
    ],
  });
  return resp.choices[0].message.content.trim().toLowerCase();
}

// ── Event data helpers ────────────────────────────────────────────────────────

async function loadAllEvents(neo4jDriver) {
  const events = [];

  // Neo4j catalogue
  if (neo4jDriver) {
    const s = neo4jDriver.session();
    try {
      const result = await s.run(`
        MATCH (e:Event)-[:BY]->(p:Provider), (e)-[:IN_AREA]->(a:Area), (e)-[:FROM_SOURCE]->(src:Source)
        RETURN e.id AS id, e.name AS name, e.date AS date, e.time AS time,
               e.venue AS venue, e.cost AS cost, e.free AS free,
               e.url AS url, e.ageMin AS ageMin,
               p.name AS provider, a.name AS area, src.name AS source
      `);
      for (const r of result.records) {
        events.push({
          id: r.get("id"), name: r.get("name"), date: r.get("date"),
          time: r.get("time"), venue: r.get("venue"), cost: r.get("cost"),
          free: r.get("free"), url: r.get("url"), ageMin: r.get("ageMin"),
          provider: r.get("provider"), area: r.get("area"), source: r.get("source"),
        });
      }
    } finally { s.close(); }
  }

  // Instagram events from file
  try {
    const raw = JSON.parse(await fs.readFile(IG_STORE, "utf8"));
    (raw.events || []).forEach(e => events.push({ ...e, source: e.source || "Instagram" }));
  } catch { /* no file */ }

  return events;
}

function formatEventForWhatsApp(e, index) {
  const lines = [];
  if (index !== undefined) lines.push(`*${index + 1}. ${e.name}*`);
  else lines.push(`*${e.name}*`);

  if (e.date || e.time) lines.push(`📅 ${[e.date, e.time].filter(Boolean).join(" · ")}`);
  if (e.venue)          lines.push(`📍 ${e.venue}`);
  if (e.cost || e.free) lines.push(`💰 ${e.free ? "Free" : e.cost}`);
  if (e.provider)       lines.push(`🏷 ${e.provider}`);
  if (e.url || e.registrationUrl) lines.push(`🔗 ${e.url || e.registrationUrl}`);
  return lines.join("\n");
}

// ── Intent handlers ───────────────────────────────────────────────────────────

async function handleRecommend(message, neo4jDriver) {
  const events = await loadAllEvents(neo4jDriver);
  if (!events.length) return "No events loaded yet — try again after the Sunday sync! 🌀";

  // Simple score: prefer future/weekend events, free first
  const today = new Date().toISOString().slice(0, 10);
  const scored = events
    .filter(e => !e.date || e.date >= today || /sat|sun|weekend/i.test(e.date || ""))
    .slice(0, 8);

  if (!scored.length) return "No upcoming events found right now. Check back on Sunday after the weekly sync!";

  const top5 = scored.slice(0, 5);
  const lines = ["Here are this weekend's top picks for your little one 🎉\n"];
  top5.forEach((e, i) => lines.push(formatEventForWhatsApp(e, i), ""));
  lines.push("Reply with a number (e.g. *2*) to get full details on any event.");
  return lines.join("\n");
}

async function handleDetail(message, neo4jDriver, sessionCtx) {
  const events = await loadAllEvents(neo4jDriver);

  // Check if message is a number referencing last recommendation
  const numMatch = message.trim().match(/^(\d+)$/);
  if (numMatch && sessionCtx?.lastEvents) {
    const idx = parseInt(numMatch[1]) - 1;
    const ev = sessionCtx.lastEvents[idx];
    if (ev) return `Here's everything about *${ev.name}*:\n\n${formatEventForWhatsApp(ev)}`;
  }

  // Search by name
  const query = message.toLowerCase().replace(/tell me about|details for|info on/gi, "").trim();
  const match = events.find(e => e.name?.toLowerCase().includes(query));
  if (match) return formatEventForWhatsApp(match);

  return "I couldn't find that event. Try asking 'what's on this weekend?' to see the full list first.";
}

async function handleAddEvent(message) {
  // Strip common prefixes
  const caption = message.replace(/^(add this event|add event|new event):?\s*/i, "").trim();
  if (caption.length < 30) {
    return "Please paste the full event description or Instagram caption after 'add this event:' and I'll add it to the list 📋";
  }
  try {
    const event = await parseEventFromText(caption, null);
    if (!event || !event.name) return "I couldn't find event details in that text. Make sure it includes a name, date, and venue.";

    // Append to ig-events.json
    let store = { events: [], syncedAt: null, bioLinks: {} };
    try { store = JSON.parse(await fs.readFile(IG_STORE, "utf8")); } catch { /* first */ }

    const events = Array.isArray(store) ? store : (store.events || []);
    events.push({ ...event, source: "WhatsApp", addedAt: new Date().toISOString() });
    await fs.mkdir(path.dirname(IG_STORE), { recursive: true });
    await fs.writeFile(IG_STORE, JSON.stringify({ ...store, events }, null, 2));

    return `✅ Added! *${event.name}*\n${formatEventForWhatsApp(event)}\n\nIt will appear in Weekend Picks shortly.`;
  } catch (e) {
    return `Couldn't parse that event: ${e.message}. Try pasting just the caption text.`;
  }
}

async function handleReminder(neo4jDriver) {
  if (!neo4jDriver) return "Connect the backend to see your saved events.";
  const s = neo4jDriver.session();
  try {
    const result = await s.run(`
      MATCH (e:Event) WHERE e.starred = true OR e.note IS NOT NULL
      RETURN e.name AS name, e.date AS date, e.time AS time,
             e.venue AS venue, e.url AS url, e.starred AS starred, e.note AS note
      LIMIT 10
    `);
    if (!result.records.length) return "You haven't starred any events yet! Open the app and tap ☆ on events you want to remember.";

    const lines = ["⭐ *Your saved events:*\n"];
    for (const r of result.records) {
      lines.push(`*${r.get("name")}*`);
      if (r.get("date")) lines.push(`📅 ${r.get("date")}${r.get("time") ? " · " + r.get("time") : ""}`);
      if (r.get("venue")) lines.push(`📍 ${r.get("venue")}`);
      if (r.get("note")) lines.push(`📝 ${r.get("note")}`);
      lines.push("");
    }
    return lines.join("\n");
  } finally { s.close(); }
}

async function handleGeneral(message) {
  const resp = await getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 200,
    messages: [
      {
        role: "system",
        content: `You are a friendly assistant for Weekend Picks — a curated list of Bangalore weekend events for families with young children (ages 2–8).
Keep replies short and WhatsApp-friendly (no markdown except *bold*).
You help parents discover events, save favourites, and get reminders.
If asked what you can do, say: "Ask me *what's on this weekend?*, send an event caption to add it, or say *my saved events* to see your list 📋"`,
      },
      { role: "user", content: message },
    ],
  });
  return resp.choices[0].message.content.trim();
}

// ── Main chat handler ─────────────────────────────────────────────────────────

export async function handleWhatsAppMessage({ message, sessionId = "default", neo4jDriver }) {
  if (!message?.trim()) return { reply: "Hi! Ask me *what's on this weekend?* to get started 🎉" };

  const senderPhone = normalizePhone(sessionId);
  const ownerPhone = normalizePhone(process.env.OWNER_PHONE);

  if (ownerPhone && senderPhone === ownerPhone) {
    const adminReply = await handleAdminCommand(message, neo4jDriver);
    if (adminReply) return { reply: adminReply, intent: "admin" };
  }

  if (await isPaused(senderPhone, neo4jDriver)) {
    console.log(`[whatsapp] sessionId=${sessionId} paused — skipping auto-reply`);
    return { reply: "", intent: "paused" };
  }

  const ctx = sessions[sessionId] || {};
  sessions[sessionId] = ctx;

  const intent = await detectIntent(message);
  console.log(`[whatsapp] sessionId=${sessionId} intent=${intent} msg="${message.slice(0, 60)}"`);

  let reply;
  if (intent === "recommend") {
    const events = await loadAllEvents(neo4jDriver);
    ctx.lastEvents = events.slice(0, 5);
    reply = await handleRecommend(message, neo4jDriver);
  } else if (intent === "detail") {
    reply = await handleDetail(message, neo4jDriver, ctx);
  } else if (intent === "add_event") {
    reply = await handleAddEvent(message);
  } else if (intent === "reminder") {
    reply = await handleReminder(neo4jDriver);
  } else {
    reply = await handleGeneral(message);
  }

  ctx.lastIntent = intent;
  return { reply, intent };
}
