"""Runtime settings, read from environment variables (prefix BFF_) or services/bff/.env.

Analogy: this is the Python equivalent of `import.meta.env` in Vite, except the values are
validated and typed by Pydantic when the app starts, so a bad value fails fast.
"""

from pathlib import Path
from zoneinfo import ZoneInfo

from pydantic_settings import BaseSettings, SettingsConfigDict

BFF_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = BFF_ROOT / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="BFF_", env_file=BFF_ROOT / ".env", extra="ignore")

    database_url: str = f"sqlite+aiosqlite:///{(DATA_DIR / 'rewards.db').as_posix()}"
    photo_dir: Path = DATA_DIR / "photos"
    # Demo-only shared token instead of real auth. Clients send `Authorization: Bearer <token>`.
    demo_token: str = "demo-token"
    # JSON list in env, e.g. BFF_CORS_ORIGINS='["https://mansilly.vercel.app"]'
    cors_origins: list[str] = [
        "http://localhost:5173",  # host shell (vite dev)
        "http://localhost:5180",  # rewards-mfe (vite preview)
        "http://localhost:8501",  # Streamlit dashboard
        "https://mansilly.vercel.app",
    ]
    # Streaks are counted in the user's local calendar days/weeks.
    timezone: str = "Asia/Kolkata"

    @property
    def tz(self) -> ZoneInfo:
        return ZoneInfo(self.timezone)
