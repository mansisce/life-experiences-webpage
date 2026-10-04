# Rewards: Deployment Plan and Action Items (T4)

| | |
|---|---|
| **Scope** | Take the Rewards MFE, BFF and Streamlit dashboard from local-only to production, then merge `feature/rewards-mfe-bff` to `main` |
| **Version** | 0.1 (plan) · 2026-10-04 |
| **Related** | [HLRD.md](HLRD.md) T4 · [LLRD.md](LLRD.md) Q13, Q17, BR-R23 · [HLD.md](HLD.md) §8 |

---

## 1. Target topology

```
Browser ──► Host shell (Vercel, existing project)         https://<host>  (mansilly.vercel.app, or <domain>)
              │ loads remoteEntry.js at runtime
              ▼
            Rewards MFE (Vercel, new static project)      https://rewards.<domain>
              │ fetch() from the host page's origin
              ▼
DigitalOcean droplet (1 GB RAM, 25 GB disk, Ubuntu 24.04)
  Caddy (HTTPS, Let's Encrypt)
    ├── api.<domain>  ──► uvicorn :8000 (Rewards BFF, 1 worker)   ─► /var/lib/rewards/rewards.db (SQLite, WAL)
    └── dash.<domain> ──► streamlit :8501 (basic auth in Caddy)        /var/lib/rewards/{photos,files}
  Litestream ──► DO Spaces bucket (continuous DB replication)
  rclone (nightly) ──► DO Spaces bucket (photos + files)
GitHub Actions: tests on every PR; on merge to main, SSH deploy of the BFF and dashboard
```

| Decision | Choice | Why |
|---|---|---|
| BFF host | DigitalOcean droplet, SQLite + Litestream | PO decision Q13. Cheap, a single file, and the JSON export keeps a later Postgres move open |
| Process model | One uvicorn worker under systemd | SQLite has one writer; one user needs no more |
| TLS / proxy | Caddy | Automatic HTTPS, so there are no certificates to manage |
| MFE host | Separate Vercel project | Deploys independently of the host (G4) |
| Dashboard host | Same droplet, behind Caddy basic auth | It needs an owner-level BFF credential and shows private data, so Streamlit Community Cloud is a poor fit |
| Go-live bar | Owner passcode and a public read-only view | The MFE currently ships `demo-token` in its JS bundle, so anyone could edit |

**Cost:** droplet about $6/mo, Spaces about $5/mo, domain about $10–15/yr, Vercel Hobby free.

---

## 2. Open decisions (needed before the phases they block)

| # | Decision | Recommendation | Blocks |
|---|---|---|---|
| D1 | Which domain name? | Buy one (e.g. via Cloudflare or Namecheap) and use `api.`, `rewards.` and `dash.` subdomains | P3, P5 |
| D2 | Move the host itself to `<domain>`? | Yes. Keep `mansilly.vercel.app` as an alias and allow both in CORS | P5 |
| D3 | Contacts and bills in the public view (HLRD §9 risk, Q17)? | **Hide notes, contacts and files from visitors**; keep tiles, tasks and rewards public | P1 |
| D4 | Public reads on at launch? | Yes, via `BFF_PUBLIC_READS=true`. It can be switched off without a deploy | P1 |
| D5 | Confirm no Neo4j data migration (HLRD §4.4) | Confirm: nothing to carry over | P8 |
| D6 | Droplet region | `BLR1` (Bangalore), close to the Asia/Kolkata users | P3 |

---

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

- Turn on `PRAGMA journal_mode=WAL` and `busy_timeout` in `app/db.py`. Litestream needs WAL.
- Make data paths configurable through env: `BFF_DATABASE_URL`, `BFF_PHOTO_DIR` and `BFF_FILES_DIR` pointing at `/var/lib/rewards`. Check that the migration backup folder follows the database path.
- Serve `/docs` and `/openapi.json` only when not in production, or only to the owner.
- Cap the upload size at the proxy (Caddy `request_body max_size`) to match the BFF's own limit.
- Add `deploy/` to the repo: `rewards-bff.service`, `rewards-dashboard.service`, `litestream.yml`, `Caddyfile`, `deploy.sh`, `rclone-backup.{service,timer}`.

### P3. Domain and droplet (owner, with Claude guiding)

1. Buy the domain (D1). Create DNS records: `api` and `dash` as **A** records pointing at the droplet IP; `rewards` (and optionally the apex or `www`) as **CNAME** to Vercel.
2. Create the droplet: Ubuntu 24.04, 1 GB, region per D6, SSH key only, monitoring on.
3. Base setup: a non-root `rewards` user, `ufw` allowing only 22, 80 and 443, `unattended-upgrades`, a **2 GB swapfile** (1 GB RAM runs uvicorn and Streamlit), `fail2ban`.
4. Install `uv`, Caddy, Litestream and rclone. Create `/opt/rewards` (git checkout) and `/var/lib/rewards` (data, owned by `rewards`, mode 700).
5. Create a DO Spaces bucket and a key pair limited to it.

### P4. Deploy the BFF and its backups

1. Put `/etc/rewards/bff.env` (mode 600) on the droplet with the P1/P2 settings and `BFF_CORS_ORIGINS='["https://<host>","https://mansilly.vercel.app"]'`. The MFE's requests come from the **host page's origin**, so the host origins are the ones CORS must allow. Add `https://rewards.<domain>` only if the MFE is used standalone.
2. Run `uv sync --frozen` in `services/bff`, then enable `rewards-bff.service` (`uvicorn app.main:app --host 127.0.0.1 --port 8000 --proxy-headers`). Startup runs the Alembic migrations.
3. Caddy: `api.<domain> { reverse_proxy 127.0.0.1:8000 }`. Check that `curl https://api.<domain>/health` returns `{"status":"ok"}`.
4. Start Litestream, replicating `rewards.db` to Spaces. **Do a restore drill:** `litestream restore` into a temp path and open it.
5. Add an rclone timer that syncs `photos/` and `files/` to Spaces nightly, plus a weekly `python -m app.backup export` JSON kept for 8 weeks.
6. Uptime check on `/health` (DO Monitoring or UptimeRobot) with email alerts. Alert when the disk passes 80%, including the 2 GB files soft limit (NFR-D9).

### P5. Deploy the MFE and wire it into the host

1. Add `apps/rewards-mfe/vercel.json`:
   - `Access-Control-Allow-Origin` for the host origin(s) on `/assets/(.*)`;
   - `Cache-Control: no-cache` on `/assets/remoteEntry.js`, because its name isn't hashed;
   - `immutable` caching on the other hashed assets;
   - no SPA rewrite.
2. Create a new Vercel project from this repo with root directory `apps/rewards-mfe`, framework Vite, and env `VITE_BFF_URL=https://api.<domain>`. Add an "Ignored Build Step" so it only rebuilds when `apps/rewards-mfe/**` changes. Attach `rewards.<domain>`.
3. In the host's Vercel project, set `VITE_REWARDS_REMOTE_URL=https://rewards.<domain>/assets/remoteEntry.js` (Production and Preview), and attach `<domain>` if D2 says so. Redeploy, because the value is baked in at build time.
4. **Known limitation:** Vercel preview URLs of the host aren't in the BFF's CORS list, so in previews Rewards shows its error states. If previews matter, add an `allow_origin_regex` for `https://*-<team>.vercel.app`.

### P6. Deploy the Streamlit dashboard

1. Enable `rewards-dashboard.service` (`streamlit run app.py --server.address 127.0.0.1 --server.port 8501 --server.headless true`) with `BFF_URL=http://127.0.0.1:8000` and `BFF_TOKEN=<service token>`.
2. Caddy: `dash.<domain> { basic_auth { owner <bcrypt-hash> } reverse_proxy 127.0.0.1:8501 }`. Streamlit needs WebSockets, which Caddy proxies by default.
3. Check memory with `free -m` after both services are up. With swap there should be headroom.

### P7. Move local data to production

Do this after P4 and before announcing the link. Your laptop stops being the source of truth after this step.

1. Stop the local BFF, then run `uv run python -m app.backup export prod-move.json`. The export covers **the database only**.
2. `scp` the JSON and the `data/photos/` and `data/files/` folders to the droplet, under `/var/lib/rewards/`, owned by `rewards`.
3. On the droplet: stop the BFF, run `uv run python -m app.backup import prod-move.json --replace`, then start the BFF.
4. Check that row counts match. Open a few tiles, an uploaded bill and a reward cover photo through the live site. Confirm Litestream has a fresh snapshot.

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
- **Migration rule:** a rollback can't undo a schema migration. Keep migrations additive. To revert one, restore the automatic pre-upgrade backup in `backups/` or use Litestream.

### P9. Verify, go live, and know how to roll back

- **Smoke test on production:** run HLRD §10 acceptance items 1–11 twice. As owner, all of them. As a visitor in a private window: no silent tasks or ideas, no details (D3), no edit controls, and 401 on direct write calls.
- **Security pass:** no token in the MFE bundle (`grep` the built JS), `/docs` hidden, file links expire, and Caddy sets HSTS.
- **Merge** `feature/rewards-mfe-bff` to `main` only after the remote and the BFF are live. This was the risk logged in HLRD §9.
- **Rollback:**

  | Component | How to roll back |
  |---|---|
  | Host | Vercel "Instant Rollback", or clear `VITE_REWARDS_REMOTE_URL`; the host then shows its fallback card |
  | MFE | Promote the previous Vercel deployment |
  | BFF | `deploy.sh <previous-sha>`. For the data, `litestream restore -timestamp …` |

---

## 4. Action items

Owner: **You** (accounts, money, secrets, decisions), **Claude** (code, config and docs in this repo), **Both** (you run it, Claude guides).

| # | Action | Phase | Owner | Depends on | Status |
|---|---|---|---|---|---|
| A1 | Decide D1–D6 | P0 | You | — | ⏳ |
| A2 | Owner passcode, `get_viewer`, `/auth/session`, rate limit, production config guard | P1 | Claude | D3, D4 | ⏳ |
| A3 | Visitor filtering for silent items and details, plus privacy tests (NFR-D11) | P1 | Claude | A2 | ⏳ |
| A4 | MFE Unlock/Lock, hide edit controls, remove the baked token; dashboard service token | P1 | Claude | A2 | ⏳ |
| A5 | WAL and busy timeout, configurable data paths, hide `/docs` in production | P2 | Claude | — | ⏳ |
| A6 | `deploy/` folder: systemd units, Caddyfile, `litestream.yml`, rclone timer, `deploy.sh` | P2 | Claude | A5 | ⏳ |
| A7 | `apps/rewards-mfe/vercel.json` (CORS and cache headers) | P5 | Claude | D1 | ⏳ |
| A8 | GitHub Actions: `rewards-ci.yml` and `deploy-bff.yml` | P8 | Claude | A6 | ⏳ |
| A9 | Buy the domain; create DNS records | P3 | You | D1 | ⏳ |
| A10 | Create and harden the droplet; install uv, Caddy, Litestream, rclone | P3 | Both | A9 | ⏳ |
| A11 | Create the DO Spaces bucket and a scoped key | P3 | You | — | ⏳ |
| A12 | Generate secrets (passcode hash, signing key, service token, basic-auth hash); write `/etc/rewards/*.env` | P4 | Both | A2, A10 | ⏳ |
| A13 | Start the BFF, Caddy and Litestream; **restore drill**; uptime and disk alerts | P4 | Both | A6, A10–A12 | ⏳ |
| A14 | Create the Vercel MFE project and its domain; set `VITE_BFF_URL` | P5 | You | A4, A7, A13 | ⏳ |
| A15 | Set `VITE_REWARDS_REMOTE_URL` on the host project and redeploy | P5 | You | A14 | ⏳ |
| A16 | Start the dashboard behind basic auth | P6 | Both | A13 | ⏳ |
| A17 | Export local data, copy photos and files, import on the droplet, verify | P7 | Both | A13, D5 | ⏳ |
| A18 | Add GitHub secrets and the `production` environment; test one deploy and one forced rollback | P8 | Both | A8, A13 | ⏳ |
| A19 | Production smoke test as owner and as visitor; security pass | P9 | Both | A15–A17 | ⏳ |
| A20 | Merge `feature/rewards-mfe-bff` to `main`; mark T4 ✅ in the HLRD | P9 | You | A19 | ⏳ |

**Critical path:** A1 → A2–A4 → A10–A13 → A14–A15 → A17 → A19 → A20. Claude's repo work (A2–A8) can run while you do the accounts and the droplet (A9–A11).
