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
    # Uploaded bills and documents (HLR-10). Private: served only through the BFF, never as static files.
    files_dir: Path = DATA_DIR / "files"
    # Key for short-lived signed download links (so <img> and <a> tags can open files without a
    # header). Empty = derive from the demo token; set a long random value in production.
    signing_key: str = ""
    # Country code added to 10-digit numbers for WhatsApp links (India).
    default_country_code: str = "91"
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
