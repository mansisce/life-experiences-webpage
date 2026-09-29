from datetime import timedelta

from fastapi.testclient import TestClient

from .conftest import FROZEN_NOW


def area_id(client: TestClient, category: str, name: str) -> int:
    categories = client.get("/categories").json()
    [area] = [a for c in categories if c["id"] == category for a in c["areas"] if a["name"] == name]
    return area["id"]


def make_task(client: TestClient, area: int, **overrides) -> dict:
    body = {"title": "Wipe counters", "priority": "medium", "frequency": "daily"} | overrides
    response = client.post(f"/areas/{area}/tasks", json=body)
    assert response.status_code == 201, response.text
    return response.json()


def complete(client: TestClient, task_id: int, days_ago: int | None = None, note: str = "") -> dict:
    body = {"note": note}
    if days_ago is not None:
        body["completedAt"] = (FROZEN_NOW - timedelta(days=days_ago)).isoformat()
    response = client.post(f"/tasks/{task_id}/complete", json=body)
    assert response.status_code == 201, response.text
    return response.json()


# ── Auth & seed ─────────────────────────────────────────────────────────────────


def test_requires_demo_token(client):
    assert client.get("/categories", headers={"Authorization": "Bearer wrong"}).status_code == 401
    assert client.get("/health", headers={"Authorization": ""}).status_code == 200


def test_starter_set_contents(client):
    """The optional starter set (LLR-1.8); `client` adds it, a fresh database has none."""
    categories = client.get("/categories").json()
    assert [c["id"] for c in categories] == ["career", "household", "fun"]
    names = {c["id"]: [a["name"] for a in c["areas"]] for c in categories}
    assert names["career"] == ["Learning", "Projects"]
    assert names["fun"] == ["Hobbies", "Outings"]
    assert len(names["household"]) == 13
    assert "Kitchen Utility Area" in names["household"] and "Kitchen Utility" not in names["household"]
    # camelCase for the React client
    assert set(categories[0]["areas"][0]) == {"id", "categoryId", "name", "activeTaskCount"}


# ── Areas ───────────────────────────────────────────────────────────────────────


def test_area_add_rename_delete(client):
    created = client.post("/areas", json={"categoryId": "fun", "name": "Gardening"})
    assert created.status_code == 201
    new_id = created.json()["id"]

    assert client.post("/areas", json={"categoryId": "fun", "name": "gardening"}).status_code == 409
    assert client.post("/areas", json={"categoryId": "nope", "name": "X"}).status_code == 404
    assert client.post("/areas", json={"categoryId": "fun", "name": ""}).status_code == 422

    assert client.patch(f"/areas/{new_id}", json={"name": "Plants"}).json()["name"] == "Plants"
    assert client.patch(f"/areas/{new_id}", json={"name": "Hobbies"}).status_code == 409

    task = make_task(client, new_id)
    assert client.delete(f"/areas/{new_id}").status_code == 204
    assert client.get(f"/areas/{new_id}").status_code == 404
    assert client.get(f"/tasks/{task['id']}").status_code == 404  # cascaded


# ── Tasks ───────────────────────────────────────────────────────────────────────


def test_create_filter_and_reprioritise_tasks(client):
    kitchen = area_id(client, "household", "Kitchen")
    low = make_task(client, kitchen, title="Descale kettle", priority="low", frequency="one_off")
    high = make_task(client, kitchen, title="Wipe counters", priority="high")
    assert low["source"] == "manual" and low["relevance"] == "relevant" and low["currentStreak"] == 0

    titles = [t["title"] for t in client.get(f"/areas/{kitchen}/tasks").json()]
    assert titles == ["Wipe counters", "Descale kettle"]  # high priority first

    assert client.patch(f"/tasks/{low['id']}", json={"priority": "high"}).json()["priority"] == "high"
    assert [t["id"] for t in client.get(f"/areas/{kitchen}/tasks?priority=low").json()] == []

    client.patch(f"/tasks/{high['id']}", json={"status": "archived"})
    active = client.get(f"/areas/{kitchen}/tasks", params={"status": "active"}).json()
    assert [t["id"] for t in active] == [low["id"]]

    all_active = client.get("/tasks", params={"status": "active"}).json()
    assert [(t["id"], t["areaName"]) for t in all_active] == [(low["id"], "Kitchen")]

    assert client.patch(f"/tasks/{low['id']}", json={"priority": "urgent"}).status_code == 422
    assert client.patch(f"/tasks/{low['id']}", json={"priority": None}).status_code == 422
    assert client.get(f"/areas/{kitchen}").json()["activeTaskCount"] == 1


def test_completions_build_streak_and_activity_log(client):
    task = make_task(client, area_id(client, "household", "Laundry"), frequency="daily")

    first = complete(client, task["id"], days_ago=1, note="Whites")
    assert first["task"]["currentStreak"] == 1
    second = complete(client, task["id"], note="Colours")
    assert second["task"]["currentStreak"] == 2
    assert second["task"]["bestStreak"] == 2
    assert complete(client, task["id"])["task"]["currentStreak"] == 2  # same day again

    log = client.get(f"/tasks/{task['id']}/activity").json()
    assert [entry["note"] for entry in log] == ["", "Colours", "Whites"]  # newest first

    detail = client.get(f"/tasks/{task['id']}").json()
    assert detail["completionCount"] == 3 and detail["area"]["name"] == "Laundry"


def test_completion_rules(client, clock):
    area = area_id(client, "career", "Learning")
    one_off = make_task(client, area, frequency="one_off")
    assert complete(client, one_off["id"])["task"]["status"] == "done"
    assert client.post(f"/tasks/{one_off['id']}/complete", json={}).status_code == 409

    daily = make_task(client, area, frequency="daily")
    future = (FROZEN_NOW + timedelta(hours=2)).isoformat()
    assert client.post(f"/tasks/{daily['id']}/complete", json={"completedAt": future}).status_code == 422

    complete(client, daily["id"])
    clock.now = FROZEN_NOW + timedelta(days=2)  # skip a day
    assert client.get(f"/tasks/{daily['id']}").json()["currentStreak"] == 0


# ── Rewards ─────────────────────────────────────────────────────────────────────


def test_reward_unlocks_on_completion_count_then_claim(client):
    """The demo flow: complete twice, tag a reward, complete once more -> unlocked."""
    task = make_task(client, area_id(client, "household", "Kitchen"))
    complete(client, task["id"], days_ago=1)
    complete(client, task["id"])

    reward = client.post(
        "/rewards", json={"title": "Coffee out", "ruleType": "completions", "threshold": 3, "categoryId": "household"}
    ).json()
    assert reward["status"] == "locked" and reward["progress"]["current"] == 0

    tagged = client.put(f"/rewards/{reward['id']}/tasks", json={"taskIds": [task["id"]]}).json()
    assert tagged["progress"] == {"current": 2, "target": 3, "percent": 67}
    assert tagged["tasks"] == [{"id": task["id"], "title": task["title"], "areaId": task["areaId"]}]

    assert client.patch(f"/rewards/{reward['id']}", json={"status": "claimed"}).status_code == 409

    result = complete(client, task["id"])
    assert [r["id"] for r in result["unlockedRewards"]] == [reward["id"]]
    assert result["unlockedRewards"][0]["status"] == "unlocked"

    claimed = client.patch(f"/rewards/{reward['id']}", json={"status": "claimed"}).json()
    assert claimed["status"] == "claimed" and claimed["claimedAt"] is not None
    assert client.get("/rewards", params={"status": "claimed"}).json()[0]["id"] == reward["id"]

    detail = client.get(f"/tasks/{task['id']}").json()
    assert detail["rewards"] == [
        {
            "id": reward["id"],
            "title": "Coffee out",
            "status": "claimed",
            "progressPercent": 100,
            "matchMode": "selected",
            "match": "tagged",
        }
    ]


def test_streak_reward_uses_best_current_streak_across_tasks(client):
    area = area_id(client, "fun", "Hobbies")
    a = make_task(client, area, title="Sketch", frequency="daily")
    b = make_task(client, area, title="Guitar", frequency="daily")
    complete(client, a["id"], days_ago=2)
    complete(client, a["id"], days_ago=1)
    complete(client, b["id"])

    reward = client.post(
        "/rewards",
        json={
            "title": "New brushes",
            "ruleType": "streak",
            "threshold": 3,
            "categoryId": "fun",
            "taskIds": [a["id"], b["id"]],
        },
    ).json()
    assert reward["progress"]["current"] == 2 and reward["status"] == "locked"
    assert complete(client, a["id"])["unlockedRewards"][0]["title"] == "New brushes"


def test_reward_already_met_unlocks_on_create_and_rejects_unknown_tasks(client):
    task = make_task(client, area_id(client, "fun", "Outings"))
    complete(client, task["id"])
    reward = client.post(
        "/rewards",
        json={"title": "Movie", "ruleType": "completions", "threshold": 1, "categoryId": "fun", "taskIds": [task["id"]]},
    ).json()
    assert reward["status"] == "unlocked"

    bad = client.post(
        "/rewards", json={"title": "X", "ruleType": "completions", "threshold": 1, "categoryId": "fun", "taskIds": [999]}
    )
    assert bad.status_code == 422
    points = {"title": "X", "ruleType": "points", "threshold": 1, "categoryId": "fun"}
    assert client.post("/rewards", json=points).status_code == 422


# ── Dashboard (BFF: different shape for a different client) ────────────────────


def test_dashboard_summary_is_flat_snake_case(client):
    kitchen = area_id(client, "household", "Kitchen")
    task = make_task(client, kitchen)
    complete(client, task["id"], days_ago=1)
    complete(client, task["id"])
    complete(client, task["id"], days_ago=40)
    client.post(
        "/rewards",
        json={"title": "Treat", "ruleType": "streak", "threshold": 5, "categoryId": "household", "taskIds": [task["id"]]},
    )

    summary = client.get("/dashboard/summary").json()
    assert summary["totals"]["completions"] == 3
    assert summary["totals"]["active_streaks"] == 1
    household = next(c for c in summary["completions_by_category"] if c["category_id"] == "household")
    assert household["completions"] == 3
    assert summary["streaks"][0]["task_title"] == "Wipe counters"
    assert summary["streaks"][0]["current_streak"] == 2
    assert summary["rewards"][0]["percent"] == 40
    assert summary["suggestions"] == {
        "relevant": 0, "not_relevant": 0, "ignore": 0, "pending": 0, "acceptance_rate": None
    }

    windowed = client.get("/dashboard/summary", params={"days": 7}).json()
    assert windowed["totals"]["completions"] == 2 and windowed["window_days"] == 7
