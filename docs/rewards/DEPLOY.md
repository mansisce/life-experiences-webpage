# Rewards: Deployment Plan and Action Items (T4)

| | |
|---|---|
| **Scope** | Take the Rewards MFE, BFF and Streamlit dashboard from local-only to production, then merge `feature/rewards-mfe-bff` to `main` |
| **Budget** | **₹0 extra per month.** Reuses the DigitalOcean droplet you already pay for; everything else is on free tiers or your own machine |
| **Version** | 0.3 (zero-cost, one Vercel project) · 2026-10-04 |
| **Related** | [HLRD.md](HLRD.md) T4 · [LLRD.md](LLRD.md) Q13, Q17, BR-R23 · [HLD.md](HLD.md) §8 |

---

## 1. Target topology

```
Browser ──► Existing Vercel project (Hobby, free)         https://mansilly.vercel.app
              ├── Host shell                               /            (dist/)
              └── Rewards MFE, a separate build            /rewards-mfe/ (dist/rewards-mfe/)
                    host loads /rewards-mfe/assets/remoteEntry.js at runtime
              │ fetch() from the host page's origin
              ▼
Existing DigitalOcean droplet (already paid for)
  Caddy (free HTTPS from Let's Encrypt)
    ├── <name>-api.duckdns.org  ──► uvicorn :8000 (Rewards BFF, 1 worker) ─► /var/lib/rewards/rewards.db (SQLite, WAL)
    └── <name>-dash.duckdns.org ──► streamlit :8501 (basic auth in Caddy)     /var/lib/rewards/{photos,files}
  Hourly DB snapshot + nightly JSON export ─► /var/lib/rewards/backups (kept 14 days)
        ▲
        │ nightly pull over SSH (rsync)
Home computer ─ keeps the off-site copy of DB snapshots, photos and files
GitHub Actions (free for this repo) ─ tests on every PR; SSH deploy on merge to main
```

| Decision | Choice | Cost | Why |
|---|---|---|---|
| BFF host | **Existing droplet**, SQLite | ₹0 extra | Already paid for, always on (your preference), matches LLRD Q13 |
| Hostnames | **DuckDNS** free subdomains pointing at the droplet IP | ₹0 | No domain to buy. Caddy can get real HTTPS certificates for them. A domain can be added later by changing only env vars and CORS |
| TLS / proxy | Caddy | ₹0 | Automatic HTTPS |
| MFE host | **Same Vercel project as the host**, built separately into `dist/rewards-mfe/` | ₹0 | One project to manage, same origin so no CORS for the remote. Still a separate build loaded at runtime, and the host's fallback card still covers a load failure. Trade-off: the two deploy together (G4/G8 now read "deployed with the host"). Splitting later only means changing `VITE_REWARDS_REMOTE_URL` |
| Dashboard | Same droplet, behind Caddy basic auth | ₹0 | Holds an owner-level credential, so it stays on your own box |
| Off-site backup | **Your home computer pulls backups nightly** | ₹0 | Replaces paid DO Spaces. If the droplet dies, you lose at most a day. Optional upgrade: Litestream to the Backblaze B2 free tier (10 GB) for near-continuous backup |
| Server backups | Our own snapshots, not DO's paid Backups add-on | ₹0 | DO Backups would add 20% to the droplet bill |
| CI/CD | GitHub Actions | ₹0 | Free minutes cover this repo's tests |
| Go-live bar | Owner passcode and a public read-only view | ₹0 | The MFE currently ships `demo-token` in its JS bundle, so anyone could edit |

**Why the home computer isn't the main server:** you asked for always-on. A home server goes down with power cuts, sleep and ISP outages. As the backup target it only needs to be on at some point each day; missed nights catch up on the next run.

**Memory watch:** the droplet has 1 GB RAM. If it also runs the Weekend Picks Neo4j + Express stack (`backend/docker-compose.yml`), Neo4j alone can use 500 MB or more. Check with `free -m` / `docker stats` first (A0). If memory is tight: add a 2 GB swapfile (free), cap the Neo4j heap, or move only the dashboard to Streamlit Community Cloud (free, but it sleeps when idle).

## 2. Open decisions (needed before the phases they block)

| # | Decision | Recommendation | Blocks |
|---|---|---|---|
| D1 | DuckDNS names | e.g. `mansi-rewards-api` and `mansi-rewards-dash` (DuckDNS gives 5 free names per account) | P3 |
| D2 | ~~Name for a separate MFE Vercel project~~ | Not needed: the MFE ships in the host's project | — |
| D3 | Contacts and bills in the public view (HLRD §9 risk, Q17)? | **Hide notes, contacts and files from visitors**; keep tiles, tasks and rewards public | P1 |
| D4 | Public reads on at launch? | Yes, via `BFF_PUBLIC_READS=true`. It can be switched off without a deploy | P1 |
| D5 | Confirm no Neo4j data migration (HLRD §4.4) | Confirm: nothing to carry over | P7 |
| D6 | Keep the Weekend Picks stack on the same droplet? | Yes if A0 shows enough memory with swap. Otherwise cap the Neo4j heap | P3 |

## 3. Phases

### P1. Owner passcode and read-only view (build; blocks go-live)

Replaces `require_demo_token` (`services/bff/app/deps.py`) with two caller roles.

- **Settings:** `BFF_OWNER_PASSCODE_HASH` (scrypt, from the standard library), `BFF_PUBLIC_READS`, `BFF_SIGNING_KEY` (required in production), `BFF_SERVICE_TOKEN` (for the dashboard), and `BFF_ENV=production`, which refuses to start while the demo defaults are in use.
- **`POST /auth/session` `{passcode}`** returns a signed owner token, valid for 30 days. Failed attempts are rate-limited per IP; an in-memory limit is enough with one worker.
- **A `get_viewer` dependency** returns `owner` or `visitor`. Every write route needs `owner`. Read routes accept `visitor` only when public reads are on.
- **Visitor filtering (BR-R23):** silent tasks, their completions and streaks, silent ideas and rewards, and (per D3) details are removed from every response, including counts and dashboard aggregates.
- **Tests:** `test_silent_tasks_invisible_without_passcode`, plus one no-trace test per read endpoint (NFR-D11), the read-only details test, and writes returning 401/403 for visitors.
- **MFE:** stop baking `VITE_BFF_TOKEN` into the bundle. Add an **Unlock** button that asks for the passcode and keeps the token in `localStorage`, and a **Lock** button. Hide the edit, add, upload and claim controls for visitors.
- **Dashboard:** sends `BFF_SERVICE_TOKEN`.
- **Docs:** update LLRD 8.x, 10.11, 11.6 and 12.7 statuses.

### P2. Production hardening of the BFF (small, before first deploy)

- Turn on `PRAGMA journal_mode=WAL` and `busy_timeout` in `app/db.py`. This gives safer snapshots while the BFF is serving, and the optional Litestream needs it.
- Make data paths configurable through env: `BFF_DATABASE_URL`, `BFF_PHOTO_DIR` and `BFF_FILES_DIR` pointing at `/var/lib/rewards`. Check that the migration backup folder follows the database path.
- Serve `/docs` and `/openapi.json` only when not in production, or only to the owner.
- Cap the upload size at the proxy (Caddy `request_body max_size`) to match the BFF's own limit.
- Add `deploy/` to the repo: `rewards-bff.service`, `rewards-dashboard.service`, `Caddyfile`, `deploy.sh`, `backup.{service,timer}`, `home-pull-backup.sh`.

### P3. Prepare the existing droplet and free hostnames (owner, with Claude guiding)

1. **Health check (A0):** run `free -m`, `df -h`, `docker ps` and `docker stats --no-stream`, and note the Ubuntu version and what listens on ports 80 and 443 (`ss -tlnp`). If something else already uses 80/443 (e.g. nginx), put the new sites in that proxy instead of adding Caddy.
2. **DuckDNS:** sign in with GitHub or Google (no card), create the two names from D1, and point both at the droplet's public IP. The IP doesn't change, so no update client is needed.
3. **Base setup**, if it isn't already done:
   - a non-root `rewards` user;
   - `ufw` allowing 22, 80 and 443;
   - `unattended-upgrades` and `fail2ban`;
   - a **2 GB swapfile**.
   - While you're there, close the publicly open Neo4j ports 7474 and 7687 if they're exposed. Their password is committed in `backend/docker-compose.yml`.
4. Install `uv` and Caddy. Create `/opt/rewards` (git checkout) and `/var/lib/rewards` (data, owned by `rewards`, mode 700).

### P4. Deploy the BFF and its backups

1. Put `/etc/rewards/bff.env` (mode 600) on the droplet with the P1/P2 settings and `BFF_CORS_ORIGINS='["https://mansilly.vercel.app"]'`. The MFE's requests come from the **host page's origin**, so the host origin is the one CORS must allow. Add the MFE's own `*.vercel.app` URL only if it's used standalone.
2. Run `uv sync --frozen` in `services/bff`, then enable `rewards-bff.service` (`uvicorn app.main:app --host 127.0.0.1 --port 8000 --proxy-headers`). Startup runs the Alembic migrations.
3. Caddy: `<name>-api.duckdns.org { reverse_proxy 127.0.0.1:8000 }`. Check that `curl https://<name>-api.duckdns.org/health` returns `{"status":"ok"}`.
4. **Backups on the droplet** (systemd timers):
   - hourly `python -m app.backup snapshot`;
   - nightly `python -m app.backup export`;
   - prune anything older than 14 days.
5. **Off-site copy on the home computer:**
   - Create a read-only SSH key for a `backup` user on the droplet.
   - Schedule a nightly `rsync -a backup@<droplet>:/var/lib/rewards/{backups,photos,files} ~/rewards-backup/` (cron on Mac/Linux, Task Scheduler + WSL on Windows).
   - **Restore drill:** open the latest snapshot locally with the BFF (`BFF_DATABASE_URL` pointing at the copy) and see your data.
6. **Free monitoring:**
   - UptimeRobot's free plan checks `/health` every 5 minutes and emails you when it fails.
   - A daily cron emails, or logs, a warning when the disk passes 80%, including the 2 GB files soft limit (NFR-D9).
7. *Optional, still free:* Litestream to a Backblaze B2 bucket (10 GB free) for near-continuous DB backup. This needs WAL (P2).

### P5. Ship the MFE inside the host's Vercel project

Built and checked locally. `npm run build` at the repo root now:
1. builds the host into `dist/`;
2. installs and builds `apps/rewards-mfe` into `dist/rewards-mfe/`, with `base=/rewards-mfe/`.

A production build of the host loads `/rewards-mfe/assets/remoteEntry.js` by default, so no remote URL needs setting. Root `vercel.json` sends `Cache-Control: no-cache` for `remoteEntry.js`, because its name isn't hashed.

1. In the existing Vercel project, add the env var `VITE_BFF_URL=https://<name>-api.duckdns.org` (Production and Preview). The MFE build reads it at build time.
2. Redeploy. Check that `https://mansilly.vercel.app/rewards-mfe/assets/remoteEntry.js` returns JavaScript with `no-cache`, and that `#/rewards` mounts the app rather than the fallback card.
3. **Local development is unchanged:** `vite dev` at the root still loads the remote from `http://localhost:5180` (`npm run serve:remote` in `apps/rewards-mfe`).
4. **Known limitation:** Vercel preview URLs aren't in the BFF's CORS list, so in previews Rewards shows its error states. If previews matter, add an `allow_origin_regex` for `https://*-<team>.vercel.app`.

### P6. Deploy the Streamlit dashboard

1. Enable `rewards-dashboard.service` (`streamlit run app.py --server.address 127.0.0.1 --server.port 8501 --server.headless true`) with `BFF_URL=http://127.0.0.1:8000` and `BFF_TOKEN=<service token>`.
2. Caddy: `<name>-dash.duckdns.org { basic_auth { owner <bcrypt-hash> } reverse_proxy 127.0.0.1:8501 }`. Streamlit needs WebSockets, which Caddy proxies by default.
3. Check memory with `free -m` after both services are up. If it's tight, use the D6 fallback: Streamlit Community Cloud (free, sleeps when idle). The BFF stays on the droplet.

### P7. Move local data to production

Do this after P4 and before announcing the link. Your laptop stops being the source of truth after this step.

1. Stop the local BFF, then run `uv run python -m app.backup export prod-move.json`. The export covers **the database only**.
2. `scp` the JSON and the `data/photos/` and `data/files/` folders to the droplet, under `/var/lib/rewards/`, owned by `rewards`.
3. On the droplet: stop the BFF, run `uv run python -m app.backup import prod-move.json --replace`, then start the BFF.
4. Check that row counts match. Open a few tiles, an uploaded bill and a reward cover photo through the live site. Run the first home backup pull by hand.

### P8. CI/CD (GitHub Actions)

- **`rewards-ci.yml`** runs on PRs and pushes touching `services/bff/**`, `apps/**` or `src/**`:
  - `uv sync --frozen && uv run pytest` (BFF);
  - `npm ci && npm run build` at the root (builds the host and the MFE together, exactly as Vercel does);
  - an import smoke test for the dashboard.
- **`deploy-bff.yml`** runs on a push to `main` touching `services/bff/**` or `apps/rewards-dashboard/**`, after CI passes. It uses a GitHub `production` environment.
  - SSH as a deploy user with a dedicated key. Secrets: `DROPLET_HOST`, `DROPLET_SSH_KEY`, `DROPLET_KNOWN_HOSTS`.
  - Run `deploy/deploy.sh <sha>`: fetch, check out the commit, `uv sync --frozen`, restart the services, poll `/health` for 30 s, and if it fails, check out the previous commit and restart.
- **Frontend:** Vercel's Git integration already deploys the host and the MFE, as one project, on push. CI only gates it.
- **Migration rule:** a rollback can't undo a schema migration. Keep migrations additive. To revert one, restore the automatic pre-upgrade backup in `backups/`.

### P9. Verify, go live, and know how to roll back

- **Smoke test on production:** run HLRD §10 acceptance items 1–11 twice. As owner, all of them. As a visitor in a private window: no silent tasks or ideas, no details (D3), no edit controls, and 401 on direct write calls.
- **Security pass:** no token in the MFE bundle (`grep` the built JS), `/docs` hidden, file links expire, and Caddy sets HSTS.
- **Merge** `feature/rewards-mfe-bff` to `main` only after the remote and the BFF are live. This was the risk logged in HLRD §9.
- **Rollback:**

  | Component | How to roll back |
  |---|---|
  | Host and MFE | Vercel "Instant Rollback" to the previous deployment; it rolls back both together. To switch Rewards off alone, set `VITE_REWARDS_REMOTE_URL` to an unused path and redeploy; the host then shows its fallback card |
  | BFF | `deploy.sh <previous-sha>`. For the data, copy the last good hourly snapshot back into place |

---

## 4. Action items

Owner: **You** (accounts, secrets, decisions, the home machine), **Claude** (code, config and docs in this repo), **Both** (you run it, Claude guides).

| # | Action | Phase | Owner | Cost | Depends on | Status |
|---|---|---|---|---|---|---|
| A0 | Droplet health check (memory, disk, ports, what's running); share the output | P3 | You | ₹0 | — | ⏳ |
| A1 | Decide D1 and D3–D6 | P0 | You | ₹0 | A0 | ⏳ |
| A2 | Owner passcode, `get_viewer`, `/auth/session`, rate limit, production config guard | P1 | Claude | ₹0 | D3, D4 | ⏳ |
| A3 | Visitor filtering for silent items and details, plus privacy tests (NFR-D11) | P1 | Claude | ₹0 | A2 | ⏳ |
| A4 | MFE Unlock/Lock, hide edit controls, remove the baked token; dashboard service token | P1 | Claude | ₹0 | A2 | ⏳ |
| A5 | WAL and busy timeout, configurable data paths, hide `/docs` in production | P2 | Claude | ₹0 | — | ⏳ |
| A6 | `deploy/` folder: systemd units, Caddyfile, backup timers, `deploy.sh`, home pull script | P2 | Claude | ₹0 | A0, A5 | ⏳ |
| A7 | Combined build (root `npm run build` → `dist/rewards-mfe/`), same-origin remote URL, `no-cache` on `remoteEntry.js` | P5 | Claude | ₹0 | — | ✅ |
| A8 | GitHub Actions: `rewards-ci.yml` and `deploy-bff.yml` | P8 | Claude | ₹0 | A6 | ⏳ |
| A9 | Create the DuckDNS names and point them at the droplet IP | P3 | You | ₹0 | D1 | ⏳ |
| A10 | Droplet base setup (user, firewall, swap, close the Neo4j ports); install uv and Caddy | P3 | Both | ₹0 | A0 | ⏳ |
| A11 | Generate secrets (passcode hash, signing key, service token, basic-auth hash); write `/etc/rewards/*.env` | P4 | Both | ₹0 | A2, A10 | ⏳ |
| A12 | Start the BFF and Caddy; HTTPS works on the DuckDNS name; backup timers running | P4 | Both | ₹0 | A6, A9–A11 | ⏳ |
| A13 | Home computer: SSH key, nightly rsync pull, **restore drill** | P4 | Both | ₹0 | A12 | ⏳ |
| A14 | UptimeRobot free check on `/health`; disk alert | P4 | You | ₹0 | A12 | ⏳ |
| A15 | Set `VITE_BFF_URL` on the existing Vercel project and redeploy | P5 | You | ₹0 | A4, A12 | ⏳ |
| A16 | Check that `/rewards-mfe/assets/remoteEntry.js` is served with `no-cache` and that `#/rewards` mounts on production | P5 | You | ₹0 | A15 | ⏳ |
| A17 | Start the dashboard behind basic auth (or the Community Cloud fallback) | P6 | Both | ₹0 | A12 | ⏳ |
| A18 | Export local data, copy photos and files, import on the droplet, verify | P7 | Both | ₹0 | A12, D5 | ⏳ |
| A19 | Add GitHub secrets and the `production` environment; test one deploy and one forced rollback | P8 | Both | ₹0 | A8, A12 | ⏳ |
| A20 | Production smoke test as owner and as visitor; security pass | P9 | Both | ₹0 | A16–A18 | ⏳ |
| A21 | Merge `feature/rewards-mfe-bff` to `main`; mark T4 ✅ in the HLRD | P9 | You | ₹0 | A20 | ⏳ |

**Critical path:** A0 → A1 → A2–A4 → A9–A12 → A15–A16 → A18 → A20 → A21. Claude's repo work (A2–A8) can run while you do A0 and A9–A10.

**Optional later spend, none of it needed:** a custom domain (about ₹800–1,200 a year, swapped in through env vars and CORS only), and DO Backups (+20% of the droplet bill).
