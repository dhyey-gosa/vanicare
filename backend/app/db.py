"""Dual-mode data layer: SQLite (local/offline demo) or PostgreSQL (hosted).

Mode is selected once at import:
- no  DATABASE_URL env -> SQLite file (LOCUTUS_DB or ./locutus.db), unchanged offline behaviour
- set DATABASE_URL env -> PostgreSQL via psycopg (Render free tier etc.)

The contract is the frontend's TypeScript types in
`Speech Language Therapy NEW/src/types/index.ts`. All JSON payloads use
camelCase keys; DB columns are snake_case.
"""
import json
import os
import re
from contextlib import contextmanager

PG = bool(os.environ.get("DATABASE_URL"))

if PG:
    import psycopg
    from psycopg.rows import dict_row

    _PARAM = "%s"
else:
    import sqlite3

    _PARAM = "?"

DB_PATH = os.environ.get("LOCUTUS_DB", os.path.join(os.path.dirname(os.path.dirname(__file__)), "locutus.db"))

_SNAKE = re.compile(r"_([a-z0-9])")


def to_camel(name: str) -> str:
    return _SNAKE.sub(lambda m: m.group(1).upper(), name)


def _sql(sql: str) -> str:
    """Translate SQLite placeholder style to the active driver's."""
    return sql.replace("?", _PARAM) if PG else sql


def _row_to_dict(row) -> dict:
    out = {}
    for key in row.keys():
        value = row[key]
        out[to_camel(key)] = value
    for field in ("closure", "goalScores", "domains", "evaluation", "competencies", "longTermGoals", "shortTermGoals"):
        if field in out and isinstance(out[field], str):
            out[field] = json.loads(out[field])
    return out


if PG:

    class _PsycopgConn:
        """psycopg3 wrapper that translates ? placeholders -> %s on every execute,
        so raw SQL (seed.py etc.) works identically in both DB modes."""

        def __init__(self, conn):
            self._conn = conn

        def __enter__(self):
            self._conn.__enter__()
            return self

        def __exit__(self, *args):
            return self._conn.__exit__(*args)

        def execute(self, sql, params=None):
            if params is not None:
                sql = _sql(sql)
            return self._conn.execute(sql, params)

        def __getattr__(self, name):
            return getattr(self._conn, name)

    @contextmanager
    def get_conn():
        conn = psycopg.connect(os.environ["DATABASE_URL"], row_factory=dict_row)
        try:
            yield _PsycopgConn(conn)
            conn.commit()
        finally:
            conn.close()


else:

    @contextmanager
    def get_conn():
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()


def q(sql: str, params: tuple = ()) -> dict | None:
    with get_conn() as conn:
        row = conn.execute(_sql(sql), params).fetchone()
        return _row_to_dict(row) if row else None


def qa(sql: str, params: tuple = ()) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(_sql(sql), params).fetchall()
        return [_row_to_dict(r) for r in rows]


def qv(sql: str, params: tuple = ()):
    with get_conn() as conn:
        row = conn.execute(_sql(sql), params).fetchone()
        return (row["count"] if isinstance(row, dict) else row[0]) if row else None


def x(sql: str, params: tuple = ()) -> None:
    with get_conn() as conn:
        conn.execute(_sql(sql), params)


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN','THERAPIST','SUPERVISOR')),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  dob TEXT,
  age TEXT,
  gender TEXT,
  contact_number TEXT,
  guardian_name TEXT,
  referral_source TEXT,
  diagnosis TEXT,
  status TEXT NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Active','On Hold','Completed')),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  priority TEXT NOT NULL CHECK (priority IN ('High','Medium','Low')),
  status TEXT NOT NULL DEFAULT 'Unallocated'
    CHECK (status IN ('Unallocated','Active','Closed','Discontinued')),
  case_type TEXT,
  referral_reason TEXT,
  onset_date TEXT,
  primary_diagnosis TEXT,
  secondary_diagnosis TEXT,
  severity TEXT,
  notes TEXT,
  therapist_id TEXT REFERENCES users(id),
  supervisor_id TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  closure TEXT
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL UNIQUE REFERENCES cases(id),
  long_term_goals TEXT NOT NULL DEFAULT '[]',
  short_term_goals TEXT NOT NULL DEFAULT '[]',
  activities TEXT NOT NULL DEFAULT '',
  baseline_summary TEXT NOT NULL DEFAULT '',
  frequency TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  total_sessions INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft','Pending Supervisor Review','Approved','Changes Requested')),
  feedback TEXT NOT NULL DEFAULT '',
  submitted_at INTEGER,
  reviewed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id),
  number INTEGER NOT NULL,
  date TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  goals_addressed TEXT NOT NULL DEFAULT '',
  activities TEXT NOT NULL DEFAULT '',
  patient_response TEXT NOT NULL DEFAULT '',
  progress_observed TEXT NOT NULL DEFAULT '',
  challenges TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  next_session_plan TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Scheduled'
    CHECK (status IN ('Scheduled','Completed','Missed','Cancelled')),
  goal_scores TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  UNIQUE (case_id, number)
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id),
  summary TEXT NOT NULL DEFAULT '',
  goals_addressed TEXT NOT NULL DEFAULT '',
  recommendations TEXT NOT NULL DEFAULT '',
  observations TEXT NOT NULL DEFAULT '',
  domains TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft','Awaiting Supervisor Evaluation','Evaluated')),
  submitted_at INTEGER,
  evaluation TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS records (
  therapist_id TEXT PRIMARY KEY REFERENCES users(id),
  direct_hours REAL NOT NULL DEFAULT 0,
  indirect_hours REAL NOT NULL DEFAULT 0,
  competencies TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS requirement (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  required_direct REAL NOT NULL DEFAULT 40,
  required_indirect REAL NOT NULL DEFAULT 40,
  required_direct_percent REAL NOT NULL DEFAULT 25
);

CREATE TABLE IF NOT EXISTS case_events (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id),
  actor_id TEXT REFERENCES users(id),
  event_type TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL
);
"""


def init_db() -> None:
    with get_conn() as conn:
        if PG:
            # PG: drop leftovers from failed attempts, then rebuild with BIGINT
            # timestamps (epoch-ms overflows 32-bit INTEGER).
            tables = re.findall(r"CREATE TABLE IF NOT EXISTS (\w+)", SCHEMA)
            for t in tables:
                conn.execute(f'DROP TABLE IF EXISTS "{t}" CASCADE', None)
            conn.execute(_sql(SCHEMA).replace("INTEGER", "BIGINT"))
        else:
            conn.executescript(SCHEMA)
        row = conn.execute(_sql("SELECT COUNT(*) FROM requirement")).fetchone()
        count = row["count"] if isinstance(row, dict) else row[0]
        if count == 0:
            conn.execute(
                _sql(
                    "INSERT INTO requirement (id, required_direct, required_indirect, required_direct_percent) VALUES (1, 40, 40, 25)"
                )
            )


def ensure_record(therapist_id: str) -> None:
    """A record row must exist for every therapist (frontend assumes it)."""
    if PG:
        sql = (
            "INSERT INTO records (therapist_id, direct_hours, indirect_hours, competencies) VALUES (%s, 0, 0, %s) "
            "ON CONFLICT (therapist_id) DO NOTHING"
        )
    else:
        sql = "INSERT OR IGNORE INTO records (therapist_id, direct_hours, indirect_hours, competencies) VALUES (?, 0, 0, ?)"
    with get_conn() as conn:
        conn.execute(sql, (therapist_id, json.dumps({})))


def now_ms() -> int:
    import time

    return int(time.time() * 1000)


def uid(prefix: str) -> str:
    import secrets

    return f"{prefix}_{secrets.token_hex(4)}"


def json_dumps(obj) -> str:
    return json.dumps(obj)
