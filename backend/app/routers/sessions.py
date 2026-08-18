"""Therapy sessions (SOAP documentation)."""
from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..deps import get_current_user
from ..schemas import SessionIn

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("")
def list_sessions():
    return db.qa("SELECT * FROM sessions ORDER BY case_id, number")


def _can_write_session(user: dict, case_id: str) -> bool:
    if user["role"] == "ADMIN":
        return True
    if user["role"] != "THERAPIST":
        return False
    case = db.q("SELECT * FROM cases WHERE id = ?", (case_id,))
    return case is not None and case["therapistId"] == user["id"]


@router.put("")
def save_session(body: SessionIn, user: dict = Depends(get_current_user)):
    if not _can_write_session(user, body.case_id):
        raise HTTPException(status_code=403, detail="Only the assigned therapist (or admin) can document sessions")

    existing = None
    if body.id:
        existing = db.q("SELECT * FROM sessions WHERE id = ?", (body.id,))
    if existing is None:
        existing = db.q("SELECT * FROM sessions WHERE case_id = ? AND number = ?", (body.case_id, body.number))

    now = db.now_ms()
    if existing:
        db.x(
            "UPDATE sessions SET date = ?, duration = ?, goals_addressed = ?, activities = ?, patient_response = ?, "
            "progress_observed = ?, challenges = ?, notes = ?, next_session_plan = ?, status = ?, goal_scores = ? "
            "WHERE id = ?",
            (body.date, body.duration, body.goals_addressed, body.activities, body.patient_response,
             body.progress_observed, body.challenges, body.notes, body.next_session_plan, body.status,
             db.json_dumps(body.goal_scores), existing["id"]),
        )
        return db.q("SELECT * FROM sessions WHERE id = ?", (existing["id"],))

    session_id = db.uid("ses")
    db.x(
        "INSERT INTO sessions (id, case_id, number, date, duration, goals_addressed, activities, patient_response, "
        "progress_observed, challenges, notes, next_session_plan, status, goal_scores, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (session_id, body.case_id, body.number, body.date, body.duration, body.goals_addressed, body.activities,
         body.patient_response, body.progress_observed, body.challenges, body.notes, body.next_session_plan,
         body.status, db.json_dumps(body.goal_scores), now),
    )
    return db.q("SELECT * FROM sessions WHERE id = ?", (session_id,))
