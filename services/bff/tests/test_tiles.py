"""User-managed tiles: no seeding, CRUD, reordering, safe delete, idempotent starter set."""

from .conftest import make_client
from .test_api import area_id, complete, make_task


def tile_names(client) -> list[str]:
    return [c["name"] for c in client.get("/categories").json()]


def test_fresh_database_has_no_tiles(empty_client):
    assert empty_client.get("/categories").json() == []


def test_starter_set_is_idempotent(empty_client):
    home = empty_client.post("/categories", json={"name": "Home", "icon": "🏡"}).json()

    first = empty_client.post("/categories/starter").json()
    assert first == {"tilesAdded": 3, "areasAdded": 17}
    assert tile_names(empty_client) == ["Home", "Career / Office / Work", "Household", "Fun"]

    assert empty_client.post("/categories/starter").json() == {"tilesAdded": 0, "areasAdded": 0}
    assert empty_client.get("/categories").json()[0] == {**home, "areas": []}


def test_starter_set_fills_in_missing_areas_only(client):
    household = next(c for c in client.get("/categories").json() if c["id"] == "household")
    kitchen = next(a for a in household["areas"] if a["name"] == "Kitchen")
    client.delete(f"/areas/{kitchen['id']}")
    client.post("/areas", json={"categoryId": "household", "name": "Study corner"})

    assert client.post("/categories/starter").json() == {"tilesAdded": 0, "areasAdded": 1}
    names = [a["name"] for c in client.get("/categories").json() if c["id"] == "household" for a in c["areas"]]
    assert "Kitchen" in names and "Study corner" in names and len(names) == 14


def test_tile_crud_and_unique_names(empty_client):
    created = empty_client.post("/categories", json={"name": "  Shiragi  ", "icon": "🧸"})
    assert created.status_code == 201
    tile = created.json()
    assert tile["name"] == "Shiragi" and tile["icon"] == "🧸" and tile["id"] == "shiragi"

    assert empty_client.post("/categories", json={"name": "shiragi"}).status_code == 409
    assert empty_client.post("/categories", json={"name": ""}).status_code == 422
    assert empty_client.post("/categories", json={"name": "x" * 41}).status_code == 422
    assert empty_client.post("/categories", json={"name": "Garden"}).json()["icon"] == "📁"

    renamed = empty_client.patch(f"/categories/{tile['id']}", json={"name": "Shiragi's world", "icon": "🌈"}).json()
    assert renamed["id"] == "shiragi"  # links keep working after a rename
    assert (renamed["name"], renamed["icon"]) == ("Shiragi's world", "🌈")
    assert empty_client.patch(f"/categories/{tile['id']}", json={"name": "GARDEN"}).status_code == 409
    assert empty_client.patch("/categories/nope", json={"name": "X"}).status_code == 404


def test_new_tile_ids_stay_unique(empty_client):
    first = empty_client.post("/categories", json={"name": "Home"}).json()["id"]
    empty_client.patch(f"/categories/{first}", json={"name": "House"})
    second = empty_client.post("/categories", json={"name": "Home"}).json()["id"]
    assert (first, second) == ("home", "home-2")


def test_reorder_tiles_and_areas(client):
    ids = [c["id"] for c in client.get("/categories").json()]
    reordered = client.put("/categories/order", json={"ids": list(reversed(ids))}).json()
    assert [c["id"] for c in reordered] == list(reversed(ids))
    assert [c["id"] for c in client.get("/categories").json()] == list(reversed(ids))

    assert client.put("/categories/order", json={"ids": ids[:2]}).status_code == 422  # must list all
    assert client.put("/categories/order", json={"ids": [*ids, ids[0]]}).status_code == 422  # no repeats

    fun = next(c for c in client.get("/categories").json() if c["id"] == "fun")
    area_ids = [a["id"] for a in fun["areas"]]
    result = client.put("/categories/fun/areas/order", json={"ids": list(reversed(area_ids))}).json()
    assert [a["id"] for a in result["areas"]] == list(reversed(area_ids))
    assert client.put("/categories/fun/areas/order", json={"ids": [area_ids[0]]}).status_code == 422


def test_delete_tile_needs_typed_name_snapshots_and_cascades(client, tmp_path):
    kitchen = area_id(client, "household", "Kitchen")
    task = make_task(client, kitchen)
    complete(client, task["id"])
    rule = {"ruleType": "completions", "threshold": 5}
    # One reward kept in a Household area and linked there, one elsewhere (linked to nothing).
    treat = client.post("/rewards", json={"title": "Treat", **rule, "areaId": kitchen, "taskIds": [task["id"]]}).json()
    movie = client.post("/rewards", json={"title": "Movie", **rule}).json()

    preview = client.get("/categories/household/delete-preview").json()
    assert preview == {
        "name": "Household", "areas": 13, "tasks": 1, "completions": 1, "rewards": 1, "rewardsLosingTasks": 0,
        "notes": 0, "contacts": 0, "files": 0,
    }

    assert client.delete("/categories/household").status_code == 422  # confirmName is required
    assert client.delete("/categories/household", params={"confirmName": "Fun"}).status_code == 422
    assert client.get("/categories/household/delete-preview").status_code == 200  # still there

    assert client.delete("/categories/household", params={"confirmName": "household"}).status_code == 204
    assert "Household" not in tile_names(client)
    assert client.get(f"/areas/{kitchen}").status_code == 404
    assert client.get(f"/tasks/{task['id']}").status_code == 404
    # Rewards kept in the tile go with it (BR-R18); other rewards are untouched.
    assert [r["id"] for r in client.get("/rewards").json()] == [movie["id"]]
    assert list((tmp_path / "backups").glob("test-*-pre-delete-tile-household.db"))


def test_restart_never_reseeds(settings, clock):
    with make_client(settings, clock) as first:
        first.post("/categories/starter")
        for tile in first.get("/categories").json():
            first.delete(f"/categories/{tile['id']}", params={"confirmName": tile["name"]})
        assert first.get("/categories").json() == []
    with make_client(settings, clock) as second:  # same database, new process
        assert second.get("/categories").json() == []


def test_upgrade_keeps_existing_tiles(settings, clock):
    with make_client(settings, clock) as first:
        first.post("/categories", json={"name": "Home"})
        first.post("/categories/starter")
        before = first.get("/categories").json()
    with make_client(settings, clock) as second:
        assert second.get("/categories").json() == before
