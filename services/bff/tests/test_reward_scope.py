"""HLR-9: rewards live in the same tiles and areas as tasks, and match tasks inside that scope."""

import sqlite3

from alembic import command

from app.migrate import alembic_config, migrate

from .test_api import area_id, complete, make_task

RULE = {"ruleType": "completions", "threshold": 3}


def make_reward(client, title="Treat", **fields):
    response = client.post("/rewards", json={"title": title, **RULE, **fields})
    assert response.status_code == 201, response.text
    return response.json()


def test_reward_scope_validation(client):
    kitchen = area_id(client, "household", "Kitchen")
    hobbies = area_id(client, "fun", "Hobbies")

    reward = make_reward(client, categoryId="household", areaId=kitchen)
    assert (reward["categoryName"], reward["areaName"], reward["matchMode"]) == ("Household", "Kitchen", "selected")
    assert reward["categoryIcon"] and reward["needsTile"] is False

    assert client.post("/rewards", json={"title": "X", **RULE}).status_code == 422  # no tile
    assert client.post("/rewards", json={"title": "X", **RULE, "categoryId": "nope"}).status_code == 422
    wrong_area = client.post("/rewards", json={"title": "X", **RULE, "categoryId": "household", "areaId": hobbies})
    assert wrong_area.status_code == 422 and "isn't part of Household" in wrong_area.json()["detail"]

    listed = client.get("/rewards", params={"categoryId": "household"}).json()
    assert [r["id"] for r in listed] == [reward["id"]]
    assert client.get("/rewards", params={"categoryId": "fun"}).json() == []
    assert [r["id"] for r in client.get("/rewards", params={"areaId": kitchen}).json()] == [reward["id"]]


def test_tagging_outside_scope_rejected(client):
    kitchen = area_id(client, "household", "Kitchen")
    laundry = area_id(client, "household", "Laundry")
    counters = make_task(client, kitchen, title="Wipe counters")
    whites = make_task(client, laundry, title="Wash whites")

    reward = make_reward(client, categoryId="household", areaId=kitchen)
    bad = client.put(f"/rewards/{reward['id']}/tasks", json={"taskIds": [counters["id"], whites["id"]]})
    assert bad.status_code == 422
    assert bad.json()["detail"] == "“Wash whites” is outside Household › Kitchen"

    create_bad = client.post(
        "/rewards", json={"title": "X", **RULE, "categoryId": "fun", "taskIds": [counters["id"]]}
    )
    assert create_bad.status_code == 422

    ok = client.put(f"/rewards/{reward['id']}/tasks", json={"taskIds": [counters["id"]]}).json()
    assert [t["id"] for t in ok["tasks"]] == [counters["id"]]


def test_narrowing_scope_untags(client):
    kitchen = area_id(client, "household", "Kitchen")
    laundry = area_id(client, "household", "Laundry")
    counters = make_task(client, kitchen, title="Wipe counters")
    whites = make_task(client, laundry, title="Wash whites")
    reward = make_reward(client, categoryId="household", taskIds=[counters["id"], whites["id"]])

    # Narrowing asks first, naming the tasks that would be untagged, and changes nothing.
    first = client.patch(f"/rewards/{reward['id']}", json={"areaId": kitchen})
    assert first.status_code == 409 and "untag “Wash whites”" in first.json()["detail"]
    assert client.get("/rewards").json()[0]["areaId"] is None

    narrowed = client.patch(f"/rewards/{reward['id']}", json={"areaId": kitchen, "untagOutside": True}).json()
    assert narrowed["areaName"] == "Kitchen"
    assert [t["id"] for t in narrowed["tasks"]] == [counters["id"]]

    # Widening back to the whole tile never needs a confirmation.
    widened = client.patch(f"/rewards/{reward['id']}", json={"areaId": None}).json()
    assert widened["areaId"] is None and len(widened["tasks"]) == 1

    # Only while locked (LLR-4.16).
    complete(client, counters["id"], days_ago=2)
    complete(client, counters["id"], days_ago=1)
    complete(client, counters["id"])
    assert client.get("/rewards").json()[0]["status"] == "unlocked"
    assert client.patch(f"/rewards/{reward['id']}", json={"matchMode": "all"}).status_code == 409


def test_all_in_scope_counts_untagged_and_new_tasks(client):
    kitchen = area_id(client, "household", "Kitchen")
    laundry = area_id(client, "household", "Laundry")
    counters = make_task(client, kitchen, title="Wipe counters")
    complete(client, counters["id"], days_ago=1)

    reward = make_reward(client, categoryId="household", matchMode="all", threshold=4)
    assert reward["progress"]["current"] == 1 and reward["matchedTaskCount"] == 1

    # A task created later counts automatically, from any area of the tile.
    whites = make_task(client, laundry, title="Wash whites")
    complete(client, whites["id"])
    archived = make_task(client, laundry, title="Old chore")
    complete(client, archived["id"])
    client.patch(f"/tasks/{archived['id']}", json={"status": "archived"})  # archived tasks don't count
    assert client.get("/rewards").json()[0]["progress"]["current"] == 2

    assert complete(client, counters["id"])["unlockedRewards"] == []
    result = complete(client, whites["id"])
    assert [r["id"] for r in result["unlockedRewards"]] == [reward["id"]]

    detail = client.get(f"/tasks/{whites['id']}").json()
    assert [(r["id"], r["match"]) for r in detail["rewards"]] == [(reward["id"], "scope")]


def test_other_tile_never_counts(client):
    kitchen = area_id(client, "household", "Kitchen")
    hobbies = area_id(client, "fun", "Hobbies")
    kitchen_reward = make_reward(client, "Kitchen treat", categoryId="household", areaId=kitchen, matchMode="all")
    guitar = make_task(client, hobbies, title="Guitar")
    for days_ago in (2, 1, 0):
        assert complete(client, guitar["id"], days_ago=days_ago)["unlockedRewards"] == []

    laundry_task = make_task(client, area_id(client, "household", "Laundry"))
    complete(client, laundry_task["id"])  # same tile, different area: outside an area-scoped reward
    [reward] = client.get("/rewards").json()
    assert reward["id"] == kitchen_reward["id"] and reward["progress"]["current"] == 0


def test_area_lists_matching_rewards(client):
    kitchen = area_id(client, "household", "Kitchen")
    laundry = area_id(client, "household", "Laundry")
    whole_tile = make_reward(client, "Household treat", categoryId="household")
    kitchen_only = make_reward(client, "Kitchen treat", categoryId="household", areaId=kitchen)
    make_reward(client, "Laundry treat", categoryId="household", areaId=laundry)
    make_reward(client, "Fun treat", categoryId="fun")
    claimed = make_reward(client, "Done already", categoryId="household", threshold=1, matchMode="all")
    complete(client, make_task(client, kitchen)["id"])
    client.patch(f"/rewards/{claimed['id']}", json={"status": "claimed"})

    here = client.get(f"/areas/{kitchen}/rewards").json()
    assert {r["title"] for r in here} == {whole_tile["title"], kitchen_only["title"]}
    assert client.get("/areas/99999/rewards").status_code == 404


def test_task_detail_lists_matching_rewards(client):
    kitchen = area_id(client, "household", "Kitchen")
    task = make_task(client, kitchen)
    tagged = make_reward(client, "Tagged", categoryId="household", areaId=kitchen, taskIds=[task["id"]])
    by_scope = make_reward(client, "By scope", categoryId="household", matchMode="all")
    make_reward(client, "Elsewhere", categoryId="fun", matchMode="all")

    detail = client.get(f"/tasks/{task['id']}").json()
    assert [(r["title"], r["match"], r["matchMode"]) for r in detail["rewards"]] == [
        (tagged["title"], "tagged", "selected"),
        (by_scope["title"], "scope", "all"),
    ]


def test_deleting_area_widens_reward_scope(client):
    kitchen = area_id(client, "household", "Kitchen")
    counters = make_task(client, kitchen)
    reward = make_reward(client, categoryId="household", areaId=kitchen, taskIds=[counters["id"]])
    assert client.delete(f"/areas/{kitchen}").status_code == 204

    [after] = client.get("/rewards").json()
    assert after["id"] == reward["id"] and after["categoryId"] == "household" and after["areaId"] is None
    assert after["status"] == "locked" and after["tasks"] == []  # the area's tasks went with it


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


def test_needs_a_tile_reward_must_pick_one_first(client):
    kitchen = area_id(client, "household", "Kitchen")
    counters = make_task(client, kitchen)
    reward = make_reward(client, categoryId="household", taskIds=[counters["id"]])
    engine_db = client.app.state.settings.database_url.removeprefix("sqlite+aiosqlite:///")
    with sqlite3.connect(engine_db) as conn:  # what the migration leaves for tags across tiles
        conn.execute("UPDATE rewards SET category_id = NULL WHERE id = ?", (reward["id"],))

    [needs] = client.get("/rewards").json()
    assert needs["needsTile"] is True and needs["tasks"][0]["id"] == counters["id"]
    assert client.patch(f"/rewards/{reward['id']}", json={"title": "New"}).status_code == 409
    assert client.put(f"/rewards/{reward['id']}/tasks", json={"taskIds": []}).status_code == 409

    picked = client.patch(f"/rewards/{reward['id']}", json={"categoryId": "household", "title": "New"}).json()
    assert picked["needsTile"] is False and picked["title"] == "New" and len(picked["tasks"]) == 1


def test_claimed_reward_without_a_tile_can_still_get_one(client):
    task = make_task(client, area_id(client, "fun", "Hobbies"))
    complete(client, task["id"])
    reward = make_reward(client, categoryId="fun", threshold=1, taskIds=[task["id"]])
    client.patch(f"/rewards/{reward['id']}", json={"status": "claimed"})
    db = client.app.state.settings.database_url.removeprefix("sqlite+aiosqlite:///")
    with sqlite3.connect(db) as conn:
        conn.execute("UPDATE rewards SET category_id = NULL WHERE id = ?", (reward["id"],))

    picked = client.patch(f"/rewards/{reward['id']}", json={"categoryId": "fun"}).json()
    assert (picked["categoryId"], picked["status"]) == ("fun", "claimed")
    assert client.patch(f"/rewards/{reward['id']}", json={"categoryId": "household"}).status_code == 409
