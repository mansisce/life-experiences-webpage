"""FastAPI application factory.

Run locally from services/bff:   uv run fastapi dev app/main.py
Interactive API docs:            http://localhost:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings
from .db import Base, make_engine, make_sessionmaker
from .deps import require_demo_token
from .routers import areas, dashboard, rewards, tasks
from .seed import seed_if_empty


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Runs once on startup (before `yield`) and once on shutdown (after) — like a
        # useEffect with an empty dependency array and a cleanup function.
        engine = make_engine(settings.database_url)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)  # MVP: no migrations, create missing tables
        app.state.sessionmaker = make_sessionmaker(engine)
        settings.photo_dir.mkdir(parents=True, exist_ok=True)
        async with app.state.sessionmaker() as session:
            await seed_if_empty(session)
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
    for router in (areas.router, tasks.router, rewards.router, dashboard.router):
        app.include_router(router, dependencies=protected)

    return app


app = create_app()
