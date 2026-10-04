# Rewards: Deployment Plan and Action Items (T4)

| | |
|---|---|
| **Scope** | Take the Rewards MFE, BFF and Streamlit dashboard from local-only to production, then merge `feature/rewards-mfe-bff` to `main` |
| **Budget** | **₹0 extra per month.** Reuses the DigitalOcean droplet you already pay for; everything else is on free tiers or your own machine |
| **Version** | 0.4 (zero-cost; Rewards as its own app) · 2026-10-04 |
| **Related** | [HLRD.md](HLRD.md) T4 · [LLRD.md](LLRD.md) Q13, Q17, BR-R23 · [HLD.md](HLD.md) §8 |

---

## 1. Target topology

```
Browser ──► Host shell (Vercel Hobby, existing)            https://mansilly.vercel.app
              │ loads remoteEntry.js at runtime
              ▼
            Rewards app (Vercel Hobby, 2nd free project)   https://<mfe-project>.vercel.app
              │   = standalone app at /   +   remoteEntry.js for the host
              │ fetch() from either origin
              ▼
Existing DigitalOcean droplet (already paid for)
  nginx, already running (free HTTPS from Let's Encrypt via certbot)
    ├── <name>-api.duckdns.org  ──► uvicorn :8000 (Rewards BFF, 1 worker) ─► /var/lib/rewards/rewards.db (SQLite, WAL)
    └── <name>-dash.duckdns.org ──► streamlit :8501 (basic auth in nginx)     /var/lib/rewards/{photos,files}
  Hourly DB snapshot + nightly JSON export ─► /var/lib/rewards/backups (kept 14 days)
        ▲
        │ nightly pull over SSH (rsync)
Home computer ─ keeps the off-site copy of DB snapshots, photos and files
GitHub Actions (free for this repo) ─ tests on every PR; SSH deploy on merge to main
```

| Decision | Choice | Cost | Why |
|---|---|---|---|
| BFF host | **Existing droplet**, SQLite | ₹0 extra | Already paid for, always on (your preference), matches LLRD Q13 |
| Hostnames | **DuckDNS** free subdomains pointing at the droplet IP | ₹0 | No domain to buy. certbot can get real HTTPS certificates for them. A domain can be added later by changing only env vars and CORS |
| TLS / proxy | **The droplet's existing nginx**, with certbot | ₹0 | nginx already owns ports 80/443 (A0), so the Rewards sites are added as new nginx server blocks; certbot renews certificates automatically |
| MFE host | Second Vercel Hobby project, from `apps/rewards-mfe` in this repo | ₹0 | Rewards is its own app, with a standalone URL, so it can grow into a product. The personal site still embeds it on `#/rewards`. It deploys independently of the host (G4) |
| Dashboard | Same droplet, behind nginx basic auth | ₹0 | Holds an owner-level credential, so it stays on your own box |
| Off-site backup | **Your home computer pulls backups nightly** | ₹0 | Replaces paid DO Spaces. If the droplet dies, you lose at most a day. Optional upgrade: Litestream to the Backblaze B2 free tier (10 GB) for near-continuous backup |
| Server backups | Our own snapshots, not DO's paid Backups add-on | ₹0 | DO Backups would add 20% to the droplet bill |
| CI/CD | GitHub Actions | ₹0 | Free minutes cover this repo's tests |
| Go-live bar | Owner passcode and a public read-only view | ₹0 | The MFE currently ships `demo-token` in its JS bundle, so anyone could edit |

**Product path (later, not blocking go-live):**
- **Vercel Hobby is non-commercial.** If Rewards is ever sold, move the frontend to a host that allows commercial use. Cloudflare Pages and Netlify have free plans that do; the same static build runs on either, so only the URL and CORS change.
- **Split the code into its own repo** after go-live: `apps/rewards-mfe`, `services/bff`, `apps/rewards-dashboard` and `docs/rewards`.
- **Multi-user accounts** come only when others sign up.

**Why the home computer isn't the main server:** you asked for always-on. A home server goes down with power cuts, sleep and ISP outages. As the backup target it only needs to be on at some point each day; missed nights catch up on the next run.

**Droplet check (A0), done 2026-10-04:**

| Check | Result | What it means |
|---|---|---|
| Plan | `s-1vcpu-1gb`, region BLR1 | Matches D6 |
| Memory | 961 MB total, about 540 MB available, **no swap** | Rewards needs about 250–350 MB, so it fits only with headroom. **Add a 2 GB swapfile first** (A10) |
| Disk | 24 GB, 20 GB free | Plenty for swap, code, data and backups |
| Ports 80/443 | **nginx** | Use nginx and certbot, not Caddy |
| Port 3000 | Container `beegle-beegle-1` (the separate Beegle app), published on `0.0.0.0`, so open to the internet | If nginx already proxies it (`grep -r 3000 /etc/nginx/`), change its compose port to `127.0.0.1:3000:3000` and recreate it. **`ufw` can't close it**, because Docker's published ports bypass ufw. Not a Rewards blocker |
| Neo4j (7474/7687) | Not listening | The Weekend Picks Neo4j isn't running here, so the memory concern and the exposed-password risk don't apply on this droplet |

If memory is still tight with swap, move only the dashboard to Streamlit Community Cloud (free, but it sleeps when idle).

## 2. Open decisions (needed before the phases they block)

| # | Decision | Recommendation | Blocks |
|---|---|---|---|
| D1 | DuckDNS names | e.g. `mansi-rewards-api` and `mansi-rewards-dash` (DuckDNS gives 5 free names per account) | P3 |
| D2 | Name for the MFE's Vercel project | e.g. `mansilly-rewards`, which gives `mansilly-rewards.vercel.app` | P5 |
| D3 | Contacts and bills in the public view (HLRD §9 risk, Q17)? | **Hide notes, contacts and files from visitors**; keep tiles, tasks and rewards public | P1 |
| D4 | Public reads on at launch? | Yes, via `BFF_PUBLIC_READS=true`. It can be switched off without a deploy | P1 |
| D5 | Confirm no Neo4j data migration (HLRD §4.4) | Confirm: nothing to carry over | P7 |
| D6 | ~~Keep the Weekend Picks stack on the same droplet?~~ | Settled by A0: Neo4j isn't running on the droplet. Only the port-3000 container shares it | — |

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
- Cap the upload size at the proxy (nginx `client_max_body_size`) to match the BFF's own limit. nginx's 1 MB default would reject bill and photo uploads.
- Add `deploy/` to the repo: `rewards-bff.service`, `rewards-dashboard.service`, `nginx/rewards-api.conf`, `nginx/rewards-dash.conf`, `deploy.sh`, `backup.{service,timer}`, `home-pull-backup.sh`.

### P3. Prepare the existing droplet and free hostnames (owner, with Claude guiding)

1. **Health check (A0):** ✅ done; results in §1. Port 3000 is the Beegle app. Still to do: check whether nginx proxies it, list the existing nginx sites (`ls /etc/nginx/sites-enabled`) so the new ones don't clash, and run `ufw status`.
2. **DuckDNS:** sign in with GitHub or Google (no card), create the two names from D1, and point both at the droplet's public IP. The IP doesn't change, so no update client is needed.
3. **Base setup**, if it isn't already done:
   - a non-root `rewards` user;
   - `ufw` allowing 22, 80 and 443;
   - `unattended-upgrades` and `fail2ban`;
   - a **2 GB swapfile**.
   - Close port 3000 to the outside if nginx already serves that app.
4. Install `uv` and `certbot` (`apt install certbot python3-certbot-nginx`). nginx is already there. Create `/opt/rewards` (git checkout) and `/var/lib/rewards` (data, owned by `rewards`, mode 700).

### P4. Deploy the BFF and its backups

1. Put `/etc/rewards/bff.env` (mode 600) on the droplet with the P1/P2 settings and `BFF_CORS_ORIGINS='["https://mansilly.vercel.app","https://<mfe-project>.vercel.app"]'`. Both origins call the BFF: embedded Rewards calls from the host page's origin, and the standalone app calls from its own.
2. Run `uv sync --frozen` in `services/bff`, then enable `rewards-bff.service` (`uvicorn app.main:app --host 127.0.0.1 --port 8000 --proxy-headers`). Startup runs the Alembic migrations.
3. nginx: add `/etc/nginx/sites-available/rewards-api` (from `deploy/nginx/rewards-api.conf`) with `server_name <name>-api.duckdns.org`, `proxy_pass http://127.0.0.1:8000`, the forwarded headers and `client_max_body_size`. Enable it, run `nginx -t && systemctl reload nginx`, then `certbot --nginx -d <name>-api.duckdns.org` for HTTPS. Check that `curl https://<name>-api.duckdns.org/health` returns `{"status":"ok"}`.
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

### P5. Deploy the MFE and wire it into the host

1. ✅ `apps/rewards-mfe/vercel.json` is in the repo:
   - `Access-Control-Allow-Origin: *` on `/assets/*`. These are public static JS files; the BFF is what enforces CORS for data;
   - `Cache-Control: no-cache` on `remoteEntry.js`, because its name isn't hashed;
   - an `ignoreCommand`, so the project only rebuilds when `apps/rewards-mfe/` changes.
   
   The standalone app is served at `/` and opens on `#/rewards`. Checked locally: the site's `#/rewards` loads the module from the separate deployment, and the standalone page works on its own.
2. Create a second **Hobby (free)** Vercel project from this repo, named per D2, with root directory `apps/rewards-mfe`, framework Vite, and env `VITE_BFF_URL=https://<name>-api.duckdns.org`. The rebuild filter comes from `vercel.json`.
3. In the host's Vercel project, set `VITE_REWARDS_REMOTE_URL=https://<mfe-project>.vercel.app/assets/remoteEntry.js` (Production and Preview). Redeploy, because the value is baked in at build time.
4. **Known limitation:** Vercel preview URLs of the host aren't in the BFF's CORS list, so in previews Rewards shows its error states. If previews matter, add an `allow_origin_regex` for `https://*-<team>.vercel.app`.

### P6. Deploy the Streamlit dashboard

1. Enable `rewards-dashboard.service` (`streamlit run app.py --server.address 127.0.0.1 --server.port 8501 --server.headless true`) with `BFF_URL=http://127.0.0.1:8000` and `BFF_TOKEN=<service token>`.
2. nginx: `deploy/nginx/rewards-dash.conf` with `auth_basic` (password file from `htpasswd`, in the `apache2-utils` package) and `proxy_pass http://127.0.0.1:8501`. Streamlit needs WebSockets, so set `proxy_http_version 1.1` and the `Upgrade`/`Connection` headers. Then run `certbot --nginx -d <name>-dash.duckdns.org`.
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
  - `npm ci && npm run build` (MFE);
  - `npm ci && npm run build` (host);
  - an import smoke test for the dashboard.
- **`deploy-bff.yml`** runs on a push to `main` touching `services/bff/**` or `apps/rewards-dashboard/**`, after CI passes. It uses a GitHub `production` environment.
  - SSH as a deploy user with a dedicated key. Secrets: `DROPLET_HOST`, `DROPLET_SSH_KEY`, `DROPLET_KNOWN_HOSTS`.
  - Run `deploy/deploy.sh <sha>`: fetch, check out the commit, `uv sync --frozen`, restart the services, poll `/health` for 30 s, and if it fails, check out the previous commit and restart.
- **Frontends:** Vercel's Git integration already deploys the host and the MFE on push. CI only gates them.
- **Migration rule:** a rollback can't undo a schema migration. Keep migrations additive. To revert one, restore the automatic pre-upgrade backup in `backups/`.

### P9. Verify, go live, and know how to roll back

- **Smoke test on production:** run HLRD §10 acceptance items 1–11 twice. As owner, all of them. As a visitor in a private window: no silent tasks or ideas, no details (D3), no edit controls, and 401 on direct write calls.
- **Security pass:** no token in the MFE bundle (`grep` the built JS), `/docs` hidden, file links expire, and nginx sends HSTS on the Rewards sites.
- **Merge** `feature/rewards-mfe-bff` to `main` only after the remote and the BFF are live. This was the risk logged in HLRD §9.
- **Rollback:**

  | Component | How to roll back |
  |---|---|
  | Host | Vercel "Instant Rollback", or clear `VITE_REWARDS_REMOTE_URL`; the host then shows its fallback card |
  | MFE | Promote the previous Vercel deployment |
  | BFF | `deploy.sh <previous-sha>`. For the data, copy the last good hourly snapshot back into place |

---

## 4. Action items

Owner: **You** (accounts, secrets, decisions, the home machine), **Claude** (code, config and docs in this repo), **Both** (you run it, Claude guides).

| # | Action | Phase | Owner | Cost | Depends on | Status |
|---|---|---|---|---|---|---|
| A0 | Droplet health check (memory, disk, ports, what's running); share the output | P3 | You | ₹0 | — | ✅ (port-3000 container and nginx site list still to check) |
| A1 | Decide D1–D5 | P0 | You | ₹0 | A0 | ⏳ |
| A2 | Owner passcode, `get_viewer`, `/auth/session`, rate limit, production config guard | P1 | Claude | ₹0 | D3, D4 | ⏳ |
| A3 | Visitor filtering for silent items and details, plus privacy tests (NFR-D11) | P1 | Claude | ₹0 | A2 | ⏳ |
| A4 | MFE Unlock/Lock, hide edit controls, remove the baked token; dashboard service token | P1 | Claude | ₹0 | A2 | ⏳ |
| A5 | WAL and busy timeout, configurable data paths, hide `/docs` in production | P2 | Claude | ₹0 | — | ⏳ |
| A6 | `deploy/` folder: systemd units, nginx site configs, backup timers, `deploy.sh`, home pull script | P2 | Claude | ₹0 | A0, A5 | ⏳ |
| A7 | `apps/rewards-mfe/vercel.json` (CORS, cache headers, rebuild filter) | P5 | Claude | ₹0 | — | ✅ |
| A8 | GitHub Actions: `rewards-ci.yml` and `deploy-bff.yml` | P8 | Claude | ₹0 | A6 | ⏳ |
| A9 | Create the DuckDNS names and point them at the droplet IP | P3 | You | ₹0 | D1 | ⏳ |
| A10 | Droplet base setup (**2 GB swap first**, user, firewall, close port 3000 if nginx serves it); install uv and certbot | P3 | Both | ₹0 | A0 | ⏳ |
| A11 | Generate secrets (passcode hash, signing key, service token, basic-auth hash); write `/etc/rewards/*.env` | P4 | Both | ₹0 | A2, A10 | ⏳ |
| A12 | Start the BFF; add the nginx site and certbot certificate; HTTPS works on the DuckDNS name; backup timers running | P4 | Both | ₹0 | A6, A9–A11 | ⏳ |
| A13 | Home computer: SSH key, nightly rsync pull, **restore drill** | P4 | Both | ₹0 | A12 | ⏳ |
| A14 | UptimeRobot free check on `/health`; disk alert | P4 | You | ₹0 | A12 | ⏳ |
| A15 | Create the second Vercel Hobby project (root directory `apps/rewards-mfe`); set `VITE_BFF_URL`; open its URL and check the standalone app | P5 | You | ₹0 | A4, A12 | ⏳ |
| A16 | Set `VITE_REWARDS_REMOTE_URL` on the host project and redeploy | P5 | You | ₹0 | A15 | ⏳ |
| A17 | Start the dashboard behind basic auth (or the Community Cloud fallback) | P6 | Both | ₹0 | A12 | ⏳ |
| A18 | Export local data, copy photos and files, import on the droplet, verify | P7 | Both | ₹0 | A12, D5 | ⏳ |
| A19 | Add GitHub secrets and the `production` environment; test one deploy and one forced rollback | P8 | Both | ₹0 | A8, A12 | ⏳ |
| A20 | Production smoke test as owner and as visitor; security pass | P9 | Both | ₹0 | A16–A18 | ⏳ |
| A21 | Merge `feature/rewards-mfe-bff` to `main`; mark T4 ✅ in the HLRD | P9 | You | ₹0 | A20 | ⏳ |

**Critical path:** A0 → A1 → A2–A4 → A9–A12 → A15–A16 → A18 → A20 → A21. Claude's repo work (A2–A8) can run while you do A0 and A9–A10.

**After go-live:** split the Rewards code into its own repo (not blocking deployment).

**Optional later spend, none of it needed:** a custom domain (about ₹800–1,200 a year, swapped in through env vars and CORS only), and DO Backups (+20% of the droplet bill).
