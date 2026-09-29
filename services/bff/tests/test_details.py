"""Notes, contacts and files on tiles and areas (HLR-10), using the PO's own examples."""

from urllib.parse import urlparse

from app.backup import export_data, import_data

from .test_api import area_id
from .test_migrations_and_backup import url_for

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
PDF = b"%PDF-1.7\n" + b"0" * 64


def add_contact(client, owner: str, **fields) -> dict:
    response = client.post(f"{owner}/contacts", json=fields)
    assert response.status_code == 201, response.text
    return response.json()


def upload(client, owner: str, content: bytes, name: str, **form) -> dict:
    response = client.post(f"{owner}/files", files={"file": (name, content)}, data={"title": "Bill", **form})
    return response


def test_details_grouped_by_topic_with_last_executive(client):
    kitchen = f"/areas/{area_id(client, 'household', 'Kitchen')}"
    add_contact(client, kitchen, name="Bosch Customer Care", organisation="Bosch", role="customer_care", topic="Bosch Dishwasher",
                phones=[{"number": "1800 266 1880", "label": "toll_free"}])
    add_contact(client, kitchen, name="Ramesh", role="service_executive", topic="bosch dishwasher",  # other casing
                lastVisit="2026-08-12", phones=[{"number": "98450 12345", "whatsapp": True}])
    add_contact(client, kitchen, name="Suresh", role="service_executive", topic="Bosch Dishwasher", lastVisit="2026-03-02")
    add_contact(client, kitchen, name="Kent service", role="technician", topic="Kent Water Purifier", lastVisit="2026-08-20")
    assert upload(client, kitchen, PDF, "invoice.pdf", topic="Bosch Dishwasher", docDate="2025-11-01", amount="42990").status_code == 201
    client.post(f"{kitchen}/notes", json={"topic": "Bosch Dishwasher", "body": "Filter cleaned; next service in 6 months"})
    client.post(f"{kitchen}/notes", json={"body": "Chimney filter size 60 cm"})  # no topic -> General

    details = client.get(f"{kitchen}/details").json()
    assert details["path"] == "Household › Kitchen" and details["ownerType"] == "area"
    assert [g["topic"] for g in details["topics"]] == ["Bosch Dishwasher", "Kent Water Purifier", None]  # General last
    assert details["topicNames"] == ["Bosch Dishwasher", "Kent Water Purifier"]
    assert details["counts"] == {"notes": 2, "contacts": 4, "files": 1}

    bosch = details["topics"][0]
    assert bosch["lastExecutive"]["name"] == "Ramesh"  # latest visit (BR-R21)
    assert [c["name"] for c in bosch["contacts"]] == ["Bosch Customer Care", "Ramesh", "Suresh"]
    assert bosch["files"][0]["amount"] == 42990 and bosch["files"][0]["contentType"] == "application/pdf"
    assert bosch["notes"][0]["body"].startswith("Filter cleaned")
    phone = bosch["contacts"][1]["phones"][0]
    assert phone["tel"] == "9845012345" and phone["whatsappUrl"] == "https://wa.me/919845012345"
    assert bosch["contacts"][0]["phones"][0]["whatsappUrl"] is None


def test_tile_level_details_for_home_wide_services(client):
    add_contact(client, "/categories/household", name="HiCare", role="service_executive", topic="Pest Control", lastVisit="2026-07-15")
    tile = client.get("/categories/household/details").json()
    assert tile["ownerType"] == "category" and tile["path"] == "Household"
    assert tile["topics"][0]["lastExecutive"]["name"] == "HiCare"
    kitchen = client.get(f"/areas/{area_id(client, 'household', 'Kitchen')}/details").json()
    assert kitchen["topics"] == []  # tile-level details don't leak into areas


def test_contact_validation(client):
    laundry = f"/areas/{area_id(client, 'household', 'Laundry')}"
    assert client.post(f"{laundry}/contacts", json={"name": ""}).status_code == 422
    assert client.post(f"{laundry}/contacts", json={"name": "IFB", "phones": [{"number": "1"}] * 4}).status_code == 422
    assert client.post(f"{laundry}/contacts", json={"name": "IFB", "email": "not-an-email"}).status_code == 422
    assert client.post(f"{laundry}/contacts", json={"name": "IFB", "phones": [{"number": "call me"}]}).status_code == 422
    assert client.post(f"{laundry}/contacts", json={"name": "IFB", "role": "plumber"}).status_code == 422
    assert client.post("/areas/9999/contacts", json={"name": "IFB"}).status_code == 404


def test_edit_and_delete_items(client):
    balcony = f"/areas/{area_id(client, 'household', 'Balcony')}"
    contact = add_contact(client, balcony, name="Pigeon net guy", phones=[{"number": "90000 11111"}])
    updated = client.patch(f"/contacts/{contact['id']}", json={"topic": "Pigeon Net", "lastVisit": "2026-09-01",
                                                               "phones": [{"number": "+91 90000 22222", "whatsapp": True}]}).json()
    assert updated["topic"] == "Pigeon Net" and updated["phones"][0]["tel"] == "+919000022222"
    assert updated["phones"][0]["whatsappUrl"] == "https://wa.me/919000022222"
    assert client.patch(f"/contacts/{contact['id']}", json={"lastVisit": None}).json()["lastVisit"] is None

    note = client.post(f"{balcony}/notes", json={"body": "Net installed March 2025"}).json()
    assert client.patch(f"/notes/{note['id']}", json={"title": "Install", "topic": "pigeon net"}).json()["topic"] == "Pigeon Net"
    assert client.patch(f"/notes/{note['id']}", json={"body": None}).status_code == 422

    assert client.delete(f"/notes/{note['id']}").status_code == 204
    assert client.delete(f"/contacts/{contact['id']}").status_code == 204
    assert client.get(f"{balcony}/details").json()["counts"] == {"notes": 0, "contacts": 0, "files": 0}


def test_file_upload_rules_and_signed_download(client, settings):
    kitchen = f"/areas/{area_id(client, 'household', 'Kitchen')}"
    assert upload(client, kitchen, b"hello, not a real file", "bill.pdf").status_code == 415  # checked by content
    too_big = PNG + b"\x00" * (10 * 1024 * 1024)
    assert upload(client, kitchen, too_big, "huge.png").status_code == 413
    assert upload(client, kitchen, PNG, "x.png", title="").status_code == 422
    assert list(settings.files_dir.iterdir()) == []  # rejected uploads leave nothing behind

    created = upload(client, kitchen, PNG, "fridge-warranty.png", title="LG fridge warranty", topic="LG Fridge")
    assert created.status_code == 201
    file = created.json()
    assert file["isImage"] and file["originalName"] == "fridge-warranty.png"

    anonymous = {"Authorization": ""}
    signed = client.get(file["url"], headers=anonymous)
    assert signed.status_code == 200 and signed.content == PNG
    assert signed.headers["content-type"] == "image/png"
    path = urlparse(file["url"]).path
    assert client.get(f"{path}?expires=9999999999&sig=forged", headers=anonymous).status_code == 403
    assert client.get(f"{path}?expires=1&sig=x", headers=anonymous).status_code == 403  # expired
    assert client.get(path).status_code == 200  # owner header works too

    assert client.patch(f"/files/{file['id']}", json={"amount": 1499.5, "docDate": "2024-05-01"}).json()["amount"] == 1499.5
    assert client.delete(f"/files/{file['id']}").status_code == 204
    assert list(settings.files_dir.iterdir()) == []  # stored file removed


def test_search_matches_names_topics_and_phone_digits(client):
    laundry = f"/areas/{area_id(client, 'household', 'Laundry')}"
    add_contact(client, laundry, name="IFB Care", organisation="IFB", topic="IFB Washing Machine",
                phones=[{"number": "98450 12345"}])
    client.post(f"{laundry}/notes", json={"topic": "IFB Washing Machine", "body": "Drum cleaned with tablets"})

    hits = client.get("/search", params={"q": "IFB"}).json()
    assert {(h["kind"], h["path"], h["topic"]) for h in hits} == {
        ("contact", "Household › Laundry", "IFB Washing Machine"),
        ("note", "Household › Laundry", "IFB Washing Machine"),
    }
    by_digits = client.get("/search", params={"q": "9845012345"}).json()
    assert [h["title"] for h in by_digits] == ["IFB Care"]
    assert client.get("/search", params={"q": "98450-12345"}).json()[0]["title"] == "IFB Care"
    assert client.get("/search", params={"q": "tablets"}).json()[0]["kind"] == "note"
    assert client.get("/search", params={"q": "x"}).status_code == 422  # at least 2 characters


def test_deleting_owner_removes_details_and_files(client, settings):
    kitchen_id = area_id(client, "household", "Kitchen")
    upload(client, f"/areas/{kitchen_id}", PNG, "a.png")
    upload(client, "/categories/household", PDF, "b.pdf")
    add_contact(client, "/categories/household", name="HiCare")
    assert len(list(settings.files_dir.iterdir())) == 2

    preview = client.get("/categories/household/delete-preview").json()
    assert (preview["files"], preview["contacts"]) == (2, 1)

    client.delete(f"/areas/{kitchen_id}")
    assert len(list(settings.files_dir.iterdir())) == 1  # area's file removed with the area
    client.delete("/categories/household", params={"confirmName": "Household"})
    assert list(settings.files_dir.iterdir()) == []
    assert client.get("/search", params={"q": "HiCare"}).json() == []


def test_export_import_includes_details(client, tmp_path):
    kitchen = f"/areas/{area_id(client, 'household', 'Kitchen')}"
    add_contact(client, kitchen, name="Ramesh", role="service_executive", lastVisit="2026-08-12",
                phones=[{"number": "98450 12345", "whatsapp": True}])
    upload(client, kitchen, PDF, "bill.pdf", amount="42990.50", docDate="2025-11-01")

    payload = export_data(client.app.state.settings.database_url)
    assert payload["tables"]["contacts"][0]["last_visit"] == "2026-08-12"
    assert payload["tables"]["attachments"][0]["amount"] == "42990.50"
    target = url_for(tmp_path / "restored.db")
    import_data(target, payload)
    assert export_data(target)["tables"] == payload["tables"]
