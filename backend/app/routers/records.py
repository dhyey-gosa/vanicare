"""Therapist records (hours + competencies) and programme requirements."""
import json

from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..deps import get_current_user, require_roles
from ..schemas import CompetencyIn, RecordPatch, RequirementIn

router = APIRouter(prefix="/api", tags=["records"])


def _record(therapist_id: str) -> dict:
    row = db.q("SELECT * FROM records WHERE therapist_id = ?", (therapist_id,))
    if row is None:
        raise HTTPException(status_code=404, detail="No record for this therapist")
    return row


@router.get("/records")
def list_records():
    return db.qa("SELECT * FROM records")


def _can_edit_record(user: dict, therapist_id: str) -> bool:
    return user["role"] in ("ADMIN", "SUPERVISOR") or (
        user["role"] == "THERAPIST" and user["id"] == therapist_id
    )


@router.put("/records/{therapist_id}")
def update_record(therapist_id: str, body: RecordPatch, user: dict = Depends(get_current_user)):
    if not _can_edit_record(user, therapist_id):
        raise HTTPException(status_code=403, detail="Not allowed to edit this record")
    existing = db.q("SELECT * FROM records WHERE therapist_id = ?", (therapist_id,))
    if existing is None:
        db.ensure_record(therapist_id)
        existing = db.q("SELECT * FROM records WHERE therapist_id = ?", (therapist_id,))
    direct = body.direct_hours if body.direct_hours is not None else existing["directHours"]
    indirect = body.indirect_hours if body.indirect_hours is not None else existing["indirectHours"]
    db.x("UPDATE records SET direct_hours = ?, indirect_hours = ? WHERE therapist_id = ?",
         (direct, indirect, therapist_id))
    return _record(therapist_id)


@router.put("/records/{therapist_id}/competency")
def set_competency(therapist_id: str, body: CompetencyIn, user: dict = Depends(get_current_user)):
    if not _can_edit_record(user, therapist_id):
        raise HTTPException(status_code=403, detail="Not allowed to edit this record")
    existing = db.q("SELECT * FROM records WHERE therapist_id = ?", (therapist_id,))
    if existing is None:
        db.ensure_record(therapist_id)
        existing = db.q("SELECT * FROM records WHERE therapist_id = ?", (therapist_id,))
    competencies = existing["competencies"]
    competencies[body.area] = body.status
    db.x("UPDATE records SET competencies = ? WHERE therapist_id = ?",
         (json.dumps(competencies), therapist_id))
    return _record(therapist_id)


@router.get("/requirements")
def get_requirement():
    row = db.q("SELECT required_direct AS requiredDirect, required_indirect AS requiredIndirect, "
               "required_direct_percent AS requiredDirectPercent FROM requirement WHERE id = 1")
    return row


@router.put("/requirements")
def set_requirement(body: RequirementIn, user: dict = Depends(require_roles("ADMIN"))):
    db.x("UPDATE requirement SET required_direct = ?, required_indirect = ?, required_direct_percent = ? WHERE id = 1",
         (body.required_direct, body.required_indirect, body.required_direct_percent))
    return get_requirement()
