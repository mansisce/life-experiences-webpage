"""Thin HTTP client for the Rewards BFF. The dashboard never touches the database directly.

Analogy: this is the dashboard's equivalent of the React MFE's src/api.js.
"""

import httpx


class BffError(Exception):
    """Any failure talking to the BFF, with a message that's safe to show on screen."""


class BffClient:
    def __init__(self, base_url: str, token: str, timeout: float = 5.0):
        self.base_url = base_url.rstrip("/")
        self.headers = {"Authorization": f"Bearer {token}"}
        self.timeout = timeout

    def _request(self, method: str, path: str, **kwargs) -> dict:
        try:
            response = httpx.request(
                method, f"{self.base_url}{path}", headers=self.headers, timeout=self.timeout, **kwargs
            )
        except httpx.HTTPError as exc:
            raise BffError(f"Can't reach the rewards BFF at {self.base_url}. Is it running?") from exc
        if response.is_error:
            try:
                detail = response.json().get("detail")
            except ValueError:
                detail = None
            raise BffError(f"BFF returned {response.status_code}: {detail or response.reason_phrase}")
        return response.json()

    def summary(self, days: int | None = None) -> dict:
        """The Streamlit-shaped aggregate: flat, snake_case tables (see BFF /dashboard/summary)."""
        return self._request("GET", "/dashboard/summary", params={"days": days} if days else None)

    def claim_reward(self, reward_id: int) -> dict:
        return self._request("PATCH", f"/rewards/{reward_id}", json={"status": "claimed"})
