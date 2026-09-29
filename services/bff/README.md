# Rewards BFF (FastAPI)

One backend-for-frontend for the Rewards microfrontend, the Streamlit dashboard and, later, the Android app.

```bash
cd services/bff
uv sync                          # install deps into .venv (like `npm install`)
uv run fastapi dev app/main.py   # http://localhost:8000, auto-reload (like `vite dev`)
uv run pytest                    # tests
```

Interactive docs: http://localhost:8000/docs. Click **Authorize** and enter `demo-token`.

Every endpoint except `/health` needs `Authorization: Bearer demo-token` (a demo stand-in for real auth).
## Your data

Data lives in `data/` (`rewards.db` plus photos). It's git-ignored, so git never touches it, but `git clean -x` would delete it.

- **Schema changes never wipe data.** On startup the BFF runs Alembic migrations (`app/migrate.py`), which upgrade the existing file in place. A database from before migrations is stamped as the baseline, untouched. Before any upgrade, a copy is saved to `data/backups/` (the last 10 automatic copies are kept).
- **Backups and moving data:**

```bash
uv run python -m app.backup snapshot            # consistent copy of rewards.db -> data/backups/
uv run python -m app.backup export              # every table -> data/backups/rewards-<time>.json
uv run python -m app.backup import file.json    # load into an empty database (add --replace to overwrite)
```

The JSON export is database-neutral: the same file loads into SQLite on the droplet or into Postgres later.
To move to the server, either copy `rewards.db` (with the BFF stopped) or export here and import there.

| Layer | File | Role |
|---|---|---|
| Settings | `app/config.py` | `BFF_*` env vars, validated |
| Tables | `app/models.py` | storage shape (SQLAlchemy) |
| API shapes | `app/schemas.py` | camelCase for React/Android, flat snake_case for Streamlit |
| Rules | `app/domain.py` | streaks and unlock rules, pure functions |
| DI | `app/deps.py` | session, settings, clock, demo token |
| Routes | `app/routers/*` | areas, tasks, rewards, dashboard |
| Migrations | `app/migrate.py`, `migrations/` | versioned schema changes, pre-upgrade backups |
| Backup | `app/backup.py` | snapshot, JSON export/import |
