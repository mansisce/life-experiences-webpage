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
| Q1 | Which tiles exist and are they editable? | 3 fixed tiles (Career/Office/Work, Household, Fun); **areas** are editable | Brief |
| Q2 | Household seed list? | Kitchen, Kitchen Utility Area, Laundry, Master Bathroom, Guest Bathroom, Master Bedroom, Guest Room, Hall, Balcony, Books, Makeup, Wardrobe, Shiragi Toys (13). "Kitchen Utility" dropped as a duplicate | PO decision, 2026-09-28 |
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

### 1.2 Open items

| # | Item | Owner | Needed by |
|---|---|---|---|
| O1 | ~~Hosting choice~~ Closed by Q13 | PO | — |
| O5 | Can one reward ever span two tiles (e.g. a treat for Career + Fun)? Current rule: no; create one reward per tile. Revisit if it comes up in real use | PO | Before HLR-9 build |
| O2 | Confirm no data needs migrating from the old Neo4j rewards | PO | Before merging to `main` |
| O3 | Reminder channel for the web (push vs email) | PO | Integration phase |
| O4 | Claude model and per-request cost budget for vision | PO | Phase 4 |

---

## 2. Feature-level As-Is → To-Be

| Feature | As-Is (old in-site rewards) | To-Be (Rewards MFE) | LLR |
|---|---|---|---|
| Navigation | Goals / Rewards tabs, modal-heavy | Tiles → Areas → Area → Task; Rewards tab; deep links `#/rewards/...` | LLR-1, LLR-7 |
| Categories | 6 fixed + custom categories for goals | 3 fixed tiles; add/rename/delete areas | LLR-1.x |
| Unit of work | Goal (title, description, type, target days) | Task (title, notes, priority, frequency, status, relevance, source) | LLR-2.x |
| Logging | "Log today": did it?, duration, note | Complete now or backfill 1–2 days; note | LLR-3.x |
| Streak | Daily streak per goal | Per task, daily or weekly periods; current + best | LLR-3.x |
| Milestones | Day-number milestones per goal | Replaced by reward rules (streak of N) | LLR-4.x |
| Rewards | Per goal/milestone, ₹ value, claim → receive | Many-to-many with tasks; completions or streak rule; auto-unlock; claim | LLR-4.1–4.8 |
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
| LLR-1.1 | On first start the system seeds tiles and areas per Q2. Seeding never runs again once any tile exists (user edits are preserved) | ✅ |
| LLR-1.2 | The tiles screen shows each tile's icon, name, area count and active task count | 🟡 |
| LLR-1.3 | The user can add an area to a tile. The name is 1–80 characters, trimmed, and **unique within the tile ignoring case** | ✅ |
| LLR-1.4 | The user can rename an area under the same rules as LLR-1.3 | ✅ |
| LLR-1.5 | The user can delete an area after confirmation. Its tasks, completions, photos and suggestions are removed with it | ✅ |
| LLR-1.6 | The confirmation text states how many active tasks will be deleted | 🟡 |

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

---

## 4. Screen requirements (MFE)

| Screen | Must show | States | Primary actions |
|---|---|---|---|
| Tiles | 3 tiles: icon, name, area count, active task count | loading, error+retry, empty | open tile |
| Tile (category) | Breadcrumb; areas with active count | loading, error, empty ("No areas yet"), not found | add, rename (inline), delete (confirm) |
| Area | Breadcrumb; active count; add form; filters (collapsible); task rows (title, frequency, source, status, streak 🔥, priority select, ✓); ⏳ "Rewards you can earn here" (matching rewards with progress) | loading, error, "No tasks yet" / "No tasks match these filters"; ⏳ "No rewards for this area yet" + create link prefilled with this scope | add task, filter, reprioritise, quick complete, open task; ⏳ create reward for this area |
| Task | Breadcrumb; stats (current, best, completions); log completion (when + note); matching rewards (tagged, or ⏳ "Counts automatically") + tag select limited to in-scope rewards; settings chips; activity log | loading, error, "No completions yet", inactive-task notice | complete, tag reward, change settings |
| Rewards | Status filter; ⏳ tile and area filters; create form (⏳ tile → area → match mode, then task picker limited to scope, grouped by area); cards: image, title, ⏳ scope breadcrumb + match mode, status, rule, progress, tags | loading, error, empty per filter; ⏳ *Needs a tile* badge | create, claim, edit tasks, ⏳ change scope (locked only) |

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
| NFR-D6 | Every business rule BR-R1…R16 has ≥ 1 automated test | traceability §7 |
| NFR-D8 | No schema change may delete or rewrite existing rows except as specified (LLR-4.18); every migration has an upgrade test run against a copy of a pre-migration database | migration tests |
| NFR-D7 | Naive datetimes never reach storage | `UTCDateTime` raises |

## 7. Traceability matrix

| LLR | Endpoint(s) | Automated test(s) |
|---|---|---|
| LLR-1.1 | lifespan seed, `GET /categories` | `test_seeded_tiles_and_sub_tiles` |
| LLR-1.3–1.5 | `POST/PATCH/DELETE /areas` | `test_area_add_rename_delete` |
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
