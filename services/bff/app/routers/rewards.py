"""Rewards: a free-standing list, linked to any tasks. A reward unlocks when its linked tasks meet its rule.

A reward can be kept in an area (to organise it: an area's Rewards tab lists it), but that never limits
linking: any reward can be linked to any task (many-to-many), on the Link screen. Older rewards that
counted "all tasks in the area" keep working.

A reward can also be an *idea* (HLR-12): a wishlist entry with no rule. Ideas never unlock and can't
be linked or claimed; they're turned into a reward (activate) or closed as bought/dropped.
"""

from typing import Annotated

import hmac
import time

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import delete, func, insert, select

from .. import schemas
from ..deps import NowDep, SessionDep, SettingsDep
from .details import _store_upload, remove_stored_files
from ..models import Area, Reward, Task, reward_tasks
from ..services import cover_signature, ensure_tasks_exist, evaluate_unlocks, get_or_404, rewards_out

router = APIRouter(tags=["rewards"])
# Cover images are opened by <img>, which can't send the auth header: signed links, no auth dependency.
cover_router = APIRouter(tags=["rewards"])

IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}


def _conflict(message: str) -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, message)


def _must_be_reward(reward: Reward) -> None:
    """Ideas and closed ideas have no rule, so they can't be linked to tasks (BR-R27)."""
    if reward.status == "idea":
        raise _conflict("This is still an idea: turn it into a reward before linking tasks")
    if reward.status == "closed":
        raise _conflict("This idea is closed: reopen it first")


async def _set_tasks(session, reward_id: int, task_ids: list[int]) -> None:
    await session.execute(delete(reward_tasks).where(reward_tasks.c.reward_id == reward_id))
    if task_ids:
        await session.execute(insert(reward_tasks), [{"reward_id": reward_id, "task_id": t} for t in task_ids])


async def _area_or_422(session, area_id: int) -> Area:
    area = await session.get(Area, area_id)
    if area is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Unknown area {area_id}")
    return area


async def _single_out(session, reward: Reward, settings, now) -> schemas.RewardOut:
    [out] = await rewards_out(session, [reward], settings.tz, now.astimezone(settings.tz).date(), settings)
    return out


@router.get("/rewards", response_model=list[schemas.RewardOut])
async def list_rewards(
    session: SessionDep,
    settings: SettingsDep,
    now: NowDep,
    status: schemas.RewardStatus | None = None,
    area_id: Annotated[int | None, Query(alias="areaId")] = None,
    for_whom: Annotated[str | None, Query(alias="forWhom")] = None,
):
    """All rewards and ideas, newest first; filter by ?status= (idea, closed, ...), ?areaId=, ?forWhom=."""
    query = select(Reward).order_by(Reward.created_at.desc())
    if status:
        query = query.where(Reward.status == status)
    if area_id is not None:
        query = query.where(Reward.area_id == area_id)
    if for_whom:
        query = query.where(func.lower(Reward.for_whom) == for_whom.strip().lower())
    rewards = (await session.scalars(query)).all()
    return await rewards_out(session, rewards, settings.tz, now.astimezone(settings.tz).date(), settings)


@router.get("/rewards/{reward_id}", response_model=schemas.RewardOut)
async def get_reward(reward_id: int, session: SessionDep, settings: SettingsDep, now: NowDep):
    return await _single_out(session, await get_or_404(session, Reward, reward_id), settings, now)


@router.post("/rewards", response_model=schemas.RewardOut, status_code=201)
async def create_reward(body: schemas.RewardCreate, session: SessionDep, settings: SettingsDep, now: NowDep):
    if body.status == "idea" and body.task_ids:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "An idea has no tasks; turn it into a reward first")
    task_ids = await ensure_tasks_exist(session, body.task_ids)
    reward = Reward(**body.model_dump(exclude={"task_ids", "visibility"}))
    reward.title = reward.title.strip()
    reward.for_whom = await _canonical_person(session, body.for_whom)
    # Ideas are silent by default, so a surprise stays a surprise (Q24).
    reward.visibility = body.visibility or ("silent" if body.status == "idea" else "announced")
    if body.area_id is not None:
        reward.category_id = (await _area_or_422(session, body.area_id)).category_id
    session.add(reward)
    await session.flush()  # assigns reward.id
    await _set_tasks(session, reward.id, task_ids)
    # Linked tasks that already meet the rule unlock it straight away.
    await evaluate_unlocks(session, [reward], settings.tz, now)
    await session.commit()
    return await _single_out(session, reward, settings, now)


@router.patch("/rewards/{reward_id}", response_model=schemas.RewardOut)
async def update_reward(
    reward_id: int, body: schemas.RewardUpdate, session: SessionDep, settings: SettingsDep, now: NowDep
):
    reward = await get_or_404(session, Reward, reward_id)
    changes = body.model_dump(exclude_unset=True)
    new_status = changes.pop("status", None)
    if changes.get("for_whom") is not None:
        changes["for_whom"] = await _canonical_person(session, changes["for_whom"])

    if "area_id" in changes:
        area_id = changes.pop("area_id")
        reward.area_id = area_id
        reward.category_id = (await _area_or_422(session, area_id)).category_id if area_id is not None else None
    for field, value in changes.items():
        if value is None and field not in {"image_url", "link", "where_seen"}:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"{field} cannot be null")
        setattr(reward, field, value.strip() if field == "title" else value)

    if new_status == "claimed":
        if reward.status in {"idea", "closed"}:
            raise _conflict("Ideas can't be claimed; turn it into a reward, or close it as bought")
        if reward.status == "locked":
            raise _conflict("This reward is still locked")
        if reward.status == "unlocked":
            reward.status = "claimed"
            reward.claimed_at = now

    await session.flush()
    await evaluate_unlocks(session, [reward], settings.tz, now)  # a lowered threshold may now be met
    await session.commit()
    return await _single_out(session, reward, settings, now)


@router.put("/rewards/{reward_id}/tasks", response_model=schemas.RewardOut)
async def set_reward_tasks(
    reward_id: int, body: schemas.RewardTasksUpdate, session: SessionDep, settings: SettingsDep, now: NowDep
):
    """Replace the full set of tasks linked to this reward (PUT = idempotent replace)."""
    reward = await get_or_404(session, Reward, reward_id)
    _must_be_reward(reward)
    await _set_tasks(session, reward.id, await ensure_tasks_exist(session, body.task_ids))
    await evaluate_unlocks(session, [reward], settings.tz, now)
    await session.commit()
    return await _single_out(session, reward, settings, now)


@router.post("/rewards/{reward_id}/tasks/{task_id}", response_model=schemas.RewardOut)
async def link_task(reward_id: int, task_id: int, session: SessionDep, settings: SettingsDep, now: NowDep):
    """Link one task to one reward (the Link screen). Linking twice is harmless."""
    reward = await get_or_404(session, Reward, reward_id)
    _must_be_reward(reward)
    await get_or_404(session, Task, task_id)
    exists = await session.scalar(
        select(reward_tasks.c.task_id).where(reward_tasks.c.reward_id == reward_id, reward_tasks.c.task_id == task_id)
    )
    if exists is None:
        await session.execute(insert(reward_tasks).values(reward_id=reward_id, task_id=task_id))
        await evaluate_unlocks(session, [reward], settings.tz, now)
    await session.commit()
    return await _single_out(session, reward, settings, now)


@router.delete("/rewards/{reward_id}/tasks/{task_id}", response_model=schemas.RewardOut)
async def unlink_task(reward_id: int, task_id: int, session: SessionDep, settings: SettingsDep, now: NowDep):
    """Unlink a task. An unlocked or claimed reward stays so (BR-R10); only progress changes while locked."""
    reward = await get_or_404(session, Reward, reward_id)
    await session.execute(
        delete(reward_tasks).where(reward_tasks.c.reward_id == reward_id, reward_tasks.c.task_id == task_id)
    )
    await session.commit()
    return await _single_out(session, reward, settings, now)


@router.delete("/rewards/{reward_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reward(reward_id: int, session: SessionDep, settings: SettingsDep):
    """Deletes the reward, its links and its cover photo. Tasks and completions are untouched."""
    reward = await get_or_404(session, Reward, reward_id)
    cover = reward.cover_stored_name
    await session.delete(reward)
    await session.commit()
    if cover:
        remove_stored_files(settings, [cover])


# ── Ideas (HLR-12) ────────────────────────────────────────────────────────────


async def _canonical_person(session, name: str) -> str:
    """Reuse an earlier spelling of the same person, e.g. "shiragi" becomes "Shiragi", like topics do."""
    name = " ".join(name.split())
    existing = await session.scalar(select(Reward.for_whom).where(func.lower(Reward.for_whom) == name.lower()).limit(1))
    return existing or name


@router.get("/rewards-people", response_model=list[str])
async def people(session: SessionDep):
    """Everyone rewards and ideas are for, for the "for whom" suggestions and filter. "Me" first."""
    names = sorted(set(await session.scalars(select(Reward.for_whom))), key=str.lower)
    return ["Me", *[n for n in names if n != "Me"]]


@router.post("/rewards/{reward_id}/activate", response_model=schemas.RewardOut)
async def activate_idea(
    reward_id: int, body: schemas.RewardActivate, session: SessionDep, settings: SettingsDep, now: NowDep
):
    """Turn an idea into a locked reward, keeping its title, photo, link, notes and for whom (BR-R28)."""
    reward = await get_or_404(session, Reward, reward_id)
    if reward.status != "idea":
        raise _conflict("Only ideas can be turned into rewards")
    reward.status, reward.rule_type, reward.threshold = "locked", body.rule_type, body.threshold
    await session.flush()
    await evaluate_unlocks(session, [reward], settings.tz, now)
    await session.commit()
    return await _single_out(session, reward, settings, now)


@router.post("/rewards/{reward_id}/close", response_model=schemas.RewardOut)
async def close_idea(reward_id: int, body: schemas.RewardClose, session: SessionDep, settings: SettingsDep, now: NowDep):
    """Close an idea as bought or dropped (BR-R29). Rewards with a rule are claimed, not closed."""
    reward = await get_or_404(session, Reward, reward_id)
    if reward.status != "idea":
        raise _conflict("Only ideas can be closed; a reward is claimed when it unlocks")
    reward.status, reward.closed_outcome, reward.closed_at = "closed", body.outcome, now
    await session.commit()
    return await _single_out(session, reward, settings, now)


@router.post("/rewards/{reward_id}/reopen", response_model=schemas.RewardOut)
async def reopen_idea(reward_id: int, session: SessionDep, settings: SettingsDep, now: NowDep):
    reward = await get_or_404(session, Reward, reward_id)
    if reward.status != "closed":
        raise _conflict("Only closed ideas can be reopened")
    reward.status, reward.closed_outcome, reward.closed_at = "idea", None, None
    await session.commit()
    return await _single_out(session, reward, settings, now)


@router.put("/rewards/{reward_id}/cover", response_model=schemas.RewardOut)
async def set_cover(
    reward_id: int, session: SessionDep, settings: SettingsDep, now: NowDep, file: UploadFile = File(...)
):
    """Upload or replace the cover photo (camera or gallery). Images only, same size rules as files."""
    reward = await get_or_404(session, Reward, reward_id)
    stored_name, content_type, _ = await _store_upload(file, settings)
    if content_type not in IMAGE_TYPES:
        remove_stored_files(settings, [stored_name])
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "A cover must be a JPG, PNG, WebP or HEIC photo")
    old = reward.cover_stored_name
    reward.cover_stored_name, reward.cover_content_type = stored_name, content_type
    await session.commit()
    if old:
        remove_stored_files(settings, [old])
    return await _single_out(session, reward, settings, now)


@router.delete("/rewards/{reward_id}/cover", response_model=schemas.RewardOut)
async def remove_cover(reward_id: int, session: SessionDep, settings: SettingsDep, now: NowDep):
    reward = await get_or_404(session, Reward, reward_id)
    old, reward.cover_stored_name, reward.cover_content_type = reward.cover_stored_name, None, None
    await session.commit()
    if old:
        remove_stored_files(settings, [old])
    return await _single_out(session, reward, settings, now)


@cover_router.get("/rewards/{reward_id}/cover")
async def get_cover(reward_id: int, session: SessionDep, settings: SettingsDep, expires: int = 0, sig: str = ""):
    if expires < time.time() or not hmac.compare_digest(sig, cover_signature(settings, reward_id, expires)):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This link has expired; reload the page to get a fresh one")
    reward = await get_or_404(session, Reward, reward_id)
    path = settings.files_dir / (reward.cover_stored_name or "")
    if not reward.cover_stored_name or not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No cover photo")
    return FileResponse(path, media_type=reward.cover_content_type, headers={"Cache-Control": "private, max-age=3600"})
