"""Locutus SLP API — FastAPI entrypoint.

Boot sequence: init schema -> seed demo world (once) -> serve.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import db, seed
from .routers import auth, bootstrap, cases, patients, plans, records, reports, sessions


@asynccontextmanager
async def lifespan(_app: FastAPI):
    db.init_db()
    if seed.seed_if_empty():
        print("[locutus-slp] Seeded demo world (users: admin@locutus.in / riya@locutus.in / "
              "kabir@locutus.in / ananya@locutus.in / sen@locutus.in, password: locutus123)")
    yield


app = FastAPI(
    title="Locutus SLP API",
    version="1.0.0",
    description="Digital clinical management and supervision system for speech-language therapy (SIH PS-SW-008).",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(bootstrap.router)
app.include_router(patients.router)
app.include_router(cases.router)
app.include_router(plans.router)
app.include_router(sessions.router)
app.include_router(reports.router)
app.include_router(records.router)


@app.get("/api/health")
def health():
    return {"ok": True, "service": "locutus-slp", "db": db.DB_PATH}
