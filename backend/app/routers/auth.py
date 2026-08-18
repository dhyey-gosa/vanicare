"""Register / login / logout / me."""
from fastapi import APIRouter, Depends, HTTPException

from .. import db, security
from ..deps import get_current_user
from ..schemas import LoginIn, RegisterIn, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _public_user(user: dict) -> dict:
    return {k: v for k, v in user.items() if k != "passwordHash"}


def _issue(user: dict) -> dict:
    token = security.new_token()
    db.x(
        "INSERT INTO sessions_tokens (token, user_id, created_at) VALUES (?, ?, ?)",
        (token, user["id"], db.now_ms()),
    )
    return {"ok": True, "user": _public_user(user), "token": token}


@router.post("/register")
def register(body: RegisterIn):
    email = body.email.strip().lower()
    existing = db.q("SELECT id FROM users WHERE lower(email) = ?", (email,))
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user_id = db.uid("usr")
    db.x(
        "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, body.name.strip(), email, security.hash_password(body.password), body.role, db.now_ms()),
    )
    if body.role == "THERAPIST":
        db.ensure_record(user_id)
    user = db.q("SELECT * FROM users WHERE id = ?", (user_id,))
    return _issue(user)


@router.post("/login")
def login(body: LoginIn):
    email = body.email.strip().lower()
    user = db.q("SELECT * FROM users WHERE lower(email) = ?", (email,))
    if user is None or not security.verify_password(body.password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return _issue(user)


@router.post("/logout")
def logout(user: dict = Depends(get_current_user)):
    auth = user  # token row handled in main route; simple no-op delete below
    db.x("DELETE FROM sessions_tokens WHERE user_id = ?", (auth["id"],))
    return {"ok": True}


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return _public_user(user)


@router.get("/users", response_model=list[UserOut])
def list_users():
    return db.qa("SELECT id, name, email, role FROM users ORDER BY name")
