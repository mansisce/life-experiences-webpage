"""FastAPI application factory.

Run locally from services/bff:   uv run fastapi dev app/main.py
Interactive API docs:            http://localhost:8000/docs
"""

import asyncio
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings
from .db import make_engine, make_sessionmaker
from .migrate import migrate
from .deps import require_demo_token
from .routers import areas, categories, dashboard, details, rewards, tasks


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Runs once on startup (before `yield`) and once on shutdown (after) — like a
        # useEffect with an empty dependency array and a cleanup function.
        # Schema changes arrive as migrations that upgrade the existing database in place (with a
        # backup first), never by recreating tables. Alembic is synchronous, so run it off the loop.
        await asyncio.to_thread(migrate, settings.database_url)
        engine = make_engine(settings.database_url)
        app.state.sessionmaker = make_sessionmaker(engine)
        settings.photo_dir.mkdir(parents=True, exist_ok=True)
        settings.files_dir.mkdir(parents=True, exist_ok=True)
        # Nothing is seeded: a new database starts with no tiles (LLR-1.7). The starter set is
        # added only on request (POST /categories/starter); existing tiles are never touched.
        yield
        await engine.dispose()

    app = FastAPI(title="Rewards BFF", version="0.1.0", lifespan=lifespan)
    app.state.settings = settings

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.get("/health", tags=["meta"])
    async def health():
        return {"status": "ok"}

    protected = [Depends(require_demo_token)]
    for router in (categories.router, areas.router, tasks.router, rewards.router, dashboard.router, details.router):
        app.include_router(router, dependencies=protected)
    # File downloads check a signed link or the header themselves (<img>/<a> can't send headers).
    app.include_router(details.download_router)
    app.include_router(rewards.cover_router)

    return app


app = create_app()
