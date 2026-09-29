# Rewards Microfrontend: Low-Level Requirements Document (LLRD)

| | |
|---|---|
| **Version** | 1.0 (MVP baseline) · 2026-09-28 |
| **Parent** | [HLRD.md](HLRD.md). Each LLR traces to an HLR epic |
| **Design** | [LLD.md](LLD.md) (endpoints, data model, algorithms) |

Conventions: **LLR** = detailed functional requirement · **BR-R** = business rule · **AC** = acceptance criteria (Given / When / Then) · status ✅ built & tested, 🟡 built (manual test only), ⏳ post-MVP.

---

## 1. Detailed discovery

### 1.1 Discovery questions and answers

| # | Question | Answer / decision | Source |
|---|---|---|---|
| Q1 | Which tiles exist and are they editable? | ~~3 fixed tiles; only areas editable~~ Superseded by Q15: tiles are fully user-managed | Brief, revised 2026-09-29 |
| Q2 | Household starter list (originally the seed list; now the optional starter set, LLR-1.8)? | Kitchen, Kitchen Utility Area, Laundry, Master Bathroom, Guest Bathroom, Master Bedroom, Guest Room, Hall, Balcony, Books, Makeup, Wardrobe, Shiragi Toys (13). "Kitchen Utility" dropped as a duplicate | PO decision, 2026-09-28 |
| Q3 | What counts as a streak for weekly tasks? | Consecutive Monday–Sunday weeks with ≥ 1 completion | Design decision |
| Q4 | When does a streak break? | Only after a **whole** period is missed (done yesterday but not yet today = still alive) | Design decision |
| Q5 | How can the demo show a streak going up in minutes? | Backfill: log a completion for yesterday or the day before | PO accepted |
| Q6 | Do completions before a reward existed count? | Yes, all completions of tagged tasks count | Design decision (demo flow) |
| Q7 | Can an unlocked reward re-lock if a streak breaks? | No, unlock is permanent | Design decision |
| Q8 | What happens to the old in-site rewards? | Replaced on `#/rewards`; old UI and Express/Neo4j routes removed | PO decision |
| Q9 | Timezone? | User-local calendar, default Asia/Kolkata (configurable) | Design decision |
| Q10 | AI in MVP? | No, post-MVP; the dashboard shows an empty state until then | PO decision |
| Q11 | Should rewards use the same categories as tasks? | Yes. A reward belongs to a **tile** (required) and optionally one **area** of that tile, the same taxonomy as tasks. This is the reward's *scope*, and tasks are matched to rewards within it | PO decision, 2026-09-28 |
| Q12 | How are tasks matched to a reward? | Two modes. **Selected tasks** (default): tag specific tasks, all inside the scope. **All tasks in scope**: every non-archived task in the area (or tile) counts automatically, including tasks added later | Design decision, 2026-09-28 |
| Q13 | Where is data hosted? | SQLite on the DigitalOcean droplet (1 GB RAM, 25 GB disk), backed up continuously by Litestream; MFE on Vercel; photos in object storage later | PO decision, 2026-09-28 |
| Q14 | Can schema changes lose existing (test) data? | No. Every schema change ships as an Alembic migration that upgrades the file in place, with an automatic backup first; export/import to JSON is available for moves | PO requirement, 2026-09-28 |
| Q15 | Should tiles be seeded? | No. Tiles are user-managed (create, edit, reorder, delete). A fresh install starts empty, with an optional one-click starter set | PO decision, 2026-09-29 |
| Q16 | How structured are the notes and contacts? | Simple: notes, contacts and files, each with an optional **topic** (e.g. "Bosch Dishwasher") that groups them. "Past executives" are contacts with the role *Service executive* and a last-visit date | PO decision, 2026-09-29 |
| Q17 | Who can see notes, contacts and files? | The same as rewards: visible in the read-only view when public reads are on; editing needs the owner passcode. Risk logged in HLRD §9 | PO decision, 2026-09-29 |
| Q18 | Can tiles hold notes and contacts, or only areas? | Both. Home-wide services (e.g. Pest Control) live on the tile; appliance-specific ones on the area (e.g. Kitchen › Bosch Dishwasher) | PO decision, 2026-09-29 |
| Q19 | What does marking a task as a milestone do? | Three things: a 🏁 badge and a *Milestones* filter (and a dashboard list); a new reward rule *milestone completed*; and a bigger celebration when it's completed | PO decision, 2026-09-29 |
| Q20 | What do "announce" and "keep silent" mean? | Visibility and celebration. **Announced**: visible in the read-only view, celebrated on completion with a share prompt. **Silent**: visible only with the owner passcode, and completed quietly (no toast, no share prompt) | PO decision, 2026-09-29 |
| Q21 | How do "days to complete" and the due date relate? | They're independent fields, both optional; neither is calculated from the other | PO decision, 2026-09-29 |
| Q22 | What visibility do existing and new tasks get? | Existing tasks become *Announced* (unchanged behaviour). New tasks default to *Announced*; the add form lets you switch to *Silent* | Design decision, 2026-09-29 (see O8) |
| Q23 | Where do "things I might get for Shiragi later" go: notes or rewards? | Rewards, as **ideas**: a reward in an *Idea* stage with no rule yet. Notes (HLR-10) stay for reference information about a place (contacts, bills) | PO decision, 2026-09-29 |
| Q24 | Should reward ideas be visible in the read-only view? | No by default: ideas are **Silent** (hidden without the passcode), so a gift for Shiragi stays a surprise. Each idea or reward can be switched to *Announced* | Design decision, 2026-09-29 |
| Q25 | Who can a reward be for? | Any person, as a free-text **For whom** label with suggestions from earlier entries (default "Me"). It's a label only; all editing stays with the owner | PO decision, 2026-09-29 |

### 1.2 Open items

| # | Item | Owner | Needed by |
|---|---|---|---|
| O1 | ~~Hosting choice~~ Closed by Q13 | PO | — |
| O5 | Can one reward ever span two tiles (e.g. a treat for Career + Fun)? Current rule: no; create one reward per tile. Revisit if it comes up in real use | PO | Before HLR-9 build |
| O7 | A *milestone completed* reward with several milestone tasks: unlock when **all** are done (current rule, BR-R25) or when **any** is done? | PO | Before HLR-11 build |
| O8 | Should new tasks default to *Silent* instead of *Announced* once the site is public? | PO | Before going live |
| O2 | Confirm no data needs migrating from the old Neo4j rewards | PO | Before merging to `main` |
| O3 | Reminder channel for the web (push vs email) | PO | Integration phase |
| O4 | Claude model and per-request cost budget for vision | PO | Phase 4 |

---

## 2. Feature-level As-Is → To-Be

| Feature | As-Is (old in-site rewards) | To-Be (Rewards MFE) | LLR |
|---|---|---|---|
| Navigation | Goals / Rewards tabs, modal-heavy | Tiles → Areas → Area → Task; Rewards tab; deep links `#/rewards/...` | LLR-1, LLR-7 |
| Categories | 6 fixed + custom categories for goals | User-managed tiles and areas (create, edit, reorder, delete); empty start with an optional starter set | LLR-1.x |
| Service records | None (phone contacts, chats, paper bills) | Notes, contacts and files on every tile and area, grouped by topic, tap-to-call, search | LLR-10.x |
| Unit of work | Goal (title, description, type, target days) | Task (title, notes, priority, frequency, status, relevance, source) | LLR-2.x |
| Logging | "Log today": did it?, duration, note | Complete now or backfill 1–2 days; note | LLR-3.x |
| Streak | Daily streak per goal | Per task, daily or weekly periods; current + best | LLR-3.x |
| Milestones | Day-number milestones per goal | Any task can be a milestone: 🏁 badge and filter, a *milestone completed* reward rule, a bigger celebration (plus *streak of N* for day counts) | LLR-11.1–11.4 |
| Deadlines and privacy | Target days per goal; everything visible | Optional due date and time, days to complete (independent); announce or silent per task | LLR-11.5–11.12 |
| Rewards | Per goal/milestone, ₹ value, claim → receive | Many-to-many with tasks; completions or streak rule; auto-unlock; claim | LLR-4.1–4.8 |
| Reward ideas | Rewards defined only together with a goal | Capture an idea first (title, photo, link, where seen, for whom), turn it into a reward later or close it as bought/dropped | LLR-12.x |
| Reward scope | Reward inherits its goal's category (6 goal categories) | Reward has its own tile + optional area from the **same taxonomy as tasks**; tasks matched by scope (selected, or all in scope) | LLR-4.9–4.18 |
| Insights | 3 summary cards | Streamlit dashboard | LLR-5.x |
| AI | — | Photo → suggestions (⏳) | LLR-6.x |
| Auth | Passcode gate (disabled) | Demo bearer token at the BFF | LLR-8.x |
| Backend | Express + Neo4j (`/api/rewards`) | FastAPI BFF + SQLite | LLR-8.x |

---

## 3. Detailed functional requirements

### LLR-1 Tiles and areas (HLR-1)

| ID | Requirement | Status |
|---|---|---|
| LLR-1.1 | **Superseded by LLR-1.7 (Q15).** Was: on first start the system seeds tiles and areas per Q2 | ✅ (to be replaced) |
| LLR-1.2 | The tiles screen shows each tile's icon, name, area count and active task count | 🟡 |
| LLR-1.3 | The user can add an area to a tile. The name is 1–80 characters, trimmed, and **unique within the tile ignoring case** | ✅ |
| LLR-1.4 | The user can rename an area under the same rules as LLR-1.3 | ✅ |
| LLR-1.5 | The user can delete an area after confirmation. Its tasks, completions, photos and suggestions are removed with it | ✅ |
| LLR-1.6 | The confirmation text states how many active tasks will be deleted | 🟡 |

#### User-managed tiles (HLR-1 update) ✅

| ID | Requirement | Status |
|---|---|---|
| LLR-1.7 | A new database starts with **no tiles**. The tiles screen shows "Create your first tile" and an optional **Add suggested tiles** button. Nothing is seeded automatically | ✅ |
| LLR-1.8 | **Add suggested tiles** adds the starter set (Career/Office/Work with Learning and Projects; Household with the 13 areas in Q2; Fun with Hobbies and Outings). It only adds tiles and areas whose names don't already exist, so it never duplicates or overwrites anything and can be pressed again safely | ✅ |
| LLR-1.9 | **Create a tile**: name 1–40 characters, trimmed, unique ignoring case (409 on duplicate); icon (one emoji, optional, default 📁). New tiles go to the end | ✅ |
| LLR-1.10 | **Edit a tile**: change its name (same rules) and icon. Areas, tasks, rewards and links keep working, because they refer to the tile's id, not its name | ✅ |
| LLR-1.11 | **Reorder** tiles, and areas within a tile (move up/down; drag on wider screens). The order is saved and used everywhere, including the dashboard | ✅ (up/down; drag on wide screens later) |
| LLR-1.12 | **Delete a tile**: the confirmation lists what will be removed (areas, tasks, completions, rewards scoped to it, notes, contacts, files) and requires typing the tile's name. A database snapshot is taken first (BR-R18) | ✅ |
| LLR-1.13 | Existing databases keep their current tiles and areas when this ships: the upgrade removes nothing. They become ordinary user-managed tiles that can be edited or deleted | ✅ |

**AC-1.7 to 1.12**
- *Given* a fresh database *when* the Rewards screen opens *then* it shows "Create your first tile" and no tiles.
- *Given* a tile "Home" exists *when* the user presses "Add suggested tiles" *then* Career/Office/Work, Household and Fun are added, "Home" is untouched, and pressing it again adds nothing.
- *Given* a tile "Household" exists *when* the user creates "household" *then* it's rejected: "'household' already exists" (409).
- *Given* "Household" is renamed to "Home and family" *then* its areas, tasks and rewards are unchanged and deep links still open it.
- *Given* the user deletes "Fun" and types "Fun" to confirm *then* Fun, its areas, tasks, completions, scoped rewards and details are removed, and a snapshot exists in `data/backups/`.

**AC-1.3**
- *Given* Fun contains "Hobbies" *when* the user adds "hobbies" *then* it's rejected with "'hobbies' already exists in this category" (409) and nothing is created.
- *Given* an empty name *when* submitted *then* the Add button is disabled and the API rejects it (422).

**AC-1.5**
- *Given* an area with 2 tasks *when* it's deleted and confirmed *then* the area and both tasks return 404 afterwards.

### LLR-2 Task management (HLR-2)

| ID | Requirement | Status |
|---|---|---|
| LLR-2.1 | Create a task with title (1–200 characters, required), notes (≤ 2000), priority (high/medium/low, default medium) and frequency (daily/weekly/one_off, default weekly). Source = manual; status = active; relevance = relevant | ✅ |
| LLR-2.2 | After creating a task, the form keeps the chosen priority and frequency for the next entry and clears the title and notes | 🟡 |
| LLR-2.3 | An area's task list is sorted by priority (high → low), then by creation time | ✅ |
| LLR-2.4 | Filter by priority, status and relevance, singly or combined. The default view is status = active | ✅ |
| LLR-2.5 | Reprioritise from the list (inline select) or from task detail | ✅ |
| LLR-2.6 | Change frequency, status (active/done/archived) and relevance from task detail | ✅ |
| LLR-2.7 | An empty list says "No tasks yet" with the default filter and "No tasks match these filters" otherwise | 🟡 |
| LLR-2.8 | Null values in updates are rejected (422); unknown enum values are rejected (422) | ✅ |
| LLR-2.9 | A cross-area list of active tasks, grouped by area, is available for the reward task picker | ✅ |

**AC-2.3**
- *Given* a low-priority task created before a high-priority one *when* the list loads *then* the high one is first.

**AC-2.4**
- *Given* one task is archived *when* filtering status = active *then* only the other task shows.

### LLR-3 Completion, activity log and streaks (HLR-3)

| ID | Requirement | Status |
|---|---|---|
| LLR-3.1 | Complete an **active** task, optionally with a note (≤ 1000) and a time (`completedAt`). If no time is given, the time is now | ✅ |
| LLR-3.2 | The UI offers *Now*, *Yesterday* and *2 days ago* (same time of day) | 🟡 |
| LLR-3.3 | A completion more than 1 minute in the future is rejected (422) | ✅ |
| LLR-3.4 | Completing a **one-off** task sets it to done. Further completions are rejected (409) | ✅ |
| LLR-3.5 | Completing a done or archived task is rejected with a message naming its status (409) | ✅ |
| LLR-3.6 | The activity log lists completions newest first, with local date/time and note | ✅ |
| LLR-3.7 | Each task shows completion count, current streak, best streak and last completion time | ✅ |
| LLR-3.8 | The area list offers a one-tap ✓ complete (now) for active tasks | 🟡 |

**Business rules: streaks**

| ID | Rule |
|---|---|
| BR-R1 | A period is a local calendar day (daily) or a Monday–Sunday week (weekly) in `BFF_TIMEZONE` |
| BR-R2 | Several completions in one period count once towards the streak (they all count towards completion count) |
| BR-R3 | Best streak = longest run of consecutive periods with ≥ 1 completion |
| BR-R4 | Current streak = the run ending at the latest completed period, **if** that period is the current or the previous one; otherwise 0 |
| BR-R5 | One-off tasks: streak = 1 once completed, else 0 (not shown as an active streak) |
| BR-R6 | Streaks are derived from the activity log on every read (never stored) |

**AC-3 (streak)**
- *Given* a daily task *when* completed yesterday and then today *then* current = 2 and best = 2.
- *Given* the same task completed again today *then* current stays 2 and completion count becomes 3.
- *Given* last completion 2 days ago (none yesterday) *then* current = 0 and best keeps its value.
- *Given* a weekly task done this Monday and last Sunday *then* current = 2 (different weeks).

### LLR-4 Rewards (HLR-4)

| ID | Requirement | Status |
|---|---|---|
| LLR-4.1 | Create a reward: title (1–200, required), description (≤ 2000), image URL (≤ 500, optional), rule type (completions or streak), threshold N (1–365), tagged tasks (optional) | ✅ |
| LLR-4.2 | Tag or untag tasks as a full replacement of the set. Unknown task ids are rejected (422) | ✅ |
| LLR-4.3 | Tag a task to a locked reward from the task detail screen | 🟡 |
| LLR-4.4 | Show each reward's rule text, progress (current / target, %), status and tagged tasks | ✅ |
| LLR-4.5 | Filter the rewards list by status | ✅ |
| LLR-4.6 | Claim is only possible when the status is unlocked. Claiming a locked reward is rejected (409). Claiming an already claimed reward changes nothing | ✅ |
| LLR-4.7 | When a completion unlocks a reward, the completion response includes it and the UI shows a celebration toast | ✅ |
| LLR-4.8 | Editing a reward's tasks is only offered while it's locked | 🟡 |

#### Reward scope and matching (HLR-9) ⏳ next

| ID | Requirement | Status |
|---|---|---|
| LLR-4.9 | Every reward has a **scope** from the same taxonomy as tasks: a **tile** (required: Career/Office/Work, Household or Fun) and optionally one **area** of that tile (e.g. Household › Kitchen). Creating a reward without a tile is rejected (422); an area from another tile is rejected (422) | ⏳ |
| LLR-4.10 | Every reward has a **match mode**: *Selected tasks* (default; the user tags specific tasks) or *All tasks in scope* (every non-archived task in the scope counts automatically, including tasks created later) | ⏳ |
| LLR-4.11 | In *Selected tasks* mode, only tasks **inside the reward's scope** can be tagged. Tagging a task outside it is rejected (422) with a message naming the task and the scope | ⏳ |
| LLR-4.12 | The reward form picks tile, then area (optional, "Whole tile" default), then match mode. The task picker lists **only tasks in that scope**, grouped by area | ⏳ |
| LLR-4.13 | Each reward card shows its scope as a breadcrumb (e.g. "Household › Kitchen" or "Fun") and its match mode. The rewards list can be filtered by tile and by area, in addition to status | ⏳ |
| LLR-4.14 | The **area screen** shows "Rewards you can earn here": locked or unlocked rewards whose scope is this area or this area's whole tile, with progress | ⏳ |
| LLR-4.15 | On **task detail**, "Tag to a reward" offers only locked *Selected tasks* rewards whose scope contains the task. Rewards that match the task automatically (*All tasks in scope*) are listed with the label "Counts automatically" | ⏳ |
| LLR-4.16 | Scope and match mode can be changed only while the reward is **locked**. Narrowing the scope removes tags that fall outside it, after the user confirms; the confirmation lists the tasks that will be untagged | ⏳ |
| LLR-4.17 | Deleting an **area** doesn't delete rewards scoped to it: they widen to the area's tile (area cleared) and keep their status, rule and remaining tags. Renaming an area changes nothing | ⏳ |
| LLR-4.18 | **Existing rewards are migrated without data loss** (schema migration with automatic pre-upgrade backup): if all tagged tasks share one area, scope = that area; else if they share one tile, scope = that tile; otherwise (no tags, or tags across tiles) the reward keeps its tags and is marked *Needs a tile* until the user picks one. No reward, tag, completion or status is deleted | ⏳ |

**Business rules: rewards**

| ID | Rule |
|---|---|
| BR-R7 | *Completions* rule progress = total completions of all tagged tasks (all-time) |
| BR-R8 | *Streak* rule progress = the highest **current** streak among tagged tasks |
| BR-R9 | The unlock check runs on task completion, reward creation, reward update and tag change |
| BR-R10 | Status flow locked → unlocked → claimed only; there's no path back |
| BR-R11 | Unlocked and claimed rewards always show 100 % |
| BR-R12 | **Scope containment.** A task is in a reward's scope when the task's area belongs to the reward's tile and, if the reward has an area, the task's area *is* that area |
| BR-R13 | **Matched tasks.** *Selected tasks*: the tagged tasks (all in scope). *All tasks in scope*: every task in scope whose status isn't archived. BR-R7 and BR-R8 compute progress over the matched tasks |
| BR-R14 | In *All tasks in scope* mode, tags are ignored for progress (they're kept, so switching back to *Selected tasks* restores them) |
| BR-R15 | The unlock check (BR-R9) on completion evaluates every locked reward that **matches** the completed task, whether tagged or by scope |
| BR-R16 | A reward marked *Needs a tile* (LLR-4.18) still shows progress from its tags, but can't be edited until a tile is chosen. It never unlocks from tasks outside the tile the user then picks |

**AC-4b (scope and matching)**
- *Given* a reward scoped to Household › Kitchen *when* the user tries to tag the Laundry task *then* it's rejected: "“Wash whites” isn't in Household › Kitchen" (422).
- *Given* a reward "Weekend brunch" scoped to Household with *All tasks in scope*, 3 completions *when* the user completes any Household task (Kitchen or Laundry) *then* progress counts it without tagging. A Career task never counts.
- *Given* a new Kitchen task is created after the reward *when* it's completed *then* it counts towards the Household reward immediately.
- *Given* the Kitchen area screen *then* "Rewards you can earn here" lists rewards scoped to Household › Kitchen and to Household, not Fun or Household › Laundry.
- *Given* an existing reward tagged only to Kitchen tasks *when* the migration runs *then* its scope becomes Household › Kitchen, and its tags, progress and status are unchanged.
- *Given* the Kitchen area is deleted *then* a reward scoped to Household › Kitchen becomes scoped to Household and keeps its status.

**AC-4 (demo flow)**
- *Given* a task with 2 completions and a locked "3 completions" reward *when* the reward is tagged to the task *then* progress = 2/3 (67 %).
- *When* the task is completed once more *then* the response lists the reward as unlocked and the UI shows "🎉 Reward unlocked: <title>".
- *When* the user claims it *then* the status is claimed and `claimedAt` is set.

### LLR-5 Insights dashboard (HLR-5)

| ID | Requirement | Status |
|---|---|---|
| LLR-5.1 | Reads only `GET /dashboard/summary`; never the database | ✅ |
| LLR-5.2 | KPIs: completions (window), active tasks, active streaks, unlocked + claimed rewards, AI acceptance rate (— when undefined) | 🟡 |
| LLR-5.3 | Charts: completions by tile, by area (filterable by tile) and per day (empty days shown as gaps). Hover tooltips on every mark | 🟡 |
| LLR-5.4 | Tables: active streaks (filterable by tile); reward progress with a progress bar | 🟡 |
| LLR-5.5 | Filters: window (7/30/90 days/all time) and tile. They survive reruns (`session_state`) | 🟡 |
| LLR-5.6 | Responses are cached 30 s per window. *Refresh now* clears the cache | 🟡 |
| LLR-5.7 | Unlocked rewards can be claimed from the dashboard. After claiming, the cache is cleared and the page shows fresh data | 🟡 |
| LLR-5.8 | If the BFF is unreachable, show the error and *Try again* (no stack traces) | 🟡 |
| LLR-5.9 | Streaks and rewards ignore the window; completion aggregates respect it | ✅ |
| LLR-5.10 | Summary payload is flat snake_case records; React endpoints are camelCase (per-client shaping) | ✅ |
| LLR-5.11 | Reward progress rows include the reward's tile and area; the dashboard's tile filter applies to rewards as well as completions and streaks | ⏳ (HLR-9) |

### LLR-6 AI task suggestions (HLR-6) ⏳

| ID | Requirement |
|---|---|
| LLR-6.1 | Attach 1–5 photos per run to an area (JPEG/PNG/WebP, ≤ 5 MB each; type checked by content, not extension) |
| LLR-6.2 | Photos are stored privately with random names and are never publicly addressable |
| LLR-6.3 | Starting a suggestion run returns immediately (202) with a run id; the UI shows a loading state |
| LLR-6.4 | While a run is in progress, the manual *Add a task* form stays fully usable |
| LLR-6.5 | Each suggestion has a title (≤ 200), why (≤ 500), priority and frequency, validated against a strict schema |
| LLR-6.6 | The user marks each suggestion Relevant / Not relevant / Ignore. Relevant creates a task with source = ai. A decision is final (409 on re-decide) |
| LLR-6.7 | On timeout (30 s), invalid output or missing API key: retry once where sensible, then show "AI suggestions unavailable, add tasks manually". The page never breaks |
| LLR-6.8 | The API key exists only in BFF environment variables |
| LLR-6.9 | Decisions feed the dashboard acceptance rate (relevant ÷ decided) |

### LLR-7 Module composition (HLR-7)

| ID | Requirement | Status |
|---|---|---|
| LLR-7.1 | The MFE is built separately and exposes `./RewardsApp` via `remoteEntry.js` | ✅ |
| LLR-7.2 | The host mounts it on `#/rewards` and every `#/rewards/*`. The nav item stays active on sub-routes | 🟡 |
| LLR-7.3 | Host and remote share one React instance; the remote bundles no React | 🟡 (verified in browser) |
| LLR-7.4 | If the remote fails to load, the host shows "Rewards is unavailable right now" and a reload button. Other pages are unaffected | 🟡 |
| LLR-7.5 | MFE styles are scoped (`.rw-app`) and don't alter host styles | 🟡 |
| LLR-7.6 | The remote URL is configurable per environment (`VITE_REWARDS_REMOTE_URL`) | ✅ |
| LLR-7.7 | The MFE runs standalone for development (`npm run dev`) | 🟡 |
| LLR-7.8 | Every screen has loading, error (with retry) and empty states | 🟡 |

### LLR-8 BFF API (HLR-8)

| ID | Requirement | Status |
|---|---|---|
| LLR-8.1 | Every endpoint except `/health` needs `Authorization: Bearer <demo token>`; otherwise 401 | ✅ |
| LLR-8.2 | CORS allows only the configured origins | ✅ |
| LLR-8.3 | OpenAPI documentation is served at `/docs` | ✅ |
| LLR-8.4 | Errors use `{detail}` with status codes 401, 404, 409 and 422 as catalogued in LLD §3.3 | ✅ |
| LLR-8.5 | Request bodies accept camelCase or snake_case. React responses are camelCase; dashboard responses are snake_case | ✅ |
| LLR-8.6 | Timestamps are ISO-8601 UTC in responses | ✅ |
| LLR-8.7 | Reward create/update accept `categoryId` (required on create), `areaId` (optional) and `match` (`selected` \| `all_in_scope`); reward responses include `scope {categoryId, categoryName, areaId, areaName}`, `match` and `needsTile` | ⏳ (HLR-9) |
| LLR-8.8 | `GET /rewards` accepts `categoryId` and `areaId` filters. `GET /areas/{id}/rewards` returns the rewards that match that area (LLR-4.14). Task detail's `rewards` lists every reward matching the task, with how it matches (`tagged` or `scope`) | ⏳ (HLR-9) |
| LLR-8.9 | Schema changes are applied by versioned migrations on startup, never by dropping and recreating tables; a backup of the database file is written before each upgrade (Q14) | ✅ |
| LLR-8.10 | Tile endpoints: `POST /categories`, `PATCH /categories/{id}` (name, icon), `DELETE /categories/{id}`, `PUT /categories/order` and `PUT /categories/{id}/areas/order`, `POST /categories/starter` (LLR-1.8, returns what was added) | ✅ |
| LLR-8.12 | Task create/update accept `isMilestone`, `visibility` (`announced` \| `silent`), `dueAt` (ISO date-time, optional) and `targetDays` (optional); `GET /areas/{id}/tasks` adds filters `milestone=true` and `due=overdue\|today\|week` and `sort=due`. Responses served without the passcode omit silent tasks entirely (BR-R23) | ⏳ next |
| LLR-8.13 | Rewards accept `status: "idea"` on create (rule, threshold and tile then optional), `forWhom`, `visibility`, `link`, `seenAt` (where seen) and a cover image; `POST /rewards/{id}/activate` (rule, threshold, tile, tasks) turns an idea into a locked reward; `POST /rewards/{id}/close` with `outcome` (`bought` \| `dropped`); `GET /rewards` filters `status=idea\|closed` and `forWhom=` | ⏳ next |
| LLR-8.11 | Details endpoints for both owners (`/categories/{id}` and `/areas/{id}`): `…/details` (grouped by topic), `…/notes`, `…/contacts`, `…/files` (multipart upload); `PATCH`/`DELETE` on `/notes/{id}`, `/contacts/{id}`, `/files/{id}`; `GET /files/{id}/download`; `GET /search?q=` | ✅ |

### LLR-10 Notes, contacts and files (HLR-10) ✅

Each **tile** and each **area** has a *Notes & contacts* section (Q16, Q18). Every note, contact and file can carry an optional **topic** (e.g. "Bosch Dishwasher", "Pest Control") that groups related items.

| ID | Requirement | Status |
|---|---|---|
| LLR-10.1 | The tile screen and the area screen each have a **Notes & contacts** tab next to their main content. It lists topics as groups (items without a topic under "General"), each showing its contacts, files and notes | ✅ |
| LLR-10.2 | **Topic** is free text (1–60 characters), optional, and offers existing topics from the same tile or area as suggestions, so "Bosch Dishwasher" isn't typed three different ways | ✅ |
| LLR-10.3 | **Contact**: name (required, 1–80); organisation or brand (e.g. Bosch, Kent, IFB, LG); role (*Customer care*, *Service executive*, *Technician*, *Vendor or shop*, *Other*); up to 3 phone numbers with labels (mobile, toll-free, WhatsApp); email; website; last visit or contact date; notes (≤ 1000); topic | ✅ |
| LLR-10.4 | Phone numbers are stored as entered and shown with actions: **Call** (`tel:`), **WhatsApp** (`wa.me`, for numbers marked WhatsApp) and **Copy**. Email gets **Email** (`mailto:`). All actions are one tap on a phone | ✅ |
| LLR-10.5 | **Past executives**: within a topic, contacts with the role *Service executive* or *Technician* are listed newest last-visit first. The topic header shows the **last executive** (name, date, call button) | ✅ |
| LLR-10.6 | **Note**: text 1–5000 characters, optional title and topic; shows created and last-edited time; newest first | ✅ |
| LLR-10.7 | **File** (bills, invoices, warranty cards, manuals): PDF, JPG, PNG, WebP or HEIC, up to 10 MB each, checked by content; title (required), optional date, amount (₹) and topic. Files open in the browser or download; images show a thumbnail | ✅ |
| LLR-10.8 | Notes, contacts and files can be edited and deleted (with confirmation), and moved between topics by editing the topic | ✅ |
| LLR-10.9 | **Search** across every tile and area by contact name, organisation, topic, phone digits (spaces and dashes ignored), note text and file title. Results show where each hit lives (e.g. "Household › Kitchen › Bosch Dishwasher") and link to it | ✅ |
| LLR-10.10 | Deleting an area or tile deletes its notes, contacts and files, and the confirmation counts them (LLR-1.12). Stored files are removed only after the database change commits | ✅ |
| LLR-10.11 | Visibility follows the rewards setting (Q17): readable in the read-only view when public reads are on; creating, editing, deleting and uploading need the owner passcode | ✅ |
| LLR-10.12 | The JSON export (`app.backup`) includes notes and contacts, and lists files by title and stored name; the server backup covers the files folder as well as the database | 🟡 export built; server backup of the files folder comes with hosting |

**Business rules: tiles and details**

| ID | Rule |
|---|---|
| BR-R17 | Tile names are unique ignoring case; area names are unique within their tile ignoring case |
| BR-R18 | Deleting a tile removes everything under it (areas, tasks, completions, rewards scoped to it, notes, contacts, files) in one transaction, after a database snapshot is saved to `data/backups/` |
| BR-R19 | The starter set only adds tiles and areas whose names are missing; it never renames, merges or deletes |
| BR-R20 | Details belong to exactly one owner: a tile or an area. Moving an area to another tile isn't supported, so details never change tile |
| BR-R21 | The "last executive" of a topic is the *Service executive* or *Technician* contact in that topic with the latest last-visit date; contacts without a date come after dated ones |

**AC-10 (your examples)**
- *Given* Household › Kitchen *when* the user adds contacts "Bosch Customer Care" (Customer care, toll-free number) and "Ramesh" (Service executive, last visit 12 Aug 2026), both with topic "Bosch Dishwasher", uploads the installation bill and adds a note "Filter cleaned; next service due in 6 months" *then* the **Bosch Dishwasher** topic shows all four, with Ramesh as the last executive.
- *Given* a topic "Kent Water Purifier" with executives visiting in March and August *then* the August executive is shown as the last executive, and both appear under past executives.
- *Given* "IFB Washing Machine" (Laundry), "LG Fridge" (Kitchen) and "Pigeon Net" (Balcony) contacts *when* the user searches "IFB" *then* the result shows "Household › Laundry › IFB Washing Machine".
- *Given* Household (tile level) with topic "Pest Control" *then* its last executive shows on the Household tile's Notes & contacts tab, not under any area.
- *Given* a saved number "98450 12345" *when* the user searches "9845012345" *then* the contact is found, and tapping **Call** on a phone dials it.
- *Given* the read-only view (no passcode) *then* notes, contacts and files are visible, but the add, edit, delete and upload controls are hidden (Q17).

### LLR-11 Task planning and visibility (HLR-11) ⏳ next

Four new, optional task attributes (Q19 to Q22). They sit under **More options** in the add form, so adding a quick task on a phone stays one field and one tap.

| ID | Requirement | Status |
|---|---|---|
| LLR-11.1 | **Milestone**: yes/no (default no), set when creating or editing a task | ⏳ next |
| LLR-11.2 | Milestones show a 🏁 badge on task rows and task detail. The area task list has a **Milestones only** filter, and the dashboard has a *Milestones* table (title, tile › area, due, done / overdue / upcoming) | ⏳ next |
| LLR-11.3 | Completing an **announced** milestone shows the **milestone celebration**: a larger, longer celebration than a normal completion (respects reduced motion), with its own share prompt | ⏳ next |
| LLR-11.4 | New reward rule **Milestone completed** (alongside *N completions* and *streak of N*). The reward unlocks when every milestone task it matches has at least one completion (BR-R25). Creating one that matches no milestone task is rejected (422) | ⏳ next |
| LLR-11.5 | **Announce or keep silent**: each task is *Announced* (default) or *Silent*, set when creating or editing it (Q20, Q22) | ⏳ next |
| LLR-11.6 | **Silent** tasks and their completions never appear in anything served without the owner passcode: lists, counts, streaks, activity, dashboard aggregates or reward task lists (BR-R23). With the passcode they're shown with a 🔕 marker | ⏳ next |
| LLR-11.7 | Completing an **announced** task shows the celebration toast and a **Share on WhatsApp** prompt (prefilled text, e.g. "Done: Wipe counters 🔥 3-day streak"). Completing a **silent** task shows only a quiet "Logged" confirmation, with no share prompt (BR-R24) | ⏳ next |
| LLR-11.8 | **Due date and time** (optional): a local date and time, stored in UTC. Tasks show a chip: *Overdue* (red), *Due today*, *Due in N days* (within 7 days) or the date. The area list can be filtered by *Overdue*, *Due today* and *Due this week*, and sorted by due date | ⏳ next |
| LLR-11.9 | **Days to complete** (optional): a whole number from 1 to 3650, shown as "Planned: N days". Task detail also shows "Day X of N", counted from the task's creation date | ⏳ next |
| LLR-11.10 | Due date and days to complete are **independent**: changing one never changes the other, and they may disagree (Q21, BR-R26) | ⏳ next |
| LLR-11.11 | All four attributes can be edited on task detail at any time. A due date in the past is allowed (the task is simply overdue) | ⏳ next |
| LLR-11.12 | **Existing tasks are migrated without data loss**: milestone = no, visibility = announced, no due date, no days to complete. Nothing else changes | ⏳ next |
| LLR-11.13 | The dashboard adds an **Overdue** KPI and the *Milestones* table (LLR-11.2); the owner-only dashboard includes silent tasks, marked 🔕 | ⏳ next |

**Business rules: task planning and visibility**

| ID | Rule |
|---|---|
| BR-R22 | A task is **overdue** when it's active, has a due date, and the due date is before now. Done and archived tasks are never overdue |
| BR-R23 | **Silent means invisible without the passcode**: silent tasks, their completions, streaks and activity are excluded from every response to a caller without the owner passcode, including counts and aggregates, so their existence can't be inferred |
| BR-R24 | Celebrations and share prompts happen only for **announced** tasks. A reward unlocked by a silent task's completion is unlocked quietly (no share prompt); the reward itself stays visible |
| BR-R25 | A **Milestone completed** reward unlocks when every milestone task it matches (tagged, or in scope with *All tasks in scope*) has ≥ 1 completion. Non-milestone tasks tagged to it don't count. Progress = milestones completed ÷ milestones matched |
| BR-R26 | Due date and days to complete are never derived from each other or from the frequency |

**AC-11 (your examples)**
- *Given* the add form *when* the user opens **More options**, ticks **Milestone**, sets due "31 Oct 2026, 6:00 pm" and days to complete "30" *then* the task shows 🏁, "Due 31 Oct" and "Planned: 30 days", and task detail shows "Day 1 of 30".
- *Given* a reward "New laptop bag" with the rule **Milestone completed** tagged to the milestone "Finish React course" *when* that task is completed *then* the reward unlocks and the milestone celebration plays.
- *Given* two milestone tasks tagged to one milestone reward *when* only one is completed *then* progress shows 1 of 2 and it stays locked (BR-R25, O7).
- *Given* a **silent** task "Therapy session" *when* a visitor opens the read-only view *then* it isn't listed, the area's active count doesn't include it, and dashboard totals exclude it; with the passcode it's shown with 🔕.
- *Given* the user completes a silent task *then* only "Logged" appears: no toast and no share prompt.
- *Given* a task due yesterday that's still active *then* it shows *Overdue*; when it's completed or archived the chip disappears.
- *Given* a task with due date 10 Oct and days to complete 30 *when* the due date is moved to 20 Oct *then* days to complete stays 30.

### LLR-12 Reward ideas and wishlist (HLR-12) ⏳ next

A reward can start life as an **idea**: something you might get later, captured before any rule or task exists (Q23).

| ID | Requirement | Status |
|---|---|---|
| LLR-12.1 | **Quick capture**: a "+ Idea" button on the Rewards tab and on every tile and area screen opens a short form: title (required, 1–200), then optional **for whom**, notes (≤ 2000), link (URL), cover photo (camera or gallery, via the file rules of LLR-10.7), where seen (e.g. "City library") and tile/area. Saving needs only the title | ⏳ next |
| LLR-12.2 | **For whom** on every reward and idea: free text (1–40) with suggestions from earlier entries; default "Me" (Q25) | ⏳ next |
| LLR-12.3 | Ideas have status **Idea**: no rule, no progress and no tasks, and they never unlock or appear in progress counts (BR-R27) | ⏳ next |
| LLR-12.4 | The Rewards tab has an **Ideas** filter (and *Closed* for bought or dropped ideas), and can be filtered by **for whom**, e.g. "Shiragi's ideas and rewards". Tile and area screens list their ideas under "Rewards you can earn here" in a separate *Ideas* group | ⏳ next |
| LLR-12.5 | **Turn into a reward**: from an idea, add a rule (N completions, streak of N or milestone completed), a threshold, a tile (and optional area) and tasks. It becomes a normal *locked* reward, keeping its title, photo, link, notes and for whom; the unlock check runs straight away (BR-R28) | ⏳ next |
| LLR-12.6 | **Close an idea** as *Bought* (got it without a rule) or *Dropped* (no longer wanted). Closed ideas leave the Ideas list, stay under *Closed* with the date and outcome, and can be reopened (BR-R29) | ⏳ next |
| LLR-12.7 | Ideas are **Silent** by default (hidden from the read-only view) and can be switched to *Announced*; ordinary rewards default to *Announced*. Visibility follows the silent rules of BR-R23 (Q24) | ⏳ next |
| LLR-12.8 | Ideas are included in search (LLR-10.9) by title, notes, for whom and where seen | ⏳ next |
| LLR-12.9 | **Existing rewards are migrated without data loss**: for whom = "Me", visibility = announced; their status, rule, tasks and progress are unchanged | ⏳ next |

**Business rules: ideas**

| ID | Rule |
|---|---|
| BR-R27 | An *Idea* has no rule and no progress. It can't unlock or be claimed, and it isn't counted in reward totals or progress on the dashboard (the dashboard shows an *Ideas* count per person) |
| BR-R28 | Turning an idea into a reward requires a rule, a threshold (except *milestone completed*) and a tile (LLR-4.9); the idea's id is kept, so links and photos stay attached |
| BR-R29 | Closing is only for ideas; a reward that already has a rule is claimed, not closed. Reopening a closed idea returns it to *Idea* |
| BR-R30 | *For whom* is a label: it groups and filters rewards, but never changes who can see or edit them (visibility rules decide that) |

**AC-12 (your example)**
- *Given* the user is at the library *when* they tap "+ Idea", type "101 Hilarious Jokes", choose for whom "Shiragi", take a photo of the cover and save *then* it appears under Rewards › Ideas with the photo, for "Shiragi", saved in under 10 seconds on a phone.
- *Given* the idea *when* a visitor opens the read-only view *then* it isn't shown (silent by default); with the passcode it's listed with 🔕.
- *Given* the idea *when* the user turns it into a reward for Household › Books with the rule "streak of 7" tagged to Shiragi's task "Read 20 minutes" *then* it's a locked reward at 0 %, still with its photo, link and for whom "Shiragi".
- *Given* the user simply buys the book *when* they close the idea as *Bought* *then* it moves to *Closed* with today's date.
- *Given* the Rewards tab filtered to "Shiragi" *then* only her ideas and rewards are shown.

---

## 4. Screen requirements (MFE)

| Screen | Must show | States | Primary actions |
|---|---|---|---|
| Tiles | Tiles: icon, name, area count, active task count; "Edit tiles" mode (↑ ↓ ✎ 🗑, "+ New tile", "Add suggested tiles"); search box (LLR-10.9) | loading, error+retry; empty: "Create your first tile" + "Add suggested tiles" | open tile; create, edit, reorder, delete tile (typed-name dialog) |
| Tile (category) | Breadcrumb; areas with active count; tabs *Areas* / *Notes & contacts* | loading, error, empty ("No areas yet"), not found | add, rename (inline), reorder (↑ ↓), delete (confirm) area; edit or delete this tile; tile-level notes, contacts, files |
| Notes & contacts (tab on tile and area) | Topic groups ("General" last); per topic: last executive, contacts (role, organisation, phones with Call / WhatsApp / Copy), files (thumbnail or PDF icon, date, amount), notes | loading, error, empty ("No notes or contacts yet"), read-only (no edit controls) | add note, contact, file; edit, delete, change topic |
| Area | Breadcrumb; active count; add form (⏳ with **More options**: milestone, announce/silent, due date and time, days to complete); filters (collapsible; ⏳ milestones, overdue/due today/this week, sort by due); task rows (title, frequency, source, status, streak 🔥, priority select, ✓; ⏳ 🏁 milestone, due chip, 🔕 silent); ⏳ "Rewards you can earn here" (matching rewards with progress) | loading, error, "No tasks yet" / "No tasks match these filters"; ⏳ "No rewards for this area yet" + create link prefilled with this scope | add task, filter, reprioritise, quick complete, open task; ⏳ create reward for this area |
| Task | Breadcrumb; stats (current, best, completions); log completion (when + note); matching rewards (tagged, or ⏳ "Counts automatically") + tag select limited to in-scope rewards; settings chips; activity log | loading, error, "No completions yet", inactive-task notice | complete, tag reward, change settings |
| Rewards | Status filter (⏳ plus *Ideas* and *Closed*); ⏳ for-whom filter; ⏳ "+ Idea" quick capture; ⏳ idea cards (photo, title, for whom, where seen, *Turn into reward*, *Bought*, *Dropped*); ⏳ tile and area filters; create form (⏳ tile → area → match mode, then task picker limited to scope, grouped by area); cards: image, title, ⏳ scope breadcrumb + match mode, status, rule, progress, tags | loading, error, empty per filter; ⏳ *Needs a tile* badge | create, claim, edit tasks, ⏳ change scope (locked only) |

Touch and accessibility: controls ≥ 44 px high (chips ≥ 36 px), inputs 16 px, labelled controls, `role="radiogroup"` chips, `aria-live` toasts, focus ring visible, reduced-motion respected.

## 5. User-facing messages

| Code / situation | Message |
|---|---|
| BFF unreachable | "Can't reach the rewards service. Is the BFF running?" |
| Remote unavailable (host) | "Rewards is unavailable right now. The rewards module couldn't be loaded. The rest of the site still works." |
| Duplicate area | "'<name>' already exists in this category" |
| Complete inactive task | "Only active tasks can be completed (this one is <status>)" |
| Future completion | "completedAt cannot be in the future" |
| Claim locked reward | "This reward is still locked" |
| Unknown tagged tasks | "Unknown task ids: [..]" |
| Unlock | "🎉 Reward unlocked: <title>" |
| ⏳ Duplicate tile | "'<name>' already exists" |
| ⏳ Delete tile | "Delete <tile>? This removes <n> areas, <n> tasks, <n> completions, <n> rewards and <n> notes, contacts and files. A backup is saved first. Type <tile> to confirm." |
| ⏳ Starter set | "Added <n> tiles and <n> areas" / "You already have all the suggested tiles" |
| File too large or wrong type | "Files must be PDF, JPG, PNG, WebP or HEIC, up to 10 MB" |
| No details yet | "No notes or contacts yet. Add a customer-care number, the last executive or a bill." |
| ⏳ Milestone celebration | "🏁 Milestone reached: <title>!" (with share prompt when announced) |
| ⏳ Share text | "Done: <title> 🔥 <n>-day streak" / "Milestone reached: <title> 🏁" |
| ⏳ Silent completion | "Logged" |
| ⏳ Overdue chip | "Overdue" / "Due today" / "Due in <n> days" |
| ⏳ Milestone reward without milestones | "Tag at least one milestone task to use this rule" |
| ⏳ Idea saved | "Idea saved for <for whom>" |
| ⏳ Idea closed | "Marked as bought" / "Dropped. You can reopen it from Closed" |
| ⏳ Turn into reward | "Now a reward: <title>. Complete the tagged tasks to unlock it" |
| ⏳ Tag outside scope | "“<task>” isn't in <tile> › <area>" |
| ⏳ Area from another tile | "<area> isn't part of <tile>" |
| ⏳ Reward needs a tile | "Pick a tile for this reward to keep editing it" |
| ⏳ Narrowing scope | "Changing the scope will untag: <task list>. Continue?" |
| ⏳ AI fallback | "AI suggestions unavailable, add tasks manually" |

## 6. Detailed non-functional requirements

| ID | Requirement | Verification |
|---|---|---|
| NFR-D1 | Remote exposed chunk ≤ 50 KB gzip (now ~11 KB) | build output |
| NFR-D2 | Remote load after navigating to `#/rewards` ≤ 500 ms locally (measured ~36 ms client-side nav, ~275 ms cold) | Resource Timing |
| NFR-D3 | Dashboard issues ≤ 1 BFF read per window per 30 s | `st.cache_data` TTL |
| NFR-D4 | No horizontal scroll at 375 px width | measured `scrollWidth` = viewport |
| NFR-D5 | Stats for N tasks use one activity query (no N+1) | code review (`task_stats`) |
| NFR-D6 | Every business rule BR-R1…R30 has ≥ 1 automated test | traceability §7 |
| NFR-D8 | No schema change may delete or rewrite existing rows except as specified (LLR-4.18); every migration has an upgrade test run against a copy of a pre-migration database | migration tests |
| NFR-D9 | Uploaded files are stored outside any public web folder with random names, served only through the BFF, and count against a 2 GB soft limit on the droplet (warning shown); moving to object storage later changes no requirement | code review, upload tests |
| NFR-D10 | Search over notes, contacts and files returns in ≤ 300 ms for 5,000 items | test with generated data |
| NFR-D11 | Every read endpoint has a test that a silent task leaves no trace (item, count or aggregate) in its response without the passcode | privacy tests |
| NFR-D7 | Naive datetimes never reach storage | `UTCDateTime` raises |

## 7. Traceability matrix

| LLR | Endpoint(s) | Automated test(s) |
|---|---|---|
| LLR-1.1 (superseded) | — | replaced by `test_starter_set_contents` and the LLR-1.7 tests |
| LLR-1.3–1.5 | `POST/PATCH/DELETE /areas` | `test_area_add_rename_delete` |
| LLR-1.7–1.13; BR-R17–R19; LLR-8.10 | `/categories*` | `test_fresh_database_has_no_tiles`, `test_starter_set_is_idempotent`, `test_starter_set_fills_in_missing_areas_only`, `test_tile_crud_and_unique_names`, `test_new_tile_ids_stay_unique`, `test_reorder_tiles_and_areas`, `test_delete_tile_needs_typed_name_snapshots_and_cascades`, `test_restart_never_reseeds`, `test_upgrade_keeps_existing_tiles` |
| LLR-12.1–12.9; BR-R27–R30; LLR-8.13 | `/rewards*` | ⏳ planned: `test_idea_needs_only_title`, `test_idea_never_unlocks_or_counts`, `test_activate_idea_keeps_details_and_evaluates`, `test_close_and_reopen_idea`, `test_ideas_silent_by_default`, `test_filter_by_for_whom`, `test_migration_defaults_existing_rewards` |
| LLR-11.1–11.13; BR-R22–R26; LLR-8.12 | tasks, rewards, `/dashboard/summary` | ⏳ planned: `test_task_planning_fields_round_trip`, `test_overdue_rules`, `test_milestone_reward_needs_all_milestones`, `test_silent_tasks_invisible_without_passcode`, `test_silent_completion_has_no_celebration_flag`, `test_migration_defaults_existing_tasks` |
| LLR-10.1–10.12; BR-R20–R21; LLR-8.11 | details, files, `/search` | `test_details_grouped_by_topic_with_last_executive`, `test_tile_level_details_for_home_wide_services`, `test_contact_validation`, `test_edit_and_delete_items`, `test_file_upload_rules_and_signed_download`, `test_search_matches_names_topics_and_phone_digits`, `test_deleting_owner_removes_details_and_files`, `test_export_import_includes_details`; read-only view test comes with the passcode work |
| LLR-2.1, 2.3–2.5, 2.8, 2.9 | `POST /areas/{id}/tasks`, `GET /areas/{id}/tasks`, `PATCH /tasks/{id}`, `GET /tasks` | `test_create_filter_and_reprioritise_tasks` |
| LLR-3.1, 3.6, 3.7; BR-R2–R4 | `POST /tasks/{id}/complete`, `GET /tasks/{id}/activity`, `GET /tasks/{id}` | `test_completions_build_streak_and_activity_log`, `test_daily_streak`, `test_weekly_streak` |
| LLR-3.3–3.5; BR-R4, R5 | `POST /tasks/{id}/complete` | `test_completion_rules`, `test_one_off_streak_is_done_or_not` |
| LLR-4.1, 4.2, 4.6, 4.7; BR-R7, R9, R10 | `/rewards*` | `test_reward_unlocks_on_completion_count_then_claim`, `test_reward_already_met_unlocks_on_create_and_rejects_unknown_tasks`, `test_completions_rule_progress` |
| BR-R8 | `/rewards*` | `test_streak_reward_uses_best_current_streak_across_tasks`, `test_streak_rule_progress` |
| BR-R11 | — | `test_unlocked_reward_stays_complete_after_streak_breaks` |
| LLR-5.1, 5.9, 5.10 | `GET /dashboard/summary` | `test_dashboard_summary_is_flat_snake_case` |
| LLR-8.1 | all | `test_requires_demo_token` |
| LLR-7.x, 5.2–5.8 | — | Manual E2E (browser, 375 px); planned Playwright smoke |
| LLR-6.x | ⏳ | planned: adapter tests with `FakeVisionAdapter`, fallback tests |
| LLR-4.9–4.11, 4.16; BR-R12 | `POST/PATCH /rewards`, `PUT /rewards/{id}/tasks` | ⏳ planned: `test_reward_scope_validation`, `test_tagging_outside_scope_rejected`, `test_narrowing_scope_untags` |
| LLR-4.10; BR-R13–R15 | `POST /tasks/{id}/complete` | ⏳ planned: `test_all_in_scope_counts_untagged_and_new_tasks`, `test_other_tile_never_counts` |
| LLR-4.14, 4.15; LLR-8.8 | `GET /areas/{id}/rewards`, `GET /tasks/{id}` | ⏳ planned: `test_area_lists_matching_rewards`, `test_task_detail_lists_matching_rewards` |
| LLR-4.17 | `DELETE /areas/{id}` | ⏳ planned: `test_deleting_area_widens_reward_scope` |
| LLR-8.9; NFR-D8 | startup migrations, `app.backup` | `test_models_match_migrations`, `test_pre_migration_database_is_stamped_not_rebuilt`, `test_migrate_is_idempotent`, `test_export_import_round_trip`, `test_import_refuses_non_empty_target_without_replace` |
| LLR-4.18; BR-R16 | migration `0002_reward_scope` | ⏳ planned: `test_migration_infers_scope_and_keeps_data` (runs against a pre-migration fixture database) |
