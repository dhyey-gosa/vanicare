"""Progress reports + supervisor evaluation gate.

Report lifecycle (server-enforced):
  Draft --submit--> Awaiting Supervisor Evaluation
  Awaiting Supervisor Evaluation --evaluate--> Evaluated
On evaluation the case state machine fires:
  outcome Close Case        -> case Closed
  outcome Discontinue Case  -> case Discontinued
  outcome Continue Therapy  -> case stays Active
"""
from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..deps import get_current_user
from ..schemas import EvaluateIn, ReportIn

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _report(report_id: str) -> dict:
    row = db.q("SELECT * FROM reports WHERE id = ?", (report_id,))
    if row is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return row


@router.get("")
def list_reports():
    return db.qa("SELECT * FROM reports ORDER BY created_at")


@router.get("/{report_id}")
def get_report(report_id: str):
    return _report(report_id)


def _can_write_report(user: dict, case_id: str) -> bool:
    if user["role"] == "ADMIN":
        return True
    if user["role"] != "THERAPIST":
        return False
    case = db.q("SELECT * FROM cases WHERE id = ?", (case_id,))
    return case is not None and case["therapistId"] == user["id"]


@router.put("")
def save_report(body: ReportIn, user: dict = Depends(get_current_user)):
    if not _can_write_report(user, body.case_id):
        raise HTTPException(status_code=403, detail="Only the assigned therapist (or admin) can edit this report")
    if body.status not in ("Draft", "Awaiting Supervisor Evaluation"):
        raise HTTPException(status_code=400, detail="Therapist can only save a draft or submit for evaluation")

    existing = None
    if body.id:
        existing = db.q("SELECT * FROM reports WHERE id = ?", (body.id,))
        if existing and existing["caseId"] != body.case_id:
            raise HTTPException(status_code=400, detail="Report does not belong to this case")
    if existing is None:
        existing = db.q("SELECT * FROM reports WHERE case_id = ?", (body.case_id,))
    if existing and existing["status"] == "Evaluated":
        raise HTTPException(status_code=409, detail="An evaluated report cannot be edited")

    now = db.now_ms()
    if existing:
        submitted_at = existing["submittedAt"]
        if body.status == "Awaiting Supervisor Evaluation":
            submitted_at = now
        db.x(
            "UPDATE reports SET summary = ?, goals_addressed = ?, recommendations = ?, observations = ?, "
            "domains = ?, status = ?, submitted_at = ?, updated_at = ? WHERE id = ?",
            (body.summary, body.goals_addressed, body.recommendations, body.observations,
             db.json_dumps(body.domains), body.status, submitted_at, now, existing["id"]),
        )
        if body.status == "Awaiting Supervisor Evaluation" and not existing["submittedAt"]:
            db.x(
                "INSERT INTO case_events (id, case_id, actor_id, event_type, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (db.uid("evt"), body.case_id, user["id"], "Report submitted",
                 "Progress report submitted for supervisor evaluation", now),
            )
            case = db.q("SELECT * FROM cases WHERE id = ?", (body.case_id,))
            db.x(
                "INSERT INTO notifications (id, user_id, text, read, created_at) VALUES (?, ?, ?, 0, ?)",
                (db.uid("ntf"), case["supervisorId"], "A progress report is awaiting your evaluation", now),
            )
        return _report(existing["id"])

    report_id = db.uid("rep")
    submitted_at = now if body.status == "Awaiting Supervisor Evaluation" else None
    db.x(
        "INSERT INTO reports (id, case_id, summary, goals_addressed, recommendations, observations, domains, "
        "status, submitted_at, evaluation, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)",
        (report_id, body.case_id, body.summary, body.goals_addressed, body.recommendations, body.observations,
         db.json_dumps(body.domains), body.status, submitted_at, now, now),
    )
    return _report(report_id)


@router.post("/{report_id}/evaluate")
def evaluate_report(report_id: str, body: EvaluateIn, user: dict = Depends(get_current_user)):
    report = _report(report_id)
    case = db.q("SELECT * FROM cases WHERE id = ?", (report["caseId"],))
    if user["role"] == "ADMIN":
        pass
    elif user["role"] != "SUPERVISOR" or case is None or case["supervisorId"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only the assigned supervisor (or admin) can evaluate this report")
    if report["status"] != "Awaiting Supervisor Evaluation":
        raise HTTPException(status_code=409, detail="Only submitted reports can be evaluated")

    ev = body.evaluation
    now = db.now_ms()
    evaluation = {
        "feedback": ev.feedback,
        "rating": ev.rating,
        "outcome": ev.outcome,
        "evaluatedAt": now,
        "evaluatedBy": user["id"],
    }
    db.x("UPDATE reports SET status = 'Evaluated', evaluation = ?, updated_at = ? WHERE id = ?",
         (db.json_dumps(evaluation), now, report_id))

    if ev.outcome == "Close Case":
        new_status = "Closed"
    elif ev.outcome == "Discontinue Case":
        new_status = "Discontinued"
    else:
        new_status = "Active"
    closure = {
        "decision": ev.outcome,
        "reason": body.closure_reason,
        "rating": ev.rating,
        "closedAt": now,
        "closedBy": user["id"],
    }
    db.x("UPDATE cases SET status = ?, closure = ? WHERE id = ?", (new_status, db.json_dumps(closure), report["caseId"]))

    db.x(
        "INSERT INTO case_events (id, case_id, actor_id, event_type, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (db.uid("evt"), report["caseId"], user["id"], "Report evaluated",
         f"Evaluation complete: {ev.outcome}", now),
    )
    db.x(
        "INSERT INTO notifications (id, user_id, text, read, created_at) VALUES (?, ?, ?, 0, ?)",
        (db.uid("ntf"), case["therapistId"], f"Your report was evaluated: {ev.outcome}", now),
    )
    return _report(report_id)
