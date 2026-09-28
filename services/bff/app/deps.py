"""Dependencies that FastAPI injects into route handlers.

Analogy: `Depends(...)` works like React context + hooks. A handler declares "I need a DB
session / the settings / the current time" in its signature, and FastAPI provides it per
request. Tests swap any of them via `app.dependency_overrides` — like wrapping a component
in a different Provider.
"""

from collections.abc import AsyncIterator
from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from .config import Settings


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


async def get_session(request: Request) -> AsyncIterator[AsyncSession]:
    # `yield` makes this a setup/teardown dependency: the session closes after the response.
    async with request.app.state.sessionmaker() as session:
        yield session


def get_now() -> datetime:
    return datetime.now(UTC)


SettingsDep = Annotated[Settings, Depends(get_settings)]
SessionDep = Annotated[AsyncSession, Depends(get_session)]
NowDep = Annotated[datetime, Depends(get_now)]


def require_demo_token(settings: SettingsDep, authorization: Annotated[str | None, Header()] = None) -> None:
    """Demo-only stand-in for auth: one shared bearer token. Real auth is out of scope."""
    if authorization != f"Bearer {settings.demo_token}":
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Missing or invalid demo token",
            headers={"WWW-Authenticate": "Bearer"},
        )
