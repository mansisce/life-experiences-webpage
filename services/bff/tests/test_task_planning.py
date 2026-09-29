"""HLR-11: milestones, announced/silent, due date/time and days to complete."""

import sqlite3
from datetime import timedelta

from alembic import command

from app.migrate import alembic_config, migrate

from .conftest import FROZEN_NOW
from .test_api import area_id, complete, make_task

# FROZEN_NOW is 2026-09-28 12:00 UTC = 17:30 in Asia/Kolkata.


def test_task_planning_fields_round_trip(client):
    kitchen = area_id(client, "household", "Kitchen")
    plain = make_task(client, kitchen, title="Wipe counters")
    assert (plain["isMilestone"], plain["visibility"], plain["dueAt"], plain["targetDays"]) == (False, "announced", None, None)

    # A naive due date is the user's local time (IST): 31 Oct 18:00 IST = 12:30 UTC.
    task = make_task(
        client, kitchen, title="Finish React course", isMilestone=True, visibility="silent",
        dueAt="2026-10-31T18:00:00", targetDays=30,
    )
    assert task["isMilestone"] is True and task["visibility"] == "silent" and task["targetDays"] == 30
    assert task["dueAt"].startswith("2026-10-31T12:30:00")

    # Independent fields: moving the due date never changes days to complete (BR-R26).
    moved = client.patch(f"/tasks/{task['id']}", json={"dueAt": "2026-11-10T09:00:00+05:30"}).json()
    assert moved["dueAt"].startswith("2026-11-10T03:30:00") and moved["targetDays"] == 30

    cleared = client.patch(f"/tasks/{task['id']}", json={"dueAt": None, "targetDays": None, "visibility": "announced"}).json()
    assert (cleared["dueAt"], cleared["targetDays"], cleared["visibility"]) == (None, None, "announced")

    assert client.patch(f"/tasks/{task['id']}", json={"targetDays": 0}).status_code == 422
    assert client.patch(f"/tasks/{task['id']}", json={"visibility": "secret"}).status_code == 422
    assert client.patch(f"/tasks/{task['id']}", json={"isMilestone": None}).status_code == 422


def test_overdue_rules(client):
    kitchen = area_id(client, "household", "Kitchen")
    yesterday = (FROZEN_NOW - timedelta(days=1)).isoformat()
    late = make_task(client, kitchen, title="Late", dueAt=yesterday)
    later = make_task(client, kitchen, title="Later", dueAt=(FROZEN_NOW + timedelta(days=3)).isoformat())
    done_one = make_task(client, kitchen, title="Done one-off", frequency="one_off", dueAt=yesterday)
    archived = make_task(client, kitchen, title="Archived", dueAt=yesterday)

    assert late["overdue"] is True and later["overdue"] is False
    complete(client, done_one["id"])  # a one-off becomes done
    client.patch(f"/tasks/{archived['id']}", json={"status": "archived"})

    overdue = client.get(f"/areas/{kitchen}/tasks", params={"due": "overdue"}).json()
    assert [t["title"] for t in overdue] == ["Late"]  # done and archived are never overdue (BR-R22)
    assert client.get(f"/tasks/{done_one['id']}").json()["overdue"] is False


def test_due_filters_milestones_and_sort(client):
    kitchen = area_id(client, "household", "Kitchen")
    local_today_evening = "2026-09-28T21:00:00"  # still today in IST
    make_task(client, kitchen, title="No date")
    make_task(client, kitchen, title="In five days", dueAt="2026-10-03T10:00:00", isMilestone=True)
    make_task(client, kitchen, title="Tonight", dueAt=local_today_evening)
    make_task(client, kitchen, title="Next month", dueAt="2026-10-28T10:00:00")

    get = lambda **params: [t["title"] for t in client.get(f"/areas/{kitchen}/tasks", params=params).json()]
    assert get(due="today") == ["Tonight"]
    assert sorted(get(due="week")) == ["In five days", "Tonight"]
    assert get(milestone="true") == ["In five days"]
    assert get(sort="due") == ["Tonight", "In five days", "Next month", "No date"]


def test_milestone_reward_needs_all_milestones(client):
    kitchen = area_id(client, "household", "Kitchen")
    first = make_task(client, kitchen, title="Finish React course", isMilestone=True)
    second = make_task(client, kitchen, title="Build the capstone", isMilestone=True)
    ordinary = make_task(client, kitchen, title="Read a chapter")

    empty = client.post("/rewards", json={"title": "Nothing yet", "ruleType": "milestone"}).json()
    assert empty["progress"] == {"current": 0, "target": 0, "percent": 0} and empty["status"] == "locked"

    bag = client.post(
        "/rewards",
        json={"title": "New laptop bag", "ruleType": "milestone", "taskIds": [first["id"], second["id"], ordinary["id"]]},
    ).json()
    assert bag["progress"]["target"] == 2  # only milestone tasks count (BR-R25)

    assert complete(client, ordinary["id"])["unlockedRewards"] == []
    assert complete(client, first["id"])["unlockedRewards"] == []
    assert client.get(f"/rewards/{bag['id']}").json()["progress"] == {"current": 1, "target": 2, "percent": 50}
    unlocked = complete(client, second["id"])["unlockedRewards"]
    assert [r["id"] for r in unlocked] == [bag["id"]]
    assert client.get(f"/rewards/{empty['id']}").json()["status"] == "locked"  # 0 of 0 never unlocks


def test_dashboard_overdue_and_milestones(client):
    kitchen = area_id(client, "household", "Kitchen")
    yesterday = (FROZEN_NOW - timedelta(days=1)).isoformat()
    make_task(client, kitchen, title="Late chore", dueAt=yesterday)
    done = make_task(client, kitchen, title="Course", isMilestone=True, visibility="silent")
    complete(client, done["id"])
    make_task(client, kitchen, title="Late milestone", isMilestone=True, dueAt=yesterday)
    make_task(client, kitchen, title="Someday milestone", isMilestone=True)

    summary = client.get("/dashboard/summary").json()
    assert summary["totals"]["overdue_tasks"] == 2
    rows = [(m["task_title"], m["state"], m["silent"]) for m in summary["milestones"]]
    assert rows == [
        ("Late milestone", "overdue", False),
        ("Course", "done", True),
        ("Someday milestone", "upcoming", False),
    ]


def test_migration_defaults_existing_tasks(tmp_path):
    """LLR-11.12 against a database at the revision before task planning existed."""
    db = tmp_path / "before-planning.db"
    url = f"sqlite+aiosqlite:///{db.as_posix()}"
    command.upgrade(alembic_config(url), "0003_reward_scope")
    with sqlite3.connect(db) as conn:
        conn.executescript(
            """
            INSERT INTO categories (id, name, icon, sort_order) VALUES ('household', 'Household', 'h', 0);
            INSERT INTO areas (id, category_id, name, sort_order, created_at) VALUES (1, 'household', 'Kitchen', 0, '2026-09-01');
            INSERT INTO tasks (id, area_id, title, notes, source, priority, frequency, status, relevance, created_at, updated_at)
            VALUES (1, 1, 'Counters', 'keep', 'manual', 'high', 'daily', 'active', 'relevant', '2026-09-01', '2026-09-01');
            INSERT INTO activities (task_id, completed_at, note) VALUES (1, '2026-09-02 10:00:00', 'x');
            """
        )

    assert migrate(url) >= "0004_task_planning"
    with sqlite3.connect(db) as conn:
        row = conn.execute("SELECT title, notes, priority, is_milestone, visibility, due_at, target_days FROM tasks").fetchone()
        assert row == ("Counters", "keep", "high", 0, "announced", None, None)
        assert conn.execute("SELECT count(*) FROM activities").fetchone()[0] == 1
    assert list((tmp_path / "backups").glob("before-planning-*-pre-*.db"))
