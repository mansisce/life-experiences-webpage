"""HLR-13: a tile can switch off areas and hold its tasks directly (via one hidden area)."""

from .test_api import area_id, complete, make_task
from .test_reward_links import link, make_reward


def tile(client, tile_id):
    return next(c for c in client.get("/categories").json() if c["id"] == tile_id)


def switch_off_areas(client, name="Office"):
    created = client.post("/categories", json={"name": name, "icon": "💼"}).json()
    response = client.patch(f"/categories/{created['id']}", json={"useAreas": False})
    assert response.status_code == 200, response.text
    office = response.json()
    [hidden] = office["areas"]
    return office, hidden


def test_switch_off_areas_gives_the_tile_one_hidden_area(client):
    office, hidden = switch_off_areas(client)
    assert office["useAreas"] is False
    assert hidden["hidden"] is True and hidden["name"] == "General"
    assert client.get(f"/areas/{hidden['id']}").json()["hidden"] is True

    # Switching off twice is harmless; the tile still has exactly one hidden area.
    again = client.patch(f"/categories/{office['id']}", json={"useAreas": False}).json()
    assert [a["id"] for a in again["areas"]] == [hidden["id"]]

    # No areas can be added, and the hidden one can't be renamed or deleted.
    assert client.post("/areas", json={"categoryId": office["id"], "name": "Projects"}).status_code == 409
    assert client.patch(f"/areas/{hidden['id']}", json={"name": "X"}).status_code == 409
    assert client.delete(f"/areas/{hidden['id']}").status_code == 409
    assert client.get(f"/categories/{office['id']}/delete-preview").json()["areas"] == 0


def test_a_new_tile_can_start_without_areas(client):
    created = client.post("/categories", json={"name": "Office", "icon": "💼", "useAreas": False}).json()
    assert created["useAreas"] is False and [a["hidden"] for a in created["areas"]] == [True]
    assert client.post("/categories", json={"name": "Errands"}).json()["useAreas"] is True


def test_cannot_switch_off_while_the_tile_has_areas(client):
    response = client.patch("/categories/fun", json={"useAreas": False})
    assert response.status_code == 409 and "Move or delete" in response.json()["detail"]
    assert tile(client, "fun")["useAreas"] is True


def test_tasks_on_a_tile_without_areas_show_the_tile_name(client):
    office, hidden = switch_off_areas(client)
    task = make_task(client, hidden["id"], title="Connect with Amex Project - BA")
    complete(client, task["id"])

    [listed] = [t for t in client.get("/tasks").json() if t["id"] == task["id"]]
    assert listed["areaName"] == "Office" and listed["categoryId"] == office["id"]
    assert client.get(f"/tasks/{task['id']}").json()["area"]["hidden"] is True

    reward = make_reward(client, title="Coffee", areaId=hidden["id"])
    assert reward["areaName"] == "Office"

    summary = client.get("/dashboard/summary").json()
    assert {"area_name": "Office", "completions": 1}.items() <= next(
        a for a in summary["completions_by_area"] if a["area_id"] == hidden["id"]
    ).items()


def test_switching_areas_back_on(client):
    # With tasks: the hidden area becomes a normal "General" area, tasks and all.
    office, hidden = switch_off_areas(client)
    make_task(client, hidden["id"])
    back = client.patch(f"/categories/{office['id']}", json={"useAreas": True}).json()
    assert back["useAreas"] is True
    assert [(a["id"], a["name"], a["hidden"], a["activeTaskCount"]) for a in back["areas"]] == [
        (hidden["id"], "General", False, 1)
    ]

    # Empty: the hidden area just goes.
    empty, _ = switch_off_areas(client, "Errands")
    assert client.patch(f"/categories/{empty['id']}", json={"useAreas": True}).json()["areas"] == []


def test_starter_set_leaves_a_tile_without_areas_alone(client):
    for area in tile(client, "fun")["areas"]:
        assert client.delete(f"/areas/{area['id']}").status_code == 204
    assert client.patch("/categories/fun", json={"useAreas": False}).status_code == 200
    client.post("/categories/starter")
    assert [a["hidden"] for a in tile(client, "fun")["areas"]] == [True]


def test_move_a_task_keeps_completions_and_reward_links(client):
    office, hidden = switch_off_areas(client)
    kitchen = area_id(client, "household", "Kitchen")
    task = make_task(client, kitchen, title="Micro-frontend deployment")
    complete(client, task["id"])
    reward = make_reward(client, title="New headphones", threshold=3)
    link(client, reward["id"], task["id"])

    moved = client.patch(f"/tasks/{task['id']}", json={"areaId": hidden["id"]})
    assert moved.status_code == 200 and moved.json()["areaId"] == hidden["id"]
    assert moved.json()["completionCount"] == 1
    assert [r["id"] for r in client.get(f"/tasks/{task['id']}").json()["rewards"]] == [reward["id"]]

    assert client.patch(f"/tasks/{task['id']}", json={"areaId": 99999}).status_code == 404
    assert client.patch(f"/tasks/{task['id']}", json={"areaId": None}).status_code == 422
