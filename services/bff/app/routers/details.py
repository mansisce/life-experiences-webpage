"""Notes, contacts and files on tiles and areas (HLR-10, LLR-10.1 to 10.12, BR-R20/R21).

Every item belongs to exactly one owner: a tile (category) or an area. The details endpoint returns
everything for one owner grouped by topic, which is exactly what the Notes & contacts tab renders.
"""

import hashlib
import hmac
import re
import secrets
import time
from collections import defaultdict
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, Form, Header, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import func, or_, select

from .. import schemas
from ..config import Settings
from ..deps import SessionDep, SettingsDep
from ..models import Area, Attachment, Category, Contact, Note
from ..services import get_or_404

router = APIRouter(tags=["notes, contacts & files"])
# Downloads are opened by <img>/<a> tags, which can't send the Authorization header, so this
# router is mounted without the token dependency and checks a signed link (or the header) itself.
download_router = APIRouter(tags=["notes, contacts & files"])

MAX_FILE_BYTES = 10 * 1024 * 1024
LINK_SECONDS = 60 * 60
FILE_RULES = "Files must be PDF, JPG, PNG, WebP or HEIC, up to 10 MB"
EXECUTIVE_ROLES = {"service_executive", "technician"}
ROLE_ORDER = {"customer_care": 0, "service_executive": 1, "technician": 1, "vendor": 2, "other": 3}


# ── Owners and topics ─────────────────────────────────────────────────────────


class Owner:
    def __init__(self, category: Category, area: Area | None):
        self.category, self.area = category, area

    @property
    def type(self) -> str:
        return "area" if self.area else "category"

    @property
    def id(self) -> str:
        return str(self.area.id) if self.area else self.category.id

    @property
    def path(self) -> str:
        return f"{self.category.name} › {self.area.name}" if self.area else self.category.name

    def filter(self, model):
        return model.area_id == self.area.id if self.area else model.category_id == self.category.id

    def columns(self) -> dict:
        return {"area_id": self.area.id} if self.area else {"category_id": self.category.id}


async def load_owner(session, owner_type: str, owner_id: str) -> Owner:
    if owner_type == "area":
        if not owner_id.isdigit():
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Area {owner_id} not found")
        area = await get_or_404(session, Area, int(owner_id))
        return Owner(await get_or_404(session, Category, area.category_id), area)
    return Owner(await get_or_404(session, Category, owner_id), None)


async def owner_of(session, item) -> Owner:
    if item.area_id is not None:
        return await load_owner(session, "area", str(item.area_id))
    return await load_owner(session, "category", item.category_id)


async def topic_names(session, owner: Owner) -> list[str]:
    names: set[str] = set()
    for model in (Note, Contact, Attachment):
        rows = await session.scalars(select(model.topic).where(owner.filter(model), model.topic.is_not(None)))
        names.update(rows)
    return sorted(names, key=str.lower)


async def normalise_topic(session, owner: Owner, topic: str | None) -> str | None:
    """Trim; reuse an existing topic's spelling when it matches ignoring case (LLR-10.2)."""
    topic = (topic or "").strip()
    if not topic:
        return None
    for existing in await topic_names(session, owner):
        if existing.lower() == topic.lower():
            return existing
    return topic


# ── Phones ────────────────────────────────────────────────────────────────────


def digits(number: str) -> str:
    return re.sub(r"\D", "", number)


def phone_out(phone: dict, settings: Settings) -> schemas.PhoneOut:
    number = phone["number"]
    only_digits = digits(number)
    tel = f"+{only_digits}" if number.strip().startswith("+") else only_digits
    whatsapp_url = None
    if phone.get("whatsapp"):
        wa = only_digits if number.strip().startswith("+") or len(only_digits) > 10 else settings.default_country_code + only_digits
        whatsapp_url = f"https://wa.me/{wa}"
    return schemas.PhoneOut(**phone, tel=tel, whatsapp_url=whatsapp_url)


def contact_out(contact: Contact, settings: Settings) -> schemas.ContactOut:
    return schemas.ContactOut(
        id=contact.id,
        topic=contact.topic,
        name=contact.name,
        organisation=contact.organisation,
        role=contact.role,
        phones=[phone_out(p, settings) for p in contact.phones],
        email=contact.email,
        website=contact.website,
        last_visit=contact.last_visit,
        notes=contact.notes,
        created_at=contact.created_at,
        updated_at=contact.updated_at,
    )


# ── Files: validation, storage, signed links ──────────────────────────────────


def sniff_type(head: bytes) -> tuple[str, str] | None:
    """Content type from the file's first bytes, never from its name (LLR-10.7)."""
    if head.startswith(b"%PDF"):
        return "application/pdf", ".pdf"
    if head.startswith(b"\xff\xd8\xff"):
        return "image/jpeg", ".jpg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png", ".png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "image/webp", ".webp"
    if head[4:8] == b"ftyp" and head[8:12] in {b"heic", b"heix", b"hevc", b"heim", b"heis", b"mif1", b"msf1"}:
        return "image/heic", ".heic"
    return None


def signing_key(settings: Settings) -> bytes:
    base = settings.signing_key or f"download:{settings.demo_token}"
    return hashlib.sha256(base.encode()).digest()


def signature(settings: Settings, file_id: int, expires: int) -> str:
    return hmac.new(signing_key(settings), f"{file_id}:{expires}".encode(), hashlib.sha256).hexdigest()[:32]


def file_out(attachment: Attachment, settings: Settings) -> schemas.FileOut:
    expires = int(time.time()) + LINK_SECONDS
    return schemas.FileOut(
        id=attachment.id,
        topic=attachment.topic,
        title=attachment.title,
        doc_date=attachment.doc_date,
        amount=float(attachment.amount) if attachment.amount is not None else None,
        original_name=attachment.original_name,
        content_type=attachment.content_type,
        size_bytes=attachment.size_bytes,
        is_image=attachment.content_type in {"image/jpeg", "image/png", "image/webp"},
        # Relative to the API base URL; the client prefixes it.
        url=f"/files/{attachment.id}/download?expires={expires}&sig={signature(settings, attachment.id, expires)}",
        created_at=attachment.created_at,
    )


def remove_stored_files(settings: Settings, stored_names: list[str]) -> None:
    """Called only after the database change has committed (LLR-10.10)."""
    for name in stored_names:
        (settings.files_dir / name).unlink(missing_ok=True)


async def stored_names_under(session, category_id: str | None = None, area_ids: list[int] | None = None) -> list[str]:
    conditions = []
    if category_id is not None:
        conditions.append(Attachment.category_id == category_id)
    if area_ids:
        conditions.append(Attachment.area_id.in_(area_ids))
    if not conditions:
        return []
    return list(await session.scalars(select(Attachment.stored_name).where(or_(*conditions))))


# ── Details view ──────────────────────────────────────────────────────────────


def contact_sort_key(contact: Contact):
    # Customer care first; executives newest visit first, undated after dated (BR-R21); then name.
    visit = contact.last_visit.toordinal() if contact.last_visit else 0
    return (ROLE_ORDER.get(contact.role, 3), -visit, contact.name.lower())


def last_executive(contacts: list[Contact]) -> Contact | None:
    executives = [c for c in contacts if c.role in EXECUTIVE_ROLES]
    if not executives:
        return None
    dated = [c for c in executives if c.last_visit]
    if dated:
        return max(dated, key=lambda c: (c.last_visit, c.id))
    return max(executives, key=lambda c: c.id)  # none dated: the most recently added


async def details_for(session, settings: Settings, owner: Owner) -> schemas.DetailsOut:
    notes = (await session.scalars(select(Note).where(owner.filter(Note)))).all()
    contacts = (await session.scalars(select(Contact).where(owner.filter(Contact)))).all()
    files = (await session.scalars(select(Attachment).where(owner.filter(Attachment)))).all()

    grouped: dict[str | None, dict[str, list]] = defaultdict(lambda: {"notes": [], "contacts": [], "files": []})
    for item, key in [*((n, "notes") for n in notes), *((c, "contacts") for c in contacts), *((f, "files") for f in files)]:
        grouped[item.topic][key].append(item)

    def group(topic: str | None) -> schemas.TopicGroup:
        g = grouped[topic]
        latest = last_executive(g["contacts"])
        return schemas.TopicGroup(
            topic=topic,
            last_executive=contact_out(latest, settings) if latest else None,
            contacts=[contact_out(c, settings) for c in sorted(g["contacts"], key=contact_sort_key)],
            files=[
                file_out(f, settings)
                for f in sorted(g["files"], key=lambda f: (f.doc_date or date.min, f.created_at), reverse=True)
            ],
            notes=[schemas.NoteOut.model_validate(n) for n in sorted(g["notes"], key=lambda n: n.updated_at, reverse=True)],
        )

    named = sorted((t for t in grouped if t is not None), key=str.lower)
    return schemas.DetailsOut(
        owner_type=owner.type,
        owner_id=owner.id,
        path=owner.path,
        topics=[group(t) for t in named] + ([group(None)] if None in grouped else []),  # General last
        topic_names=named,
        counts=schemas.DetailCounts(notes=len(notes), contacts=len(contacts), files=len(files)),
    )


@router.get("/categories/{category_id}/details", response_model=schemas.DetailsOut)
async def category_details(category_id: str, session: SessionDep, settings: SettingsDep):
    return await details_for(session, settings, await load_owner(session, "category", category_id))


@router.get("/areas/{area_id}/details", response_model=schemas.DetailsOut)
async def area_details(area_id: str, session: SessionDep, settings: SettingsDep):
    return await details_for(session, settings, await load_owner(session, "area", area_id))


# ── Notes ─────────────────────────────────────────────────────────────────────


async def _create_note(session, owner: Owner, body: schemas.NoteCreate) -> Note:
    note = Note(
        **owner.columns(),
        topic=await normalise_topic(session, owner, body.topic),
        title=(body.title or "").strip() or None,
        body=body.body.strip(),
    )
    session.add(note)
    await session.commit()
    return note


@router.post("/categories/{owner_id}/notes", response_model=schemas.NoteOut, status_code=201)
async def add_category_note(owner_id: str, body: schemas.NoteCreate, session: SessionDep):
    return await _create_note(session, await load_owner(session, "category", owner_id), body)


@router.post("/areas/{owner_id}/notes", response_model=schemas.NoteOut, status_code=201)
async def add_area_note(owner_id: str, body: schemas.NoteCreate, session: SessionDep):
    return await _create_note(session, await load_owner(session, "area", owner_id), body)


@router.patch("/notes/{note_id}", response_model=schemas.NoteOut)
async def update_note(note_id: int, body: schemas.NoteUpdate, session: SessionDep):
    note = await get_or_404(session, Note, note_id)
    changes = body.model_dump(exclude_unset=True)
    if "topic" in changes:
        note.topic = await normalise_topic(session, await owner_of(session, note), changes["topic"])
    if "title" in changes:
        note.title = (changes["title"] or "").strip() or None
    if changes.get("body") is not None:
        note.body = changes["body"].strip()
    elif "body" in changes:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "body cannot be null")
    await session.commit()
    return note


@router.delete("/notes/{note_id}", status_code=204)
async def delete_note(note_id: int, session: SessionDep):
    await session.delete(await get_or_404(session, Note, note_id))
    await session.commit()


# ── Contacts ──────────────────────────────────────────────────────────────────


def _apply_contact_fields(contact: Contact, fields: dict) -> None:
    for key in ("organisation", "email", "website"):
        if key in fields:
            setattr(contact, key, (fields[key] or "").strip() or None)
    if "name" in fields:
        if not fields["name"]:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "name cannot be empty")
        contact.name = fields["name"].strip()
    if fields.get("role") is not None:
        contact.role = fields["role"]
    if "last_visit" in fields:
        contact.last_visit = fields["last_visit"]
    if fields.get("notes") is not None:
        contact.notes = fields["notes"].strip()
    if fields.get("phones") is not None:
        contact.phones = [{**p, "number": p["number"].strip()} for p in fields["phones"]]
        contact.phone_digits = " ".join(digits(p["number"]) for p in contact.phones)


async def _create_contact(session, settings, owner: Owner, body: schemas.ContactCreate) -> schemas.ContactOut:
    contact = Contact(**owner.columns(), topic=await normalise_topic(session, owner, body.topic), name="", phones=[])
    _apply_contact_fields(contact, body.model_dump(exclude={"topic"}))
    session.add(contact)
    await session.commit()
    return contact_out(contact, settings)


@router.post("/categories/{owner_id}/contacts", response_model=schemas.ContactOut, status_code=201)
async def add_category_contact(owner_id: str, body: schemas.ContactCreate, session: SessionDep, settings: SettingsDep):
    return await _create_contact(session, settings, await load_owner(session, "category", owner_id), body)


@router.post("/areas/{owner_id}/contacts", response_model=schemas.ContactOut, status_code=201)
async def add_area_contact(owner_id: str, body: schemas.ContactCreate, session: SessionDep, settings: SettingsDep):
    return await _create_contact(session, settings, await load_owner(session, "area", owner_id), body)


@router.patch("/contacts/{contact_id}", response_model=schemas.ContactOut)
async def update_contact(contact_id: int, body: schemas.ContactUpdate, session: SessionDep, settings: SettingsDep):
    contact = await get_or_404(session, Contact, contact_id)
    changes = body.model_dump(exclude_unset=True)
    if "topic" in changes:
        contact.topic = await normalise_topic(session, await owner_of(session, contact), changes.pop("topic"))
    _apply_contact_fields(contact, changes)
    await session.commit()
    return contact_out(contact, settings)


@router.delete("/contacts/{contact_id}", status_code=204)
async def delete_contact(contact_id: int, session: SessionDep):
    await session.delete(await get_or_404(session, Contact, contact_id))
    await session.commit()


# ── Files ─────────────────────────────────────────────────────────────────────


async def _store_upload(upload: UploadFile, settings: Settings) -> tuple[str, str, int]:
    """Stream to disk under a random name, enforcing size and type. Returns (stored_name, type, size)."""
    head = await upload.read(16)
    kind = sniff_type(head)
    if kind is None:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, FILE_RULES)
    content_type, extension = kind
    stored_name = f"{secrets.token_hex(16)}{extension}"
    target = settings.files_dir / stored_name
    size = len(head)
    try:
        with target.open("wb") as out:
            out.write(head)
            while chunk := await upload.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_FILE_BYTES:
                    raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, FILE_RULES)
                out.write(chunk)
    except BaseException:
        target.unlink(missing_ok=True)
        raise
    return stored_name, content_type, size


async def _create_file(session, settings, owner: Owner, upload: UploadFile, title: str, topic, doc_date, amount):
    title = title.strip()
    if not title or len(title) > 120:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "title must be 1 to 120 characters")
    if amount is not None and amount < 0:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "amount can't be negative")
    stored_name, content_type, size = await _store_upload(upload, settings)
    attachment = Attachment(
        **owner.columns(),
        topic=await normalise_topic(session, owner, topic),
        title=title,
        doc_date=doc_date,
        amount=Decimal(str(amount)) if amount is not None else None,
        stored_name=stored_name,
        original_name=Path(upload.filename or "").name[:255],
        content_type=content_type,
        size_bytes=size,
    )
    session.add(attachment)
    try:
        await session.commit()
    except BaseException:
        remove_stored_files(settings, [stored_name])
        raise
    return file_out(attachment, settings)


FileForm = Annotated[UploadFile, File(description=FILE_RULES)]
TitleForm = Annotated[str, Form()]
TopicForm = Annotated[str | None, Form()]
DateForm = Annotated[date | None, Form(alias="docDate")]
AmountForm = Annotated[float | None, Form()]


@router.post("/categories/{owner_id}/files", response_model=schemas.FileOut, status_code=201)
async def upload_category_file(
    owner_id: str, file: FileForm, title: TitleForm, session: SessionDep, settings: SettingsDep,
    topic: TopicForm = None, doc_date: DateForm = None, amount: AmountForm = None,
):
    owner = await load_owner(session, "category", owner_id)
    return await _create_file(session, settings, owner, file, title, topic, doc_date, amount)


@router.post("/areas/{owner_id}/files", response_model=schemas.FileOut, status_code=201)
async def upload_area_file(
    owner_id: str, file: FileForm, title: TitleForm, session: SessionDep, settings: SettingsDep,
    topic: TopicForm = None, doc_date: DateForm = None, amount: AmountForm = None,
):
    owner = await load_owner(session, "area", owner_id)
    return await _create_file(session, settings, owner, file, title, topic, doc_date, amount)


@router.patch("/files/{file_id}", response_model=schemas.FileOut)
async def update_file(file_id: int, body: schemas.FileUpdate, session: SessionDep, settings: SettingsDep):
    attachment = await get_or_404(session, Attachment, file_id)
    changes = body.model_dump(exclude_unset=True)
    if "topic" in changes:
        attachment.topic = await normalise_topic(session, await owner_of(session, attachment), changes["topic"])
    if changes.get("title"):
        attachment.title = changes["title"].strip()
    if "doc_date" in changes:
        attachment.doc_date = changes["doc_date"]
    if "amount" in changes:
        attachment.amount = Decimal(str(changes["amount"])) if changes["amount"] is not None else None
    await session.commit()
    return file_out(attachment, settings)


@router.delete("/files/{file_id}", status_code=204)
async def delete_file(file_id: int, session: SessionDep, settings: SettingsDep):
    attachment = await get_or_404(session, Attachment, file_id)
    stored_name = attachment.stored_name
    await session.delete(attachment)
    await session.commit()
    remove_stored_files(settings, [stored_name])


@download_router.get("/files/{file_id}/download")
async def download_file(
    file_id: int,
    session: SessionDep,
    settings: SettingsDep,
    expires: int | None = None,
    sig: str | None = None,
    authorization: Annotated[str | None, Header()] = None,
):
    signed_ok = (
        expires is not None
        and sig is not None
        and expires >= time.time()
        and hmac.compare_digest(sig, signature(settings, file_id, expires))
    )
    header_ok = authorization is not None and hmac.compare_digest(authorization, f"Bearer {settings.demo_token}")
    if not (signed_ok or header_ok):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This link has expired; reload the page to get a fresh one")
    attachment = await get_or_404(session, Attachment, file_id)
    path = settings.files_dir / attachment.stored_name
    if not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File is missing from storage")
    return FileResponse(
        path,
        media_type=attachment.content_type,
        filename=attachment.original_name or f"{attachment.title}{path.suffix}",
        content_disposition_type="inline",
        headers={"Cache-Control": "private, max-age=3600"},
    )


# ── Search ────────────────────────────────────────────────────────────────────


def snippet(text: str, query: str, width: int = 120) -> str:
    text = " ".join((text or "").split())
    at = text.lower().find(query.lower())
    if at < 0 or len(text) <= width:
        return text[:width]
    start = max(0, at - width // 3)
    return ("…" if start else "") + text[start : start + width] + ("…" if start + width < len(text) else "")


@router.get("/search", response_model=list[schemas.SearchHit])
async def search(
    session: SessionDep,
    q: Annotated[str, Query(min_length=2, max_length=100)],
    limit: Annotated[int, Query(ge=1, le=100)] = 30,
):
    """Search notes, contacts and files everywhere, including phone numbers by digits (LLR-10.9)."""
    term = f"%{q.strip().lower()}%"
    query_digits = digits(q)
    categories = {c.id: c for c in (await session.scalars(select(Category))).all()}
    areas = {a.id: a for a in (await session.scalars(select(Area))).all()}

    def owner_bits(item) -> tuple[str, str, str]:
        if item.area_id is not None:
            area = areas[item.area_id]
            return "area", str(area.id), f"{categories[area.category_id].name} › {area.name}"
        return "category", item.category_id, categories[item.category_id].name

    def like(*columns):
        return or_(*(func.lower(func.coalesce(col, "")).like(term) for col in columns))

    hits: list[schemas.SearchHit] = []
    contact_match = like(Contact.name, Contact.organisation, Contact.topic, Contact.notes, Contact.email)
    if len(query_digits) >= 3 and not re.search(r"[^\d\s+()\-]", q):  # looks like a phone number
        contact_match = or_(contact_match, Contact.phone_digits.like(f"%{query_digits}%"))
    for c in (await session.scalars(select(Contact).where(contact_match).limit(limit))).all():
        kind, owner_id, path = owner_bits(c)
        detail = ", ".join(filter(None, [c.organisation, " / ".join(p["number"] for p in c.phones)]))
        hits.append(schemas.SearchHit(kind="contact", id=c.id, title=c.name, snippet=detail, topic=c.topic,
                                      owner_type=kind, owner_id=owner_id, path=path))
    for n in (await session.scalars(select(Note).where(like(Note.title, Note.body, Note.topic)).limit(limit))).all():
        kind, owner_id, path = owner_bits(n)
        hits.append(schemas.SearchHit(kind="note", id=n.id, title=n.title or snippet(n.body, q, 60),
                                      snippet=snippet(n.body, q), topic=n.topic, owner_type=kind, owner_id=owner_id, path=path))
    for f in (await session.scalars(
        select(Attachment).where(like(Attachment.title, Attachment.topic, Attachment.original_name)).limit(limit)
    )).all():
        kind, owner_id, path = owner_bits(f)
        hits.append(schemas.SearchHit(kind="file", id=f.id, title=f.title, snippet=f.original_name, topic=f.topic,
                                      owner_type=kind, owner_id=owner_id, path=path))
    return hits[:limit]
