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

### 1.2 Open items

| # | Item | Owner | Needed by |
|---|---|---|---|
| O1 | Hosting choice for the BFF (Render / Fly / Railway) and Postgres | PO | Before T4 (deploy) |
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
| Rewards | Per goal/milestone, ₹ value, claim → receive | Many-to-many with tasks; completions or streak rule; auto-unlock; claim | LLR-4.x |
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

**Business rules: rewards**

| ID | Rule |
|---|---|
| BR-R7 | *Completions* rule progress = total completions of all tagged tasks (all-time) |
| BR-R8 | *Streak* rule progress = the highest **current** streak among tagged tasks |
| BR-R9 | The unlock check runs on task completion, reward creation, reward update and tag change |
| BR-R10 | Status flow locked → unlocked → claimed only; there's no path back |
| BR-R11 | Unlocked and claimed rewards always show 100 % |

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

---

## 4. Screen requirements (MFE)

| Screen | Must show | States | Primary actions |
|---|---|---|---|
| Tiles | 3 tiles: icon, name, area count, active task count | loading, error+retry, empty | open tile |
| Tile (category) | Breadcrumb; areas with active count | loading, error, empty ("No areas yet"), not found | add, rename (inline), delete (confirm) |
| Area | Breadcrumb; active count; add form; filters (collapsible); task rows (title, frequency, source, status, streak 🔥, priority select, ✓) | loading, error, "No tasks yet" / "No tasks match these filters" | add task, filter, reprioritise, quick complete, open task |
| Task | Breadcrumb; stats (current, best, completions); log completion (when + note); rewards tagged (+ tag select); settings chips; activity log | loading, error, "No completions yet", inactive-task notice | complete, tag reward, change settings |
| Rewards | Status filter; create form (task picker grouped by area); cards: image, title, status, rule, progress, tags | loading, error, empty per filter | create, claim, edit tasks |

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
| ⏳ AI fallback | "AI suggestions unavailable, add tasks manually" |

## 6. Detailed non-functional requirements

| ID | Requirement | Verification |
|---|---|---|
| NFR-D1 | Remote exposed chunk ≤ 50 KB gzip (now ~11 KB) | build output |
| NFR-D2 | Remote load after navigating to `#/rewards` ≤ 500 ms locally (measured ~36 ms client-side nav, ~275 ms cold) | Resource Timing |
| NFR-D3 | Dashboard issues ≤ 1 BFF read per window per 30 s | `st.cache_data` TTL |
| NFR-D4 | No horizontal scroll at 375 px width | measured `scrollWidth` = viewport |
| NFR-D5 | Stats for N tasks use one activity query (no N+1) | code review (`task_stats`) |
| NFR-D6 | Every business rule BR-R1…R11 has ≥ 1 automated test | traceability §7 |
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
