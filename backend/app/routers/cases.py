"""Cases + allocation (the state machine's first gate).

State machine:
  Unallocated --allocate--> Active
  Active      --evaluate(Close Case)-->    Closed
  Active      --evaluate(Discontinue)-->   Discontinued
No other transitions are permitted. Violations return 409.
"""
import time

from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..deps import get_current_user, require_roles
from ..schemas import AllocateIn, CaseIn

router = APIRouter(prefix="/api/cases", tags=["cases"])


def _notify(user_id: str, text: str) -> None:
    db.x(
        "INSERT INTO notifications (id, user_id, text, read, created_at) VALUES (?, ?, ?, 0, ?)",
        (db.uid("ntf"), user_id, text, db.now_ms()),
    )


def _event(case_id: str, actor_id: str, event_type: str, detail: str) -> None:
    db.x(
        "INSERT INTO case_events (id, case_id, actor_id, event_type, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (db.uid("evt"), case_id, actor_id, event_type, detail, db.now_ms()),
    )


def _case(case_id: str) -> dict:
    row = db.q("SELECT * FROM cases WHERE id = ?", (case_id,))
    if row is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return row


@router.get("")
def list_cases(user: dict = Depends(get_current_user)):
    role, uid = user["role"], user["id"]
    if role == "ADMIN":
        return db.qa("SELECT * FROM cases ORDER BY created_at")
    if role == "THERAPIST":
        return db.qa("SELECT * FROM cases WHERE therapist_id = ? ORDER BY created_at", (uid,))
    return db.qa("SELECT * FROM cases WHERE supervisor_id = ? ORDER BY created_at", (uid,))


@router.get("/{case_id}")
def get_case(case_id: str, user: dict = Depends(get_current_user)):
    c = _case(case_id)
    role, uid = user["role"], user["id"]
    if role == "ADMIN":
        return c
    if role == "THERAPIST" and c.get("therapistId") != uid:
        raise HTTPException(status_code=403, detail="Not your case")
    if role == "SUPERVISOR" and c.get("supervisorId") != uid:
        raise HTTPException(status_code=403, detail="Not your supervised case")
    return c


@router.get("/{case_id}/events")
def case_events(case_id: str, user: dict = Depends(get_current_user)):
    c = _case(case_id)
    role, uid = user["role"], user["id"]
    if role == "ADMIN":
        pass
    elif role == "THERAPIST" and c.get("therapistId") != uid:
        raise HTTPException(status_code=403, detail="Not your case")
    elif role == "SUPERVISOR" and c.get("supervisorId") != uid:
        raise HTTPException(status_code=403, detail="Not your supervised case")
    return db.qa("SELECT * FROM case_events WHERE case_id = ? ORDER BY created_at", (case_id,))


@router.post("")
def create_case(body: CaseIn, user: dict = Depends(require_roles("ADMIN"))):
    case_id = db.uid("cas")
    reference = f"CS-{str(int(time.time() * 1000))[-5:]}"
    db.x(
        "INSERT INTO cases (id, reference, patient_id, priority, status, case_type, referral_reason, "
        "onset_date, primary_diagnosis, secondary_diagnosis, severity, notes, therapist_id, supervisor_id, "
        "created_at, closure) VALUES (?, ?, ?, ?, 'Unallocated', ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, NULL)",
        (case_id, reference, body.patient_id, body.priority, body.case_type, body.referral_reason,
         body.onset_date, body.primary_diagnosis, body.secondary_diagnosis, body.severity, body.notes, db.now_ms()),
    )
    _event(case_id, user["id"], "Case registered", f"Case {reference} opened")
    return db.q("SELECT * FROM cases WHERE id = ?", (case_id,))


@router.post("/{case_id}/allocate")
def allocate(case_id: str, body: AllocateIn, user: dict = Depends(require_roles("ADMIN"))):
    case = _case(case_id)
    if case["status"] != "Unallocated":
        raise HTTPException(status_code=409, detail="Only unallocated cases can be allocated")

    therapist = db.q("SELECT * FROM users WHERE id = ?", (body.therapist_id,))
    supervisor = db.q("SELECT * FROM users WHERE id = ?", (body.supervisor_id,))
    if therapist is None or supervisor is None:
        raise HTTPException(status_code=400, detail="Unknown therapist or supervisor")
    if therapist["role"] != "THERAPIST":
        raise HTTPException(status_code=400, detail="Allocation target is not a therapist")
    if supervisor["role"] != "SUPERVISOR":
        raise HTTPException(status_code=400, detail="Allocation target is not a supervisor")

    db.x(
        "UPDATE cases SET status = 'Active', therapist_id = ?, supervisor_id = ? WHERE id = ?",
        (body.therapist_id, body.supervisor_id, case_id),
    )
    patient = db.q("SELECT full_name FROM patients WHERE id = ?", (case["patientId"],))
    patient_name = patient["fullName"] if patient else "a patient"
    detail = f"Allocated to {therapist['name']} (therapist) and {supervisor['name']} (supervisor)"
    _event(case_id, user["id"], "Case allocated", detail)
    _notify(body.therapist_id, f"Case {case['reference']} ({patient_name}) has been allocated to you")
    _notify(body.supervisor_id, f"Case {case['reference']} ({patient_name}) has been assigned to your supervision")
    return db.q("SELECT * FROM cases WHERE id = ?", (case_id,))
