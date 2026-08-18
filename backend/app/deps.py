"""Auth dependency: resolves the Bearer token to a user."""
from fastapi import Depends, HTTPException, Request

from . import db


def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth.removeprefix("Bearer ").strip()
    row = db.q(
        "SELECT u.* FROM sessions_tokens t JOIN users u ON u.id = t.user_id WHERE t.token = ?",
        (token,),
    )
    if row is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return row


def require_roles(*roles: str):
    def checker(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Not allowed for this role")
        return user

    return checker
