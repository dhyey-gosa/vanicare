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
    return {
        "currentUser": {k: v for k, v in user.items() if k != "passwordHash"},
        "users": _public_users(),
        "patients": db.qa("SELECT * FROM patients" + _ORDER),
        "cases": db.qa("SELECT * FROM cases" + _ORDER),
        "plans": db.qa("SELECT * FROM plans" + _ORDER),
        "sessions": db.qa("SELECT * FROM sessions" + _ORDER),
        "reports": db.qa("SELECT * FROM reports" + _ORDER),
        "records": db.qa("SELECT * FROM records"),
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
