# Locutus SLP — Digital Clinical Management & Supervision for Speech-Language Therapy

Backend for **PS-SW-008** (SIH 2026). FastAPI + SQLite, zero cost, offline-capable.
The API speaks the exact camelCase contract defined by the frontend
(`Speech Language Therapy NEW/src/types/index.ts`).

## Run

```bash
cd vanicare/backend
C:\Python314\python.exe -m pip install -r requirements.txt
C:\Python314\python.exe run.py            # seeds on first run, serves on http://127.0.0.1:8000
```

| Option      | Meaning                                   |
|-------------|-------------------------------------------|
| `--port`    | Port (default 8000)                       |
| `--host`    | Bind host (default 127.0.0.1)             |
| `--reset`   | Delete DB and re-seed the demo world      |
| `--reload`  | uvicorn auto-reload for development       |

Interactive docs: http://127.0.0.1:8000/docs

## Demo accounts (password `locutus123` for all)

| Email             | Role       | Demo role in the story                 |
|-------------------|------------|----------------------------------------|
| admin@locutus.in | Admin      | Dr. Meera Kapoor                       |
| riya@locutus.in  | Therapist  | Riya Mehta (Aarav's therapist)         |
| kabir@locutus.in | Therapist  | Kabir Verma (workload context)         |
| ananya@locutus.in| Supervisor | Dr. Ananya Rao (Aarav's supervisor)    |
| sen@locutus.in   | Supervisor | Dr. Arjun Sen (workload context)       |

## Demo world (seeded once, idempotent)

- **SLP-2026-001 — Aarav Sharma**: approved plan, 10 SOAP sessions, report
  submitted and **awaiting supervisor evaluation** (the live finale of the demo).
- CS-2026-006 (Rahul Menon): unallocated — the admin allocation queue.
- CS-2026-005 (Kavya Reddy): plan pending supervisor review — the review queue.
- CS-2026-007 (Rohan Pillai): closed case with evaluated report — history.
- Case event timeline, notifications, clinical hours + competency records.

## Architecture

```
app/
  main.py      FastAPI app, CORS, lifespan (init + seed)
  db.py        sqlite3 data layer, snake_case columns -> camelCase JSON
  security.py  PBKDF2-HMAC-SHA256 password hashing (stdlib only)
  schemas.py   Pydantic models (camelCase aliases)
  deps.py      Bearer token auth, role guards
  seed.py      demo world (story-accurate)
  routers/     auth, bootstrap, patients, cases, plans, sessions, reports, records
tests/
  test_api.py  state-machine + contract tests (pytest)
```

## State machine (server-enforced, 409 on violation)

```
Case:   Unallocated --allocate--> Active
        Active --evaluate(Close Case)--> Closed
        Active --evaluate(Discontinue)--> Discontinued
Plan:   Draft / Changes Requested --submit--> Pending Supervisor Review
        Pending Supervisor Review --approve--> Approved
        Pending Supervisor Review --reject-->  Changes Requested
Report: Draft --submit--> Awaiting Supervisor Evaluation
        Awaiting Supervisor Evaluation --evaluate--> Evaluated  (fires case outcome)
```

## Key endpoints

| Method | Path                              | Who                        |
|--------|-----------------------------------|----------------------------|
| POST   | `/api/auth/register`              | anyone                     |
| POST   | `/api/auth/login`                 | anyone                     |
| GET    | `/api/bootstrap`                  | any authenticated user    |
| GET    | `/api/users`                      | any authenticated user    |
| GET/POST | `/api/patients`                 | admin (POST)               |
| GET/POST | `/api/cases`                    | admin (POST)               |
| POST   | `/api/cases/{id}/allocate`        | admin                      |
| GET    | `/api/cases/{id}/events`          | any authenticated user    |
| PUT    | `/api/plans`                      | assigned therapist / admin |
| POST   | `/api/plans/{id}/review`          | assigned supervisor / admin|
| PUT    | `/api/sessions`                   | assigned therapist / admin |
| PUT    | `/api/reports`                    | assigned therapist / admin |
| POST   | `/api/reports/{id}/evaluate`      | assigned supervisor / admin|
| PUT    | `/api/records/{tid}`              | self / supervisor / admin  |
| PUT    | `/api/records/{tid}/competency`   | self / supervisor / admin  |
| GET/PUT| `/api/requirements`               | admin (PUT)                |
| GET    | `/api/notifications`              | own only                   |

## Tests

```bash
C:\Python314\python.exe -m pytest tests -q
```

## Frontend wiring

The frontend in `Speech Language Therapy NEW/` is fully client-side; the
`AppContext` state layer is replaced by calls to this API (see
`src/api/client.ts` + `src/contexts/AppContext.tsx`). CORS is open for local
development; lock it to the deployed origin in production.
