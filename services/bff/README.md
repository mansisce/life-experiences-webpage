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
Data lives in `data/` (SQLite and photos). It's git-ignored; delete the folder to reset and re-seed.

| Layer | File | Role |
|---|---|---|
| Settings | `app/config.py` | `BFF_*` env vars, validated |
| Tables | `app/models.py` | storage shape (SQLAlchemy) |
| API shapes | `app/schemas.py` | camelCase for React/Android, flat snake_case for Streamlit |
| Rules | `app/domain.py` | streaks and unlock rules, pure functions |
| DI | `app/deps.py` | session, settings, clock, demo token |
| Routes | `app/routers/*` | areas, tasks, rewards, dashboard |
