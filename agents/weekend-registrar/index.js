/**
 * Weekend Registrar Agent
 *
 * Finds free kids/family events on Urbanaut this weekend that align with
 * the child's school pedagogy, then auto-fills and submits the registration.
 *
 * Usage:
 *   node index.js                  — find + register best match
 *   node index.js --dry-run        — find only, don't submit
 *   node index.js --pincode 560001 — override pincode from profile
 *   node index.js --headed         — show browser window (default: headless)
 */

import Anthropic from "@anthropic-ai/sdk";
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import readline from "readline";

const __dir = dirname(fileURLToPath(import.meta.url));

// ─── Config ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const HEADED = args.includes("--headed");
const pincodeArg = args.find((a, i) => args[i - 1] === "--pincode");

const profile = JSON.parse(readFileSync(join(__dir, "profile.json"), "utf8"));
if (pincodeArg) profile.location.pincode = pincodeArg;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error("❌  Set ANTHROPIC_API_KEY environment variable first.");
  process.exit(1);
}

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Pedagogy pillars — used to score/select the most aligned event
const SCHOOL_PILLARS = {
  montessori: ["hands-on", "self-directed", "practical-life", "sensorial", "nature", "real-tools", "independence"],
  cfl: ["inquiry", "silence", "nature", "self-knowledge", "dialogue", "no-competition", "inner-life", "ecological"],
  valley: ["arts", "ecology", "nature", "mixed-age", "dialogue", "open-classroom", "music", "pottery", "heritage"],
  creative: ["whole-child", "emotional", "spiritual", "creative-freedom", "small-group", "eco", "expressive", "story"],
};

// Bangalore pincodes → neighbourhood (expand as needed)
const PINCODE_MAP = {
  "560001": "MG Road / Brigade Road",
  "560008": "Sadashivanagar / Hebbal",
  "560011": "Jayanagar",
  "560016": "Koramangala",
  "560017": "JP Nagar",
  "560029": "Indiranagar",
  "560034": "HSR Layout",
  "560037": "Whitefield",
  "560043": "HBR Layout / Kalyan Nagar",
  "560068": "Bellandur / Sarjapur",
  "560076": "Yelahanka",
  "560078": "Kanakapura Road / JP Nagar",
  "560102": "Whitefield / ITPL",
  "560103": "Electronic City",
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function log(msg, emoji = "→") {
  console.log(`${emoji}  ${msg}`);
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

function getWeekendDates() {
  const now = new Date();
  const day = now.getDay();
  const daysToSat = (6 - day + 7) % 7 || 7;
  const sat = new Date(now); sat.setDate(now.getDate() + daysToSat);
  const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
  const fmt = (d) => d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  return { sat: fmt(sat), sun: fmt(sun), satDate: sat, sunDate: sun };
}

// ─── Step 1: Discover events via Claude + Urbanaut ─────────────────────────────

async function discoverEvents(page) {
  log("Opening Urbanaut Bangalore events page…");
  await page.goto("https://urbanaut.app/experience-bengaluru/things-to-do", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(3000);

  // Also check the family events page
  const pages = [
    "https://urbanaut.app/experience-bengaluru/things-to-do",
    "https://urbanaut.app/featured-events/family-events-bangalore",
    "https://urbanaut.app/featured-forkids/summer-activities",
  ];

  let allText = "";
  for (const url of pages) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(2000);
      const text = await page.evaluate(() => document.body.innerText);
      allText += `\n\n=== ${url} ===\n` + text.slice(0, 4000);
    } catch {
      // page failed to load, skip
    }
  }

  return allText;
}

// ─── Step 2: Claude selects the best event ─────────────────────────────────────

async function selectBestEvent(pageText, weekend) {
  const pillars = SCHOOL_PILLARS[profile.preferences.pedagogy] || [];
  const neighbourhood = PINCODE_MAP[profile.location.pincode] || profile.location.neighbourhood;

  const prompt = `You are a smart family activity curator for Bangalore.

CHILD PROFILE:
- Age: ${profile.child.age} years
- School philosophy: ${profile.preferences.pedagogy.toUpperCase()}
- School pillars: ${pillars.join(", ")}
- Location: ${neighbourhood}, Bangalore (pincode ${profile.location.pincode})

WEEKEND: ${weekend.sat} and ${weekend.sun}

SCRAPED URBANAUT CONTENT:
${pageText}

TASK:
1. Find FREE events/activities for kids or families from the content above.
2. Score each by how well it matches the school pillars listed.
3. Filter for age-appropriate (child is ${profile.child.age} years old).
4. Pick the SINGLE best match.

Respond as JSON only, no markdown:
{
  "selected": {
    "name": "Event name",
    "provider": "Who runs it",
    "venue": "Address or area",
    "date": "When this weekend",
    "url": "Direct URL to event page if found, else null",
    "cost": "Free / price",
    "pedagogyMatch": ["list", "of", "matching", "pillars"],
    "score": 85,
    "reason": "Why this is the best match in 1 sentence"
  },
  "alternatives": [
    { "name": "...", "score": 70, "reason": "..." }
  ]
}

If no free events are found, set selected to null and explain in a "message" field.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content[0].text.trim();
  try {
    return JSON.parse(raw);
  } catch {
    // Try to extract JSON block
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Claude did not return valid JSON: " + raw.slice(0, 200));
  }
}

// ─── Step 3: Navigate to event page ────────────────────────────────────────────

async function findEventPage(page, event) {
  log(`Searching for event page: "${event.name}"…`);

  if (event.url) {
    log(`Using direct URL: ${event.url}`);
    await page.goto(event.url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(2000);
    return;
  }

  // Search Urbanaut for the event by name
  await page.goto("https://urbanaut.app/experience-bengaluru/things-to-do", {
    waitUntil: "domcontentloaded",
    timeout: 20000,
  });
  await page.waitForTimeout(2000);

  // Try clicking on the event link matching the name
  const clicked = await page.evaluate((name) => {
    const links = Array.from(document.querySelectorAll("a, [role='link']"));
    const match = links.find((el) => el.innerText?.toLowerCase().includes(name.toLowerCase().split(" ")[0]));
    if (match) { match.click(); return true; }
    return false;
  }, event.name);

  if (!clicked) {
    log(`Couldn't find direct link — using family events page`, "⚠");
    await page.goto("https://urbanaut.app/featured-events/family-events-bangalore", {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
  }
  await page.waitForTimeout(2000);
}

// ─── Step 4: Claude understands the registration form ─────────────────────────

async function analyseRegistrationForm(page) {
  const pageContent = await page.evaluate(() => ({
    text: document.body.innerText.slice(0, 3000),
    url: window.location.href,
    inputs: Array.from(document.querySelectorAll("input, select, textarea")).map((el) => ({
      type: el.type || el.tagName.toLowerCase(),
      name: el.name,
      id: el.id,
      placeholder: el.placeholder,
      label: document.querySelector(`label[for="${el.id}"]`)?.innerText || "",
      required: el.required,
    })),
    buttons: Array.from(document.querySelectorAll("button, [type='submit']")).map((b) => b.innerText?.trim()).filter(Boolean),
  }));

  const prompt = `You are analysing a registration form on this page: ${pageContent.url}

PAGE TEXT (first 3000 chars):
${pageContent.text}

FORM INPUTS FOUND:
${JSON.stringify(pageContent.inputs, null, 2)}

BUTTONS FOUND: ${pageContent.buttons.join(", ")}

USER PROFILE TO FILL:
- Parent name: ${profile.parent.name}
- Email: ${profile.parent.email}
- Phone: ${profile.parent.phone || "(not set — leave blank)"}
- Child name: ${profile.child.name || "(not set)"}
- Child age: ${profile.child.age}

TASK: Return a JSON array of fill instructions. Each instruction has:
- "selector": CSS selector for the field (use id, name, or placeholder to target)
- "value": what to type
- "action": "fill" | "select" | "click" | "check"

Also return:
- "submitSelector": CSS selector for the submit/register button
- "hasForm": true/false
- "isAlreadyBooked": true if page shows this event is already registered/full
- "notes": any warnings

Respond as JSON only, no markdown.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content[0].text.trim();
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return { hasForm: false, notes: "Could not parse form structure: " + raw.slice(0, 100) };
  }
}

// ─── Step 5: Fill and submit the form ─────────────────────────────────────────

async function fillAndSubmit(page, formPlan) {
  if (!formPlan.hasForm) {
    log("No registration form found on this page", "⚠");
    return false;
  }

  if (formPlan.isAlreadyBooked) {
    log("Event already registered or full", "✓");
    return true;
  }

  log(`Filling ${formPlan.instructions?.length || 0} form fields…`);

  for (const step of formPlan.instructions || []) {
    try {
      if (step.action === "fill") {
        await page.fill(step.selector, step.value);
        log(`  Filled "${step.selector}" → "${step.value}"`);
      } else if (step.action === "select") {
        await page.selectOption(step.selector, step.value);
        log(`  Selected "${step.value}" in "${step.selector}"`);
      } else if (step.action === "click") {
        await page.click(step.selector);
        log(`  Clicked "${step.selector}"`);
      } else if (step.action === "check") {
        await page.check(step.selector);
        log(`  Checked "${step.selector}"`);
      }
      await page.waitForTimeout(400);
    } catch (err) {
      log(`  Could not fill "${step.selector}": ${err.message}`, "⚠");
    }
  }

  return true;
}

// ─── Step 6: Confirm + submit ──────────────────────────────────────────────────

async function confirmAndSubmit(page, formPlan, event, dryRun) {
  if (dryRun) {
    log("DRY RUN — form filled but not submitted.", "🔍");
    log(`Would register: ${event.name} at ${event.venue}`);
    return;
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`📋  Ready to register:`);
  console.log(`    Event   : ${event.name}`);
  console.log(`    Provider: ${event.provider}`);
  console.log(`    Venue   : ${event.venue}`);
  console.log(`    Date    : ${event.date}`);
  console.log(`    Cost    : ${event.cost}`);
  console.log(`    For     : ${profile.parent.name} / child age ${profile.child.age}`);
  console.log("─────────────────────────────────────────\n");

  const confirm = await ask("Submit registration? (yes/no): ");
  if (confirm.toLowerCase() !== "yes" && confirm.toLowerCase() !== "y") {
    log("Registration cancelled.", "✕");
    return;
  }

  if (formPlan.submitSelector) {
    try {
      await page.click(formPlan.submitSelector);
      log("Clicked submit button…");
      await page.waitForTimeout(3000);

      // Check for success signals
      const successText = await page.evaluate(() => document.body.innerText.toLowerCase());
      const success = ["thank you", "confirmed", "registered", "success", "booking"].some((s) =>
        successText.includes(s)
      );

      if (success) {
        log("Registration confirmed!", "✅");
        saveRegistration(event);
      } else {
        log("Submitted — please verify in the browser window.", "⚠");
      }
    } catch (err) {
      log(`Submit failed: ${err.message}`, "✕");
    }
  } else {
    log("No submit button found — please click manually in the browser.", "⚠");
    await ask("Press Enter when done…");
  }
}

// ─── Persist registration to profile ──────────────────────────────────────────

function saveRegistration(event) {
  const profilePath = join(__dir, "profile.json");
  const data = JSON.parse(readFileSync(profilePath, "utf8"));
  if (!data.registered) data.registered = [];
  data.registered.push({
    id: event.name.toLowerCase().replace(/\s+/g, "-"),
    name: event.name,
    venue: event.venue,
    date: event.date,
    registeredAt: new Date().toISOString(),
  });
  writeFileSync(profilePath, JSON.stringify(data, null, 2));
  log("Saved to profile.json → registered[]", "💾");
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const weekend = getWeekendDates();
  const neighbourhood = PINCODE_MAP[profile.location.pincode] || profile.location.neighbourhood;

  console.log("\n🧭  Weekend Registrar Agent");
  console.log(`   Pincode    : ${profile.location.pincode} (${neighbourhood})`);
  console.log(`   School     : ${profile.preferences.pedagogy.toUpperCase()}`);
  console.log(`   Child age  : ${profile.child.age}`);
  console.log(`   Weekend    : ${weekend.sat} & ${weekend.sun}`);
  console.log(`   Mode       : ${DRY_RUN ? "DRY RUN" : "LIVE"} · ${HEADED ? "Headed" : "Headless"}`);
  console.log("");

  const browser = await chromium.launch({ headless: !HEADED, slowMo: HEADED ? 200 : 0 });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    // Step 1: Scrape Urbanaut
    log("Discovering events on Urbanaut…", "🔍");
    const rawContent = await discoverEvents(page);

    // Step 2: Claude picks best event
    log("Asking Claude to select the best pedagogy-aligned free event…", "🤖");
    const selection = await selectBestEvent(rawContent, weekend);

    if (!selection.selected) {
      log(selection.message || "No free events found this weekend.", "😔");
      await browser.close();
      return;
    }

    const event = selection.selected;
    console.log("\n🎯  Best match:");
    console.log(`   ${event.name}`);
    console.log(`   ${event.provider} · ${event.venue}`);
    console.log(`   ${event.date} · ${event.cost}`);
    console.log(`   Pedagogy match: ${event.pedagogyMatch?.join(", ") || "—"} (score: ${event.score}%)`);
    console.log(`   Why: ${event.reason}`);

    if (selection.alternatives?.length) {
      console.log("\n   Alternatives considered:");
      selection.alternatives.forEach((a) => console.log(`   • ${a.name} (${a.score}%) — ${a.reason}`));
    }
    console.log("");

    // Step 3: Navigate to event page
    log("Navigating to event page…", "🌐");
    await findEventPage(page, event);

    // Step 4: Analyse the form
    log("Analysing registration form…", "🔍");
    const formPlan = await analyseRegistrationForm(page);

    if (formPlan.notes) log(`Form notes: ${formPlan.notes}`, "ℹ");

    if (!formPlan.hasForm) {
      log("No registration form found. Opening page for manual registration.", "⚠");
      if (!HEADED) {
        log(`Visit manually: ${event.url || "https://urbanaut.app/featured-events/family-events-bangalore"}`);
      } else {
        await ask("No form found — press Enter to close browser…");
      }
      await browser.close();
      return;
    }

    // Step 5: Fill the form
    await fillAndSubmit(page, formPlan);

    // Step 6: Confirm + submit
    await confirmAndSubmit(page, formPlan, event, DRY_RUN);

  } catch (err) {
    console.error("❌  Agent error:", err.message);
    if (HEADED) await ask("Press Enter to close…");
  } finally {
    await browser.close();
  }
}

main();
