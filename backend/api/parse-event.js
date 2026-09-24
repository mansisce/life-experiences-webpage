/**
 * parse-event.js — extract a structured event from freeform text
 * (Instagram captions, WhatsApp forwards, flyer text, etc.)
 *
 * Uses Groq (free) — model: llama-3.3-70b-versatile
 */

import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Today's date injected so the model can resolve "this Saturday", "next week" etc.
function todayStr() {
  return new Date().toISOString().slice(0, 10); // "2026-06-22"
}

const SYSTEM = () => `You are an event data extractor for a Bangalore family events app.
Today's date is ${todayStr()}.
Given freeform text (Instagram caption, WhatsApp message, flyer copy, etc.),
extract UPCOMING event details and return ONLY a JSON object — no markdown, no explanation.

CRITICAL RULES:
1. registrationUrl: ONLY set this to a real booking/ticketing URL found in the caption text
   (bookmyshow, insider.in, allevents.in, eventbrite, craftymeets.com, a venue website, a Google Form link, etc.)
   Do NOT use the Instagram post URL here — that goes in instagramUrl.
   If no booking URL is in the text, set registrationUrl to null.
2. instagramUrl: the Instagram post URL passed to you (if any).
3. venue: extract the physical venue name and area/locality from the caption. Be specific —
   "Ranga Shankara, JP Nagar" not just "Bangalore". If not mentioned, set null.
4. date: resolve relative dates using today (${todayStr()}).
   "this Saturday" → the coming Saturday's ISO date.
   "next weekend" → the Saturday after that.
   If you see a past date (before today), set date to null — it's probably an old post.
   Use "YYYY-MM-DD" format for specific dates, or "sat"/"sun" if only day-of-week is given.
5. Only extract events that seem to be happening in the FUTURE (after today).
   If the event clearly already happened, return null for the entire response.
6. ageMin: minimum age in years. Default 0 if not mentioned.
7. free: true only if explicitly "free entry" or "no registration fee". false otherwise.
8. cost: string like "₹500" or "Free" or "₹200–₹500". null if unknown.
9. area: one of "Music & Movement", "Story & Culture", "Nature & Science",
   "Creative & Making", "Outdoor & Active", "Games & Strategy".
10. pedagogyTags: pick from: hands-on, inquiry, story, aesthetic-sense, ecological,
    practical-life, expression, community, dialogue, imagination, rhythm,
    physical-development, embodied-learning, cultural-roots, heritage, sensitivity,
    inner-life, social, outdoor-learning, nature-connection, making, tactile,
    concentration, creative-expression, observation, patience, self-regulation.
11. builds: 1–3 short strings like "Fine motor skills", "Scientific curiosity".
12. recurring: true only if caption clearly says "every week" or "every month".

Return EXACTLY this shape (no extra fields):
{
  "name": "...",
  "provider": "organiser / venue name",
  "venue": "Venue Name, Locality, Bangalore",
  "area": "...",
  "date": "YYYY-MM-DD or sat/sun or null",
  "time": "10:00 AM – 12:00 PM or null",
  "free": false,
  "cost": "₹500 or Free or null",
  "ageMin": 0,
  "registrationUrl": "https://... or null",
  "recurring": false,
  "pedagogyTags": [],
  "builds": []
}

If the event has already happened or there is no event in the text, return exactly: null`;

function isRateLimited(e) {
  return e?.status === 429 || (e?.message || "").includes("rate_limit_exceeded") || (e?.message || "").includes("quota");
}

function parseRaw(raw) {
  if (!raw) throw new Error("Empty LLM response");
  const json = raw.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  if (json === "null" || json === "") return null;
  const parsed = JSON.parse(json);
  return parsed?.name ? parsed : null;
}

// ── Groq (primary — free, fast) ───────────────────────────────────────────────

async function callGroq(userMsg) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw Object.assign(new Error("GROQ_API_KEY not set"), { status: 429 }); // skip to fallback
  const client = new Groq({ apiKey: key });
  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 700,
    temperature: 0.1,
    messages: [
      { role: "system", content: SYSTEM() },
      { role: "user", content: userMsg },
    ],
  });
  return completion.choices[0]?.message?.content;
}

// ── Gemini Flash (fallback — free, 1500 req/day) ──────────────────────────────

async function callGemini(userMsg) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set — get a free key at aistudio.google.com");
  const genai = new GoogleGenerativeAI(key);
  const model = genai.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await model.generateContent(`${SYSTEM()}\n\n---\n\n${userMsg}`);
      return result.response.text();
    } catch (e) {
      const msg = e?.message || "";
      const retryMatch = msg.match(/retry in ([\d.]+)s/);
      if (isRateLimited(e) || msg.includes("Too Many Requests")) {
        const waitMs = retryMatch ? parseFloat(retryMatch[1]) * 1000 + 1000 : 30_000;
        console.warn(`[parse-event] Gemini 429 — waiting ${Math.round(waitMs/1000)}s (attempt ${attempt+1}/3)`);
        await new Promise(r => setTimeout(r, waitMs));
      } else {
        throw e;
      }
    }
  }
  throw new Error("Gemini rate limit exceeded after retries");
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function parseEventFromText(text, instagramUrl = null) {
  const userMsg = instagramUrl
    ? `Instagram post URL: ${instagramUrl}\n\nCaption:\n${text}`
    : text;

  let raw;
  try {
    raw = await callGroq(userMsg);
    console.log("[parse-event] used Groq");
  } catch (groqErr) {
    const msg = groqErr?.message || "";
    const shouldFallback = isRateLimited(groqErr) || msg.includes("Connection error") || msg.includes("fetch") || msg.includes("ECONNREFUSED") || msg.includes("network");
    if (shouldFallback) {
      console.warn(`[parse-event] Groq failed (${msg.slice(0, 60)}) — falling back to Gemini Flash`);
      try {
        raw = await callGemini(userMsg);
        console.log("[parse-event] used Gemini");
      } catch (geminiErr) {
        throw new Error(`Both providers failed — Groq: ${msg.slice(0,60)} | Gemini: ${geminiErr.message?.slice(0,60)}`);
      }
    } else {
      throw groqErr;
    }
  }

  const parsed = parseRaw(raw);
  if (!parsed) return null;

  // Drop past events
  if (parsed.date?.match(/^\d{4}-\d{2}-\d{2}$/) && parsed.date < todayStr()) return null;

  parsed.instagramUrl = instagramUrl || null;
  const slug = parsed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const datePart = parsed.date ? `-${parsed.date.replace(/[^a-z0-9]/g, "")}` : "";
  parsed.id = `ig-${slug}${datePart}-${Date.now().toString(36)}`;
  parsed.live = true;
  parsed.source = "Instagram";
  parsed.venueZone = "central";

  return parsed;
}
