"""GET /api/bootstrap — one call loads the entire AppContext state."""
from fastapi import APIRouter, Depends

from .. import db
from ..deps import get_current_user

router = APIRouter(prefix="/api", tags=["bootstrap"])

_ORDER = " ORDER BY created_at ASC"


def _public_users() -> list[dict]:
    users = db.qa("SELECT * FROM users")
    for u in users:
        u.pop("passwordHash", None)
    return users


def _filtered_bootstrap(user: dict) -> dict:
    """Return only the data the logged-in user is authorised to see."""
    role = user["role"]

    if role == "ADMIN":
        cases = db.qa("SELECT * FROM cases" + _ORDER)
        patients = db.qa("SELECT * FROM patients" + _ORDER)
        plans = db.qa("SELECT * FROM plans" + _ORDER)
        sessions = db.qa("SELECT * FROM sessions" + _ORDER)
        reports = db.qa("SELECT * FROM reports" + _ORDER)
        records = db.qa("SELECT * FROM records")
    else:
        if role == "THERAPIST":
            cases = db.qa("SELECT * FROM cases WHERE therapist_id = ?" + _ORDER, (user["id"],))
        else:  # SUPERVISOR
            cases = db.qa("SELECT * FROM cases WHERE supervisor_id = ?" + _ORDER, (user["id"],))

        case_ids = [c["id"] for c in cases]
        patient_ids = list({c["patientId"] for c in cases if c.get("patientId")})

        if case_ids:
            ph = ",".join(["?"] * len(case_ids))
            plans = db.qa(f"SELECT * FROM plans WHERE case_id IN ({ph}) ORDER BY created_at", case_ids)
            sessions = db.qa(f"SELECT * FROM sessions WHERE case_id IN ({ph}) ORDER BY created_at", case_ids)
            reports = db.qa(f"SELECT * FROM reports WHERE case_id IN ({ph}) ORDER BY created_at", case_ids)
        else:
            plans, sessions, reports = [], [], []

        if patient_ids:
            pph = ",".join(["?"] * len(patient_ids))
            patients = db.qa(f"SELECT * FROM patients WHERE id IN ({pph}) ORDER BY created_at", patient_ids)
        else:
            patients = []

        records = db.qa("SELECT * FROM records WHERE therapist_id = ?", (user["id"],))

    return {
        "cases": cases,
        "patients": patients,
        "plans": plans,
        "sessions": sessions,
        "reports": reports,
        "records": records,
    }


@router.get("/public/status")
def public_status():
    """Unauthenticated: used by the auth page to show/hide the
    'no accounts exist yet' hint."""
    row = db.q("SELECT COUNT(*) AS n FROM users")
    return {"hasUsers": bool(row and row["n"] > 0)}


@router.get("/bootstrap")
def bootstrap(user: dict = Depends(get_current_user)):
    requirement = db.q("SELECT required_direct AS requiredDirect, required_indirect AS requiredIndirect, "
                       "required_direct_percent AS requiredDirectPercent FROM requirement WHERE id = 1")
    notifications = db.qa("SELECT * FROM notifications WHERE user_id = ? AND read = 0 ORDER BY created_at DESC",
                          (user["id"],))
    data = _filtered_bootstrap(user)
    return {
        "currentUser": {k: v for k, v in user.items() if k != "passwordHash"},
        "users": _public_users(),
        **data,
        "requirement": requirement,
        "notifications": notifications,
        "unread": len(notifications),
    }


@router.get("/notifications")
def list_notifications(user: dict = Depends(get_current_user)):
    return db.qa("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", (user["id"],))


@router.post("/notifications/read-all")
def read_all(user: dict = Depends(get_current_user)):
    db.x("UPDATE notifications SET read = 1 WHERE user_id = ?", (user["id"],))
    return {"ok": True}
