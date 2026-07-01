/**
 * Reward Management System — Express router backed by Neo4j
 *
 * POST /rewards/auth/setup      → set passcode (first time)
 * POST /rewards/auth/verify     → verify passcode
 *
 * GET  /rewards/categories      → list categories
 * POST /rewards/categories      → create custom category
 *
 * GET  /rewards/goals           → list all goals
 * POST /rewards/goals           → create goal
 * GET  /rewards/goals/:id       → goal detail with logs, milestones, rewards
 * PUT  /rewards/goals/:id       → update goal
 * DELETE /rewards/goals/:id     → delete goal
 *
 * POST /rewards/goals/:id/log   → add/update daily log
 * GET  /rewards/goals/:id/logs  → get all logs
 *
 * POST /rewards/goals/:id/milestones → add milestone
 * DELETE /rewards/milestones/:id     → delete milestone
 *
 * POST /rewards/goals/:id/rewards    → add reward linked to goal or milestone
 * PUT  /rewards/rewards/:id/claim    → claim a reward
 * PUT  /rewards/rewards/:id/receive  → mark reward as received
 */

import { Router } from "express";
import crypto from "crypto";

const router = Router();

const DEFAULT_CATEGORIES = [
  { id: "cat-food",     name: "Food and Kitchen", icon: "🍽️", color: "#f59e0b" },
  { id: "cat-health",   name: "Health",            icon: "💪", color: "#10b981" },
  { id: "cat-house",    name: "House",             icon: "🏠", color: "#6366f1" },
  { id: "cat-learning", name: "Learning",          icon: "📚", color: "#3b82f6" },
  { id: "cat-creative", name: "Creative",          icon: "🎨", color: "#ec4899" },
  { id: "cat-finance",  name: "Finance",           icon: "💰", color: "#84cc16" },
];

function hash(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function uid() {
  return crypto.randomUUID();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

router.post("/auth/setup", async (req, res) => {
  const { passcode } = req.body;
  if (!passcode) return res.status(400).json({ error: "passcode required" });
  const s = req.neo4j.session();
  try {
    // Check if already set
    const existing = await s.run(
      `MATCH (c:RewardsConfig) RETURN c.passcodeHash AS h LIMIT 1`
    );
    if (existing.records.length) {
      return res.status(409).json({ error: "Passcode already set. Use verify." });
    }
    const passcodeHash = hash(passcode);
    await s.run(
      `CREATE (c:RewardsConfig {passcodeHash: $passcodeHash, createdAt: datetime()})`,
      { passcodeHash }
    );
    // Seed default categories
    for (const cat of DEFAULT_CATEGORIES) {
      await s.run(
        `MERGE (c:Category {id: $id})
         ON CREATE SET c.name = $name, c.icon = $icon, c.color = $color, c.isCustom = false`,
        cat
      );
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

router.post("/auth/verify", async (req, res) => {
  const { passcode } = req.body;
  if (!passcode) return res.status(400).json({ error: "passcode required" });
  const s = req.neo4j.session();
  try {
    const result = await s.run(
      `MATCH (c:RewardsConfig) RETURN c.passcodeHash AS h LIMIT 1`
    );
    if (!result.records.length) {
      return res.status(404).json({ error: "not_setup", message: "No passcode set yet." });
    }
    const stored = result.records[0].get("h");
    if (hash(passcode) !== stored) {
      return res.status(401).json({ error: "wrong_passcode" });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// ─── Categories ───────────────────────────────────────────────────────────────

router.get("/categories", async (req, res) => {
  const s = req.neo4j.session();
  try {
    const result = await s.run(`MATCH (c:Category) RETURN c ORDER BY c.isCustom, c.name`);
    res.json(result.records.map(r => r.get("c").properties));
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

router.post("/categories", async (req, res) => {
  const { name, icon = "⭐", color = "#8b5cf6" } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  const s = req.neo4j.session();
  try {
    const id = `cat-custom-${uid()}`;
    await s.run(
      `CREATE (c:Category {id: $id, name: $name, icon: $icon, color: $color, isCustom: true})`,
      { id, name, icon, color }
    );
    res.json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// ─── Goals ────────────────────────────────────────────────────────────────────

router.get("/goals", async (req, res) => {
  const s = req.neo4j.session();
  try {
    const result = await s.run(`
      MATCH (g:Goal)
      OPTIONAL MATCH (g)-[:BELONGS_TO]->(cat:Category)
      OPTIONAL MATCH (g)-[:HAS_LOG]->(l:DailyLog)
      RETURN g, cat,
             collect(DISTINCT l) AS logs
      ORDER BY g.createdAt DESC
    `);
    const goals = result.records.map(r => {
      const g = r.get("g").properties;
      const cat = r.get("cat")?.properties || null;
      const logs = r.get("logs").map(l => l.properties);
      return { ...g, category: cat, streak: computeStreak(logs, g), logs };
    });
    res.json(goals);
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

router.post("/goals", async (req, res) => {
  const {
    title, description = "", type = "fixed", targetDays,
    startDate, categoryId, breakResetDays = 1
  } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });
  const s = req.neo4j.session();
  try {
    const id = `goal-${uid()}`;
    const start = startDate || new Date().toISOString().slice(0, 10);
    await s.run(
      `CREATE (g:Goal {
         id: $id, title: $title, description: $description, type: $type,
         targetDays: $targetDays, startDate: $start, status: 'active',
         breakResetDays: $breakResetDays, createdAt: datetime()
       })`,
      { id, title, description, type, targetDays: targetDays || null, start, breakResetDays }
    );
    if (categoryId) {
      await s.run(
        `MATCH (g:Goal {id: $id}), (c:Category {id: $catId})
         MERGE (g)-[:BELONGS_TO]->(c)`,
        { id, catId: categoryId }
      );
    }
    // Auto-generate milestones for fixed goals
    if (type === "fixed" && targetDays) {
      const milestones = autoMilestones(Number(targetDays));
      for (const m of milestones) {
        const mid = `ms-${uid()}`;
        await s.run(
          `MATCH (g:Goal {id: $gid})
           CREATE (m:Milestone {id: $mid, dayNumber: $day, title: $title, source: 'auto'})
           CREATE (g)-[:HAS_MILESTONE]->(m)`,
          { gid: id, mid, day: m.day, title: m.title }
        );
      }
    }
    res.json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

router.get("/goals/:id", async (req, res) => {
  const s = req.neo4j.session();
  try {
    const gResult = await s.run(
      `MATCH (g:Goal {id: $id})
       OPTIONAL MATCH (g)-[:BELONGS_TO]->(cat:Category)
       RETURN g, cat`,
      { id: req.params.id }
    );
    if (!gResult.records.length) return res.status(404).json({ error: "Not found" });
    const g = gResult.records[0].get("g").properties;
    const cat = gResult.records[0].get("cat")?.properties || null;

    const logsResult = await s.run(
      `MATCH (g:Goal {id: $id})-[:HAS_LOG]->(l:DailyLog) RETURN l ORDER BY l.date`,
      { id: req.params.id }
    );
    const logs = logsResult.records.map(r => r.get("l").properties);

    const msResult = await s.run(
      `MATCH (g:Goal {id: $id})-[:HAS_MILESTONE]->(m:Milestone)
       OPTIONAL MATCH (m)-[:HAS_REWARD]->(mr:Reward)
       RETURN m, collect(mr) AS rewards ORDER BY m.dayNumber`,
      { id: req.params.id }
    );
    const milestones = msResult.records.map(r => ({
      ...r.get("m").properties,
      rewards: r.get("rewards").map(rw => rw.properties)
    }));

    const rwResult = await s.run(
      `MATCH (g:Goal {id: $id})-[:HAS_REWARD]->(r:Reward) RETURN r`,
      { id: req.params.id }
    );
    const rewards = rwResult.records.map(r => r.get("r").properties);

    res.json({ ...g, category: cat, logs, milestones, rewards, streak: computeStreak(logs, g) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

router.put("/goals/:id", async (req, res) => {
  const { title, description, status, breakResetDays, targetDays } = req.body;
  const s = req.neo4j.session();
  try {
    await s.run(
      `MATCH (g:Goal {id: $id})
       SET g.title = COALESCE($title, g.title),
           g.description = COALESCE($description, g.description),
           g.status = COALESCE($status, g.status),
           g.breakResetDays = COALESCE($breakResetDays, g.breakResetDays),
           g.targetDays = COALESCE($targetDays, g.targetDays),
           g.updatedAt = datetime()`,
      { id: req.params.id, title: title || null, description: description || null,
        status: status || null, breakResetDays: breakResetDays || null, targetDays: targetDays || null }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

router.delete("/goals/:id", async (req, res) => {
  const s = req.neo4j.session();
  try {
    await s.run(
      `MATCH (g:Goal {id: $id})
       OPTIONAL MATCH (g)-[:HAS_LOG]->(l:DailyLog)
       OPTIONAL MATCH (g)-[:HAS_MILESTONE]->(m:Milestone)
       OPTIONAL MATCH (m)-[:HAS_REWARD]->(mr:Reward)
       OPTIONAL MATCH (g)-[:HAS_REWARD]->(gr:Reward)
       DETACH DELETE g, l, m, mr, gr`,
      { id: req.params.id }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// ─── Daily Logs ───────────────────────────────────────────────────────────────

router.post("/goals/:id/log", async (req, res) => {
  const { date, didIt, note = "", durationMinutes, timeOfDay } = req.body;
  if (!date) return res.status(400).json({ error: "date required" });
  const s = req.neo4j.session();
  try {
    // Upsert — one log per goal per day
    const existing = await s.run(
      `MATCH (g:Goal {id: $id})-[:HAS_LOG]->(l:DailyLog {date: $date}) RETURN l.id AS lid`,
      { id: req.params.id, date }
    );
    if (existing.records.length) {
      const lid = existing.records[0].get("lid");
      await s.run(
        `MATCH (l:DailyLog {id: $lid})
         SET l.didIt = $didIt, l.note = $note,
             l.durationMinutes = $dur, l.timeOfDay = $time, l.updatedAt = datetime()`,
        { lid, didIt: !!didIt, note, dur: durationMinutes || null, time: timeOfDay || null }
      );
    } else {
      const lid = `log-${uid()}`;
      await s.run(
        `MATCH (g:Goal {id: $gid})
         CREATE (l:DailyLog {id: $lid, date: $date, didIt: $didIt, note: $note,
                             durationMinutes: $dur, timeOfDay: $time, createdAt: datetime()})
         CREATE (g)-[:HAS_LOG]->(l)`,
        { gid: req.params.id, lid, date, didIt: !!didIt, note, dur: durationMinutes || null, time: timeOfDay || null }
      );
    }

    // Check if any milestones earned
    const logsResult = await s.run(
      `MATCH (g:Goal {id: $id})-[:HAS_LOG]->(l:DailyLog) RETURN l ORDER BY l.date`,
      { id: req.params.id }
    );
    const goalResult = await s.run(`MATCH (g:Goal {id: $id}) RETURN g`, { id: req.params.id });
    const goal = goalResult.records[0]?.get("g").properties || {};
    const logs = logsResult.records.map(r => r.get("l").properties);
    const { currentStreak } = computeStreak(logs, goal);

    // Unlock milestone rewards
    const msResult = await s.run(
      `MATCH (g:Goal {id: $id})-[:HAS_MILESTONE]->(m:Milestone)-[:HAS_REWARD]->(r:Reward)
       WHERE r.status = 'locked' AND m.dayNumber <= $streak
       RETURN r.id AS rid`,
      { id: req.params.id, streak: currentStreak }
    );
    for (const rec of msResult.records) {
      await s.run(
        `MATCH (r:Reward {id: $rid}) SET r.status = 'earned', r.earnedAt = datetime()`,
        { rid: rec.get("rid") }
      );
    }

    // Unlock goal completion reward if target met
    if (goal.targetDays && currentStreak >= Number(goal.targetDays)) {
      await s.run(
        `MATCH (g:Goal {id: $id})-[:HAS_REWARD]->(r:Reward) WHERE r.status = 'locked'
         SET r.status = 'earned', r.earnedAt = datetime()`,
        { id: req.params.id }
      );
      await s.run(
        `MATCH (g:Goal {id: $id}) WHERE g.status = 'active' SET g.status = 'completed'`,
        { id: req.params.id }
      );
    }

    res.json({ ok: true, streak: currentStreak });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// ─── Milestones ───────────────────────────────────────────────────────────────

router.post("/goals/:id/milestones", async (req, res) => {
  const { dayNumber, title } = req.body;
  if (!dayNumber || !title) return res.status(400).json({ error: "dayNumber and title required" });
  const s = req.neo4j.session();
  try {
    const mid = `ms-${uid()}`;
    await s.run(
      `MATCH (g:Goal {id: $gid})
       CREATE (m:Milestone {id: $mid, dayNumber: $day, title: $title, source: 'manual'})
       CREATE (g)-[:HAS_MILESTONE]->(m)`,
      { gid: req.params.id, mid, day: Number(dayNumber), title }
    );
    res.json({ ok: true, id: mid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

router.delete("/milestones/:id", async (req, res) => {
  const s = req.neo4j.session();
  try {
    await s.run(
      `MATCH (m:Milestone {id: $id})
       OPTIONAL MATCH (m)-[:HAS_REWARD]->(r:Reward)
       DETACH DELETE m, r`,
      { id: req.params.id }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// ─── Rewards (standalone CRUD) ────────────────────────────────────────────────

// List all rewards with linked goal info
router.get("/rewards", async (req, res) => {
  const s = req.neo4j.session();
  try {
    const result = await s.run(`
      MATCH (r:Reward)
      OPTIONAL MATCH (g:Goal)-[:HAS_REWARD]->(r)
      OPTIONAL MATCH (m:Milestone)-[:HAS_REWARD]->(r)
      OPTIONAL MATCH (mg:Goal)-[:HAS_MILESTONE]->(m)
      RETURN r,
             collect(DISTINCT {id: g.id, title: g.title}) AS linkedGoals,
             collect(DISTINCT {id: m.id, title: m.title, goalId: mg.id, goalTitle: mg.title}) AS linkedMilestones
      ORDER BY r.createdAt DESC
    `);
    const rewards = result.records.map(rec => ({
      ...rec.get("r").properties,
      linkedGoals: rec.get("linkedGoals").filter(g => g.id),
      linkedMilestones: rec.get("linkedMilestones").filter(m => m.id),
    }));
    res.json(rewards);
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// Create standalone reward
router.post("/rewards", async (req, res) => {
  const { title, description = "", costValue, categoryId } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });
  const s = req.neo4j.session();
  try {
    const rid = `reward-${uid()}`;
    await s.run(
      `CREATE (r:Reward {id: $rid, title: $title, description: $description,
               costValue: $costValue, status: 'locked', createdAt: datetime()})`,
      { rid, title, description, costValue: costValue || null }
    );
    if (categoryId) {
      await s.run(
        `MATCH (r:Reward {id: $rid}), (c:Category {id: $cid}) MERGE (r)-[:FROM_CATEGORY]->(c)`,
        { rid, cid: categoryId }
      );
    }
    res.json({ ok: true, id: rid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// Update reward
router.put("/rewards/:id", async (req, res) => {
  const { title, description, costValue } = req.body;
  const s = req.neo4j.session();
  try {
    await s.run(
      `MATCH (r:Reward {id: $id})
       SET r.title = COALESCE($title, r.title),
           r.description = COALESCE($description, r.description),
           r.costValue = COALESCE($costValue, r.costValue),
           r.updatedAt = datetime()`,
      { id: req.params.id, title: title || null, description: description || null, costValue: costValue || null }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// Delete reward
router.delete("/rewards/:id", async (req, res) => {
  const s = req.neo4j.session();
  try {
    await s.run(`MATCH (r:Reward {id: $id}) DETACH DELETE r`, { id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// Link reward to a goal (or milestone)
router.post("/rewards/:id/link", async (req, res) => {
  const { goalId, milestoneId } = req.body;
  if (!goalId && !milestoneId) return res.status(400).json({ error: "goalId or milestoneId required" });
  const s = req.neo4j.session();
  try {
    if (milestoneId) {
      await s.run(
        `MATCH (m:Milestone {id: $mid}), (r:Reward {id: $rid}) MERGE (m)-[:HAS_REWARD]->(r)`,
        { mid: milestoneId, rid: req.params.id }
      );
    } else {
      await s.run(
        `MATCH (g:Goal {id: $gid}), (r:Reward {id: $rid}) MERGE (g)-[:HAS_REWARD]->(r)`,
        { gid: goalId, rid: req.params.id }
      );
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// Unlink reward from a goal (or milestone)
router.delete("/rewards/:id/link", async (req, res) => {
  const { goalId, milestoneId } = req.body;
  const s = req.neo4j.session();
  try {
    if (milestoneId) {
      await s.run(
        `MATCH (m:Milestone {id: $mid})-[rel:HAS_REWARD]->(r:Reward {id: $rid}) DELETE rel`,
        { mid: milestoneId, rid: req.params.id }
      );
    } else if (goalId) {
      await s.run(
        `MATCH (g:Goal {id: $gid})-[rel:HAS_REWARD]->(r:Reward {id: $rid}) DELETE rel`,
        { gid: goalId, rid: req.params.id }
      );
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

router.put("/rewards/:id/claim", async (req, res) => {
  const s = req.neo4j.session();
  try {
    await s.run(
      `MATCH (r:Reward {id: $id}) WHERE r.status = 'earned'
       SET r.status = 'claimed', r.claimedAt = datetime()`,
      { id: req.params.id }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

router.put("/rewards/:id/receive", async (req, res) => {
  const s = req.neo4j.session();
  try {
    await s.run(
      `MATCH (r:Reward {id: $id}) WHERE r.status = 'claimed'
       SET r.status = 'received', r.receivedAt = datetime()`,
      { id: req.params.id }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { s.close(); }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function autoMilestones(totalDays) {
  const milestones = [];
  if (totalDays >= 7)  milestones.push({ day: 7,  title: "First week done 🌱" });
  if (totalDays >= 14) milestones.push({ day: 14, title: "Two weeks strong 💪" });
  if (totalDays >= 21) milestones.push({ day: 21, title: "Habit forming 🔥" });
  if (totalDays >= 30) milestones.push({ day: 30, title: "One month complete 🏆" });
  if (totalDays >= 60) milestones.push({ day: 60, title: "Two months — incredible 🌟" });
  if (totalDays >= 90) milestones.push({ day: 90, title: "90 days — transformation 🚀" });
  return milestones.filter(m => m.day <= totalDays);
}

function computeStreak(logs, goal) {
  const breakResetDays = Number(goal.breakResetDays) || 1;
  const doneDates = new Set(
    logs.filter(l => l.didIt).map(l => l.date)
  );

  if (doneDates.size === 0) return { currentStreak: 0, longestStreak: 0, totalDone: 0 };

  const today = new Date().toISOString().slice(0, 10);
  const startDate = goal.startDate || [...doneDates].sort()[0];

  let current = 0;
  let longest = 0;
  let run = 0;
  let missedRun = 0;

  const start = new Date(startDate);
  const end = new Date(today);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ds = d.toISOString().slice(0, 10);
    if (doneDates.has(ds)) {
      run++;
      missedRun = 0;
      if (run > longest) longest = run;
    } else {
      missedRun++;
      if (missedRun >= breakResetDays) {
        run = 0;
      }
    }
  }
  current = run;

  return { currentStreak: current, longestStreak: longest, totalDone: doneDates.size };
}

export default router;
