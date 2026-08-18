"""Therapy plans + supervisor review gate.

Plan lifecycle (server-enforced):
  Draft/Changes Requested --submit--> Pending Supervisor Review
  Pending Supervisor Review --approve--> Approved
  Pending Supervisor Review --reject-->  Changes Requested (feedback set)
"""
from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..deps import get_current_user, require_roles
from ..schemas import PlanIn, ReviewIn

router = APIRouter(prefix="/api/plans", tags=["plans"])


def _plan(plan_id: str) -> dict:
    row = db.q("SELECT * FROM plans WHERE id = ?", (plan_id,))
    if row is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    return row


@router.get("")
def list_plans():
    return db.qa("SELECT * FROM plans ORDER BY created_at")


@router.get("/{plan_id}")
def get_plan(plan_id: str):
    return _plan(plan_id)


def _can_write_plan(user: dict, case_id: str) -> bool:
    if user["role"] == "ADMIN":
        return True
    if user["role"] != "THERAPIST":
        return False
    case = db.q("SELECT * FROM cases WHERE id = ?", (case_id,))
    return case is not None and case["therapistId"] == user["id"]


@router.put("")
def save_plan(body: PlanIn, user: dict = Depends(get_current_user)):
    if not _can_write_plan(user, body.case_id):
        raise HTTPException(status_code=403, detail="Only the assigned therapist (or admin) can edit this plan")
    if body.status not in ("Draft", "Pending Supervisor Review"):
        raise HTTPException(status_code=400, detail="Therapist can only save a draft or submit for review")

    existing = None
    if body.id:
        existing = db.q("SELECT * FROM plans WHERE id = ?", (body.id,))
        if existing and existing["caseId"] != body.case_id:
            raise HTTPException(status_code=400, detail="Plan does not belong to this case")
    if existing is None:
        existing = db.q("SELECT * FROM plans WHERE case_id = ?", (body.case_id,))

    now = db.now_ms()
    if existing:
        submitted_at = existing["submittedAt"]
        feedback = existing["feedback"]
        if body.status == "Pending Supervisor Review":
            submitted_at = now
            feedback = ""
        db.x(
            "UPDATE plans SET long_term_goals = ?, short_term_goals = ?, activities = ?, baseline_summary = ?, "
            "frequency = ?, duration = ?, total_sessions = ?, status = ?, feedback = ?, submitted_at = ?, updated_at = ? "
            "WHERE id = ?",
            (db.json_dumps(body.long_term_goals), db.json_dumps(body.short_term_goals), body.activities,
             body.baseline_summary, body.frequency, body.duration, body.total_sessions, body.status, feedback,
             submitted_at, now, existing["id"]),
        )
        return _plan(existing["id"])

    plan_id = db.uid("plan")
    submitted_at = now if body.status == "Pending Supervisor Review" else None
    db.x(
        "INSERT INTO plans (id, case_id, long_term_goals, short_term_goals, activities, baseline_summary, "
        "frequency, duration, total_sessions, status, feedback, submitted_at, reviewed_at, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, NULL, ?, ?)",
        (plan_id, body.case_id, db.json_dumps(body.long_term_goals), db.json_dumps(body.short_term_goals),
         body.activities, body.baseline_summary, body.frequency, body.duration, body.total_sessions,
         body.status, submitted_at, now, now),
    )
    if body.status == "Pending Supervisor Review":
        db.x(
            "INSERT INTO case_events (id, case_id, actor_id, event_type, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (db.uid("evt"), body.case_id, user["id"], "Plan submitted", "Therapy plan submitted for supervisor review",
             now),
        )
        db.x(
            "INSERT INTO notifications (id, user_id, text, read, created_at) VALUES (?, ?, ?, 0, ?)",
            (db.uid("ntf"), db.q("SELECT supervisor_id FROM cases WHERE id = ?", (body.case_id,))["supervisorId"],
             "A therapy plan is awaiting your review", now),
        )
    return _plan(plan_id)


@router.post("/{plan_id}/review")
def review_plan(plan_id: str, body: ReviewIn, user: dict = Depends(get_current_user)):
    plan = _plan(plan_id)
    case = db.q("SELECT * FROM cases WHERE id = ?", (plan["caseId"],))
    if user["role"] == "ADMIN":
        pass
    elif user["role"] != "SUPERVISOR" or case is None or case["supervisorId"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only the assigned supervisor (or admin) can review this plan")
    if plan["status"] != "Pending Supervisor Review":
        raise HTTPException(status_code=409, detail="Only submitted plans can be reviewed")

    now = db.now_ms()
    if body.approve:
        db.x("UPDATE plans SET status = 'Approved', feedback = '', reviewed_at = ? WHERE id = ?", (now, plan_id))
        db.x(
            "INSERT INTO case_events (id, case_id, actor_id, event_type, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (db.uid("evt"), plan["caseId"], user["id"], "Plan approved", "Therapy plan approved by supervisor", now),
        )
        db.x(
            "INSERT INTO notifications (id, user_id, text, read, created_at) VALUES (?, ?, ?, 0, ?)",
            (db.uid("ntf"), case["therapistId"], "Your therapy plan was approved", now),
        )
    else:
        db.x("UPDATE plans SET status = 'Changes Requested', feedback = ?, reviewed_at = ? WHERE id = ?",
             (body.feedback, now, plan_id))
        db.x(
            "INSERT INTO case_events (id, case_id, actor_id, event_type, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (db.uid("evt"), plan["caseId"], user["id"], "Plan changes requested", body.feedback or "Changes requested", now),
        )
        db.x(
            "INSERT INTO notifications (id, user_id, text, read, created_at) VALUES (?, ?, ?, 0, ?)",
            (db.uid("ntf"), case["therapistId"], "Your therapy plan needs changes", now),
        )
    return _plan(plan_id)
