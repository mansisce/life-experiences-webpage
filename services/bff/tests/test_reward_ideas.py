"""HLR-12: reward ideas (wishlist), for whom, cover photos, bought/dropped."""

import sqlite3
from pathlib import Path

from alembic import command

from app.migrate import alembic_config, migrate

from .test_api import area_id, complete, make_task

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


def make_idea(client, title="101 Hilarious Jokes", **fields):
    response = client.post("/rewards", json={"title": title, "status": "idea", **fields})
    assert response.status_code == 201, response.text
    return response.json()


def test_idea_needs_only_title(client):
    idea = make_idea(client, forWhom="Shiragi", whereSeen="City library", link="https://example.com/jokes", description="Ask for the illustrated one")
    assert (idea["status"], idea["forWhom"], idea["whereSeen"], idea["link"]) == ("idea", "Shiragi", "City library", "https://example.com/jokes")
    assert idea["connected"] is False and idea["progress"] == {"current": 0, "target": 0, "percent": 0}

    plain = make_idea(client, "Board game")
    assert plain["forWhom"] == "Me"  # default
    assert client.post("/rewards", json={"title": "", "status": "idea"}).status_code == 422
    assert client.post("/rewards", json={"title": "X", "status": "idea", "forWhom": ""}).status_code == 422
    assert client.post("/rewards", json={"title": "X", "status": "idea", "taskIds": [1]}).status_code == 422


def test_ideas_silent_by_default(client):
    assert make_idea(client)["visibility"] == "silent"  # a surprise stays a surprise (Q24)
    assert client.post("/rewards", json={"title": "Movie"}).json()["visibility"] == "announced"
    shown = make_idea(client, "Lego set", visibility="announced")
    assert shown["visibility"] == "announced"
    assert client.patch(f"/rewards/{shown['id']}", json={"visibility": "silent"}).json()["visibility"] == "silent"


def test_idea_never_unlocks_or_counts(client):
    task = make_task(client, area_id(client, "household", "Kitchen"))
    idea = make_idea(client, threshold=1)
    complete(client, task["id"])

    assert client.post(f"/rewards/{idea['id']}/tasks/{task['id']}").status_code == 409  # can't link an idea
    assert client.put(f"/rewards/{idea['id']}/tasks", json={"taskIds": [task["id"]]}).status_code == 409
    assert client.patch(f"/rewards/{idea['id']}", json={"status": "claimed"}).status_code == 409
    assert client.get(f"/rewards/{idea['id']}").json()["status"] == "idea"

    summary = client.get("/dashboard/summary").json()
    assert summary["totals"]["ideas"] == 1 and summary["ideas_by_person"] == [{"for_whom": "Me", "ideas": 1}]
    assert summary["rewards"] == []  # not in reward progress (BR-R27)


def test_activate_idea_keeps_details_and_evaluates(client):
    reading = make_task(client, area_id(client, "household", "Books"), title="Read 20 minutes", frequency="daily")
    idea = make_idea(client, forWhom="Shiragi", link="https://example.com/jokes", whereSeen="City library")
    client.put(f"/rewards/{idea['id']}/cover", files={"file": ("cover.png", PNG, "image/png")})

    reward = client.post(f"/rewards/{idea['id']}/activate", json={"ruleType": "streak", "threshold": 7}).json()
    assert (reward["id"], reward["status"], reward["ruleType"], reward["threshold"]) == (idea["id"], "locked", "streak", 7)
    assert (reward["forWhom"], reward["link"], reward["whereSeen"]) == ("Shiragi", "https://example.com/jokes", "City library")
    assert reward["coverUrl"] and reward["progress"]["percent"] == 0
    assert client.post(f"/rewards/{idea['id']}/activate", json={}).status_code == 409  # only ideas

    # Now it's a normal reward: link tasks, and it unlocks as usual.
    linked = client.post(f"/rewards/{idea['id']}/tasks/{reading['id']}").json()
    assert linked["connected"] is True

    # An idea whose linked rule is already met unlocks straight away when activated.
    done = make_task(client, area_id(client, "fun", "Outings"))
    complete(client, done["id"])
    quick = make_idea(client, "Ice cream")
    assert client.post(f"/rewards/{quick['id']}/activate", json={"threshold": 1}).json()["status"] == "locked"  # no tasks yet


def test_close_and_reopen_idea(client, clock):
    idea = make_idea(client)
    closed = client.post(f"/rewards/{idea['id']}/close", json={"outcome": "bought"}).json()
    assert (closed["status"], closed["closedOutcome"]) == ("closed", "bought") and closed["closedAt"]
    assert client.post(f"/rewards/{idea['id']}/close", json={"outcome": "dropped"}).status_code == 409
    assert client.post(f"/rewards/{idea['id']}/close", json={"outcome": "lost"}).status_code == 422
    assert [r["id"] for r in client.get("/rewards", params={"status": "closed"}).json()] == [idea["id"]]

    reopened = client.post(f"/rewards/{idea['id']}/reopen").json()
    assert (reopened["status"], reopened["closedOutcome"], reopened["closedAt"]) == ("idea", None, None)
    assert client.post(f"/rewards/{idea['id']}/reopen").status_code == 409

    reward = client.post("/rewards", json={"title": "Movie"}).json()
    assert client.post(f"/rewards/{reward['id']}/close", json={"outcome": "bought"}).status_code == 409  # rewards are claimed


def test_filter_by_for_whom(client):
    make_idea(client, "101 Hilarious Jokes", forWhom="Shiragi")
    make_idea(client, "Puzzle", forWhom="shiragi ")  # same person, other spelling
    client.post("/rewards", json={"title": "Sticker book", "forWhom": "Shiragi"})
    client.post("/rewards", json={"title": "Coffee out"})

    hers = client.get("/rewards", params={"forWhom": "SHIRAGI"}).json()
    assert {r["title"] for r in hers} == {"101 Hilarious Jokes", "Puzzle", "Sticker book"}
    assert {r["forWhom"] for r in hers} == {"Shiragi"}  # spelled like the first entry
    assert client.get("/rewards-people").json() == ["Me", "Shiragi"]
    assert [r["title"] for r in client.get("/rewards", params={"status": "idea", "forWhom": "Shiragi"}).json()] == ["Puzzle", "101 Hilarious Jokes"]


def test_cover_photo_signed_link_and_cleanup(client, settings):
    idea = make_idea(client)
    assert client.put(f"/rewards/{idea['id']}/cover", files={"file": ("a.pdf", b"%PDF-1.4 x", "application/pdf")}).status_code == 415
    with_cover = client.put(f"/rewards/{idea['id']}/cover", files={"file": ("a.png", PNG, "image/png")}).json()
    url = with_cover["coverUrl"]
    assert url.startswith(f"/rewards/{idea['id']}/cover?expires=")

    anonymous = client.get(url, headers={"Authorization": ""})  # an <img> sends no header
    assert anonymous.status_code == 200 and anonymous.headers["content-type"] == "image/png"
    assert client.get(url.replace("sig=", "sig=x"), headers={"Authorization": ""}).status_code == 403

    stored = list(Path(settings.files_dir).iterdir())
    assert len(stored) == 1
    assert client.delete(f"/rewards/{idea['id']}").status_code == 204
    assert list(Path(settings.files_dir).iterdir()) == []  # the photo goes with it


def test_ideas_in_search(client):
    make_idea(client, "101 Hilarious Jokes", forWhom="Shiragi", whereSeen="City library")
    hits = client.get("/search", params={"q": "library"}).json()
    assert [(h["kind"], h["title"]) for h in hits] == [("reward", "101 Hilarious Jokes")]
    assert client.get("/search", params={"q": "shiragi"}).json()[0]["title"] == "101 Hilarious Jokes"


def test_migration_defaults_existing_rewards(tmp_path):
    """LLR-12.9 against a database at the revision before ideas existed."""
    db = tmp_path / "before-ideas.db"
    url = f"sqlite+aiosqlite:///{db.as_posix()}"
    command.upgrade(alembic_config(url), "0004_task_planning")
    with sqlite3.connect(db) as conn:
        conn.execute(
            "INSERT INTO rewards (id, title, description, rule_type, threshold, status, match_mode, created_at) "
            "VALUES (1, 'Coffee out', '', 'completions', 5, 'unlocked', 'selected', '2026-09-01')"
        )

    assert migrate(url) >= "0005_reward_ideas"
    with sqlite3.connect(db) as conn:
        row = conn.execute("SELECT title, status, threshold, for_whom, visibility, link, closed_outcome FROM rewards").fetchone()
        assert row == ("Coffee out", "unlocked", 5, "Me", "announced", None, None)
