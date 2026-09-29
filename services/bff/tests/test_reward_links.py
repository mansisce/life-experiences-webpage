"""Rewards stand alone and are linked to any tasks (many-to-many); a reward unlocks when its linked
tasks have been done N times in total. Older rewards scoped to a tile/area keep working."""

import sqlite3

from alembic import command

from app.migrate import alembic_config, migrate

from .test_api import area_id, complete, make_task


def make_reward(client, title="Treat", **fields):
    response = client.post("/rewards", json={"title": title, **fields})
    assert response.status_code == 201, response.text
    return response.json()


def link(client, reward_id, task_id):
    response = client.post(f"/rewards/{reward_id}/tasks/{task_id}")
    assert response.status_code == 200, response.text
    return response.json()


def test_reward_needs_only_a_title(client):
    reward = make_reward(client, "Coffee out")
    assert (reward["ruleType"], reward["threshold"], reward["status"]) == ("completions", 5, "locked")
    assert reward["connected"] is False and reward["tasks"] == []
    assert reward["areaId"] is None and reward["categoryId"] is None  # an area is optional

    assert client.post("/rewards", json={"title": ""}).status_code == 422
    assert client.post("/rewards", json={"title": "X", "threshold": 0}).status_code == 422
    assert client.post("/rewards", json={"title": "X", "taskIds": [999]}).status_code == 422
    assert client.get(f"/rewards/{reward['id']}").json() == reward
    assert client.get("/rewards/99999").status_code == 404


def test_area_rewards_are_kept_in_an_area_but_link_anywhere(client):
    kitchen = area_id(client, "household", "Kitchen")
    hobbies = area_id(client, "fun", "Hobbies")
    kept = make_reward(client, "Coffee out", areaId=kitchen)
    make_reward(client, "Not in an area")
    assert (kept["categoryId"], kept["categoryName"], kept["areaName"]) == ("household", "Household", "Kitchen")
    assert [r["id"] for r in client.get("/rewards", params={"areaId": kitchen}).json()] == [kept["id"]]
    assert len(client.get("/rewards").json()) == 2  # the full list has every reward
    assert client.post("/rewards", json={"title": "X", "areaId": 99999}).status_code == 422

    # Its area never limits which tasks can be linked.
    guitar = make_task(client, hobbies, title="Guitar")
    assert [t["id"] for t in link(client, kept["id"], guitar["id"])["tasks"]] == [guitar["id"]]

    moved = client.patch(f"/rewards/{kept['id']}", json={"areaId": hobbies}).json()
    assert (moved["areaName"], moved["categoryId"]) == ("Hobbies", "fun") and len(moved["tasks"]) == 1
    loose = client.patch(f"/rewards/{kept['id']}", json={"areaId": None}).json()
    assert loose["areaId"] is None and loose["categoryId"] is None and len(loose["tasks"]) == 1

    # Deleting its area keeps the reward (it just has no area any more).
    client.patch(f"/rewards/{kept['id']}", json={"areaId": kitchen})
    assert client.delete(f"/areas/{kitchen}").status_code == 204
    after = client.get(f"/rewards/{kept['id']}").json()
    assert after["areaId"] is None and len(after["tasks"]) == 1


def test_link_any_task_to_any_reward(client):
    counters = make_task(client, area_id(client, "household", "Kitchen"), title="Wipe counters")
    guitar = make_task(client, area_id(client, "fun", "Hobbies"), title="Guitar")
    reading = make_task(client, area_id(client, "career", "Learning"), title="Read a chapter")
    movie = make_reward(client, "Movie night", threshold=3)

    # Tasks from three different tiles, one reward.
    link(client, movie["id"], counters["id"])
    link(client, movie["id"], guitar["id"])
    linked = link(client, movie["id"], guitar["id"])  # linking twice is harmless
    assert [t["id"] for t in linked["tasks"]] == [counters["id"], guitar["id"]] and linked["connected"] is True

    # One task, several rewards.
    books = make_reward(client, "New book", threshold=1)
    link(client, books["id"], guitar["id"])
    detail = client.get(f"/tasks/{guitar['id']}").json()
    assert {r["title"] for r in detail["rewards"]} == {"Movie night", "New book"}

    assert client.post(f"/rewards/{movie['id']}/tasks/99999").status_code == 404
    assert client.post(f"/rewards/99999/tasks/{guitar['id']}").status_code == 404

    unlinked = client.delete(f"/rewards/{movie['id']}/tasks/{counters['id']}").json()
    assert [t["id"] for t in unlinked["tasks"]] == [guitar["id"]]
    assert client.get(f"/tasks/{reading['id']}").json()["rewards"] == []


def test_linked_task_counts_unlock_the_reward(client):
    counters = make_task(client, area_id(client, "household", "Kitchen"), title="Wipe counters")
    guitar = make_task(client, area_id(client, "fun", "Hobbies"), title="Guitar")
    other = make_task(client, area_id(client, "fun", "Outings"), title="Park")
    complete(client, counters["id"], days_ago=1)
    reward = make_reward(client, "Movie night", threshold=3)
    assert link(client, reward["id"], counters["id"])["progress"]["current"] == 1

    link(client, reward["id"], guitar["id"])
    assert complete(client, other["id"])["unlockedRewards"] == []  # not linked: doesn't count
    assert complete(client, guitar["id"])["unlockedRewards"] == []
    result = complete(client, counters["id"])
    assert [r["id"] for r in result["unlockedRewards"]] == [reward["id"]]

    # Unlocked stays unlocked even if a link is removed (BR-R10).
    after = client.delete(f"/rewards/{reward['id']}/tasks/{guitar['id']}").json()
    assert after["status"] == "unlocked"
    assert client.patch(f"/rewards/{reward['id']}", json={"status": "claimed"}).json()["status"] == "claimed"


def test_linking_tasks_already_done_enough_unlocks_immediately(client):
    task = make_task(client, area_id(client, "fun", "Outings"))
    complete(client, task["id"])
    reward = make_reward(client, "Ice cream", threshold=1)
    assert link(client, reward["id"], task["id"])["status"] == "unlocked"

    # Lowering N also re-checks.
    other = make_reward(client, "Popcorn", threshold=5, taskIds=[task["id"]])
    assert other["status"] == "locked"
    assert client.patch(f"/rewards/{other['id']}", json={"threshold": 1}).json()["status"] == "unlocked"


def test_rewards_outlive_tiles_areas_and_tasks(client):
    kitchen = area_id(client, "household", "Kitchen")
    counters = make_task(client, kitchen)
    guitar = make_task(client, area_id(client, "fun", "Hobbies"))
    reward = make_reward(client, taskIds=[counters["id"], guitar["id"]])

    assert client.delete(f"/tasks/{guitar['id']}").status_code == 204
    assert client.delete(f"/areas/{kitchen}").status_code == 204
    [after] = client.get("/rewards").json()
    assert after["id"] == reward["id"] and after["tasks"] == []  # only the links went


def test_delete_reward_keeps_tasks(client):
    task = make_task(client, area_id(client, "household", "Kitchen"))
    complete(client, task["id"])
    reward = make_reward(client, taskIds=[task["id"]])
    assert client.delete(f"/rewards/{reward['id']}").status_code == 204
    assert client.get("/rewards").json() == []
    assert client.delete(f"/rewards/{reward['id']}").status_code == 404
    assert client.get(f"/tasks/{task['id']}").json()["completionCount"] == 1


def test_older_all_tasks_in_area_rewards_keep_counting(client):
    """Before links, a reward could count every task of an area; those rows keep working."""
    kitchen = area_id(client, "household", "Kitchen")
    counters = make_task(client, kitchen, title="Wipe counters")
    reward = make_reward(client, "Old kitchen treat", threshold=2)
    db = client.app.state.settings.database_url.removeprefix("sqlite+aiosqlite:///")
    with sqlite3.connect(db) as conn:
        conn.execute(
            "UPDATE rewards SET category_id = 'household', area_id = ?, match_mode = 'all' WHERE id = ?",
            (kitchen, reward["id"]),
        )

    later = make_task(client, kitchen, title="Clean the sink")  # added later: counts automatically
    complete(client, counters["id"])
    detail = client.get(f"/tasks/{later['id']}").json()
    assert [(r["id"], r["match"]) for r in detail["rewards"]] == [(reward["id"], "scope")]
    assert [r["id"] for r in complete(client, later["id"])["unlockedRewards"]] == [reward["id"]]


def test_migration_infers_scope_and_keeps_data(tmp_path):
    """LLR-4.18 against a database at the revision before scopes existed."""
    db = tmp_path / "before-scope.db"
    url = f"sqlite+aiosqlite:///{db.as_posix()}"
    command.upgrade(alembic_config(url), "0002_details")
    with sqlite3.connect(db) as conn:
        conn.executescript(
            """
            INSERT INTO categories (id, name, icon, sort_order) VALUES ('household', 'Household', 'h', 0),
                                                                     ('fun', 'Fun', 'f', 1);
            INSERT INTO areas (id, category_id, name, sort_order, created_at) VALUES
                (1, 'household', 'Kitchen', 0, '2026-09-01'), (2, 'household', 'Laundry', 1, '2026-09-01'),
                (3, 'fun', 'Hobbies', 0, '2026-09-01');
            INSERT INTO tasks (id, area_id, title, notes, source, priority, frequency, status, relevance, created_at, updated_at)
            VALUES (1, 1, 'Counters', '', 'manual', 'high', 'daily', 'active', 'relevant', '2026-09-01', '2026-09-01'),
                   (2, 1, 'Sink', '', 'manual', 'high', 'daily', 'active', 'relevant', '2026-09-01', '2026-09-01'),
                   (3, 2, 'Whites', '', 'manual', 'high', 'daily', 'active', 'relevant', '2026-09-01', '2026-09-01'),
                   (4, 3, 'Guitar', '', 'manual', 'high', 'daily', 'active', 'relevant', '2026-09-01', '2026-09-01');
            INSERT INTO activities (task_id, completed_at, note) VALUES (1, '2026-09-02 10:00:00', '');
            INSERT INTO rewards (id, title, description, rule_type, threshold, status, created_at) VALUES
                (1, 'One area', '', 'completions', 3, 'locked', '2026-09-01'),
                (2, 'One tile', '', 'completions', 3, 'unlocked', '2026-09-01'),
                (3, 'Across tiles', '', 'completions', 3, 'claimed', '2026-09-01'),
                (4, 'No tags', '', 'streak', 3, 'locked', '2026-09-01');
            INSERT INTO reward_tasks (reward_id, task_id) VALUES (1, 1), (1, 2), (2, 1), (2, 3), (3, 3), (3, 4);
            """
        )

    assert migrate(url) == "0003_reward_scope"

    with sqlite3.connect(db) as conn:
        rows = conn.execute("SELECT id, category_id, area_id, match_mode, status FROM rewards ORDER BY id").fetchall()
        assert rows == [
            (1, "household", 1, "selected", "locked"),
            (2, "household", None, "selected", "unlocked"),
            (3, None, None, "selected", "claimed"),  # Needs a tile
            (4, None, None, "selected", "locked"),
        ]
        assert conn.execute("SELECT count(*) FROM reward_tasks").fetchone()[0] == 6
        assert conn.execute("SELECT count(*) FROM activities").fetchone()[0] == 1
    assert list((tmp_path / "backups").glob("before-scope-*-pre-0003_reward_scope.db"))


