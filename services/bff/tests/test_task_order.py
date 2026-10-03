"""D16: tasks are dragged into the user's own order (LLR-2.1, 2.3, 2.5, 2.11-2.14, BR-R32)."""

import sqlite3

from alembic import command

from app.migrate import alembic_config, migrate

from .test_api import area_id, complete, make_task


def titles(client, area, **params):
    return [t["title"] for t in client.get(f"/areas/{area}/tasks", params=params).json()]


def reorder(client, area, *tasks):
    return client.put(f"/areas/{area}/tasks/order", json={"ids": [t["id"] for t in tasks]})


def test_new_task_goes_last(client):
    kitchen = area_id(client, "household", "Kitchen")
    for title in ("A", "B", "C"):
        make_task(client, kitchen, title=title, priority="high" if title == "C" else "low")
    assert titles(client, kitchen) == ["A", "B", "C"]  # priority no longer decides


def test_reorder_needs_every_active_task_once(client):
    kitchen = area_id(client, "household", "Kitchen")
    a, b, c = (make_task(client, kitchen, title=t) for t in "ABC")

    response = reorder(client, kitchen, c, a, b)
    assert response.status_code == 200 and [t["title"] for t in response.json()] == ["C", "A", "B"]
    assert titles(client, kitchen) == ["C", "A", "B"]

    assert reorder(client, kitchen, c, a).status_code == 422  # missing one
    assert reorder(client, kitchen, c, a, a).status_code == 422  # duplicate
    other = make_task(client, area_id(client, "household", "Laundry"), title="Elsewhere")
    assert reorder(client, kitchen, c, a, b, other).status_code == 422  # not in this area
    assert titles(client, kitchen) == ["C", "A", "B"]


def test_done_tasks_keep_their_place(client):
    kitchen = area_id(client, "household", "Kitchen")
    a, b, c = (make_task(client, kitchen, title=t) for t in "ABC")
    client.patch(f"/tasks/{b['id']}", json={"status": "archived"})

    # Reorder only the active ones; B keeps the middle slot.
    assert reorder(client, kitchen, c, a).status_code == 200
    assert reorder(client, kitchen, c, a, b).status_code == 422  # archived tasks aren't listed
    client.patch(f"/tasks/{b['id']}", json={"status": "active"})
    assert titles(client, kitchen) == ["C", "B", "A"]


def test_completing_editing_and_due_sort_never_reorder(client):
    kitchen = area_id(client, "household", "Kitchen")
    a, b = make_task(client, kitchen, title="A"), make_task(client, kitchen, title="B", dueAt="2026-09-29T09:00:00")
    complete(client, b["id"])
    client.patch(f"/tasks/{b['id']}", json={"title": "B2", "priority": "high"})
    assert titles(client, kitchen, sort="due") == ["B2", "A"]  # a view only
    assert titles(client, kitchen) == ["A", "B2"]


def test_order_shared_by_area_and_tasks_lists(client):
    kitchen = area_id(client, "household", "Kitchen")
    a, b = make_task(client, kitchen, title="A"), make_task(client, kitchen, title="B")
    reorder(client, kitchen, b, a)
    everywhere = [t["title"] for t in client.get("/tasks").json() if t["areaId"] == kitchen]
    assert everywhere == ["B", "A"]


def test_moved_task_goes_last(client):
    kitchen, laundry = area_id(client, "household", "Kitchen"), area_id(client, "household", "Laundry")
    make_task(client, laundry, title="Fold")
    moving = make_task(client, kitchen, title="Iron")
    make_task(client, kitchen, title="Wipe")
    client.patch(f"/tasks/{moving['id']}", json={"areaId": laundry})
    assert titles(client, laundry) == ["Fold", "Iron"]
    # Saving the same area again doesn't move it.
    client.patch(f"/tasks/{moving['id']}", json={"areaId": laundry, "title": "Iron shirts"})
    assert titles(client, laundry) == ["Fold", "Iron shirts"]


def test_migration_keeps_priority_order(tmp_path):
    """LLR-2.14 against a database at the revision before task order existed."""
    db = tmp_path / "before-order.db"
    url = f"sqlite+aiosqlite:///{db.as_posix()}"
    command.upgrade(alembic_config(url), "0006_tile_without_areas")
    with sqlite3.connect(db) as conn:
        conn.executescript(
            """
            INSERT INTO categories (id, name, icon, sort_order) VALUES ('household', 'Household', 'h', 0);
            INSERT INTO areas (id, category_id, name, sort_order, created_at) VALUES (1, 'household', 'Kitchen', 0, '2026-09-01');
            INSERT INTO areas (id, category_id, name, sort_order, created_at) VALUES (2, 'household', 'Laundry', 1, '2026-09-01');
            INSERT INTO tasks (id, area_id, title, notes, source, priority, frequency, status, relevance, created_at, updated_at) VALUES
              (1, 1, 'High', '', 'manual', 'high', 'daily', 'active', 'relevant', '2026-09-01', '2026-09-01'),
              (2, 1, 'Low', '', 'manual', 'low', 'daily', 'active', 'relevant', '2026-09-02', '2026-09-02'),
              (3, 1, 'Medium', '', 'manual', 'medium', 'daily', 'active', 'relevant', '2026-09-03', '2026-09-03'),
              (4, 1, 'Older medium', '', 'manual', 'medium', 'daily', 'done', 'relevant', '2026-08-01', '2026-08-01'),
              (5, 2, 'Only one', '', 'manual', 'low', 'daily', 'active', 'relevant', '2026-09-01', '2026-09-01');
            """
        )

    assert migrate(url) >= "0007_task_order"
    with sqlite3.connect(db) as conn:
        rows = conn.execute("SELECT area_id, title, priority FROM tasks ORDER BY area_id, sort_order").fetchall()
    assert rows == [
        (1, "High", "high"),
        (1, "Older medium", "medium"),
        (1, "Medium", "medium"),
        (1, "Low", "low"),
        (2, "Only one", "low"),
    ]
    assert list((tmp_path / "backups").glob("before-order-*-pre-*.db"))
