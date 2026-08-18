# VaniCare

Digital clinical management and supervision system for speech-language therapy.
Built for SIH Sprint 2026 (Problem Statement PS-SW-008).

## Stack

- **Frontend** — React 18 + Vite + Tailwind (SPA, client-side routing)
- **Backend** — FastAPI (Python 3.13) + raw-SQL data layer
- **Database** — SQLite offline (zero-config local demo) or PostgreSQL when `DATABASE_URL` is set (hosted)
- **Auth** — token-based sessions (`vanicare_token` in localStorage), role-gated routes (ADMIN / THERAPIST / SUPERVISOR)

## Features

- Patient registration and case intake (priority, diagnosis, referral)
- Two-person allocation: every case gets a therapist + a supervisor
- Therapy planning with supervisor review loop (submit → approve / request changes → resubmit)
- SOAP session documentation with goal scoring on a 1–5 clinical scale
- Longitudinal progress charts and SLP outcome profile (radar)
- Auto-generated progress report draft from session data, with a clinician-verification safeguard
- Supervisor evaluation with case outcome state machine (Continue Therapy / Close Case / Discontinue Case)
- Case timeline (full audit trail) and per-user notifications
- Hours & competency tracking against SIH-style supervision requirements
- Analytics across the whole practice

## Run locally (offline, zero config)

Backend:

```
cd backend
pip install -r requirements.txt
python run.py          # seeds the demo world on first boot
```

Frontend:

```
npm install
npm run dev            # http://localhost:5173
```

## Demo accounts (fictional data, shared password `vanicare123`)

| Role       | Email               |
|------------|---------------------|
| Admin      | admin@vanicare.in   |
| Therapist  | riya@vanicare.in    |
| Therapist  | kabir@vanicare.in   |
| Supervisor | ananya@vanicare.in  |
| Supervisor | sen@vanicare.in     |

## Hosted (free tier)

- Web: https://vanicare-web.onrender.com
- API: https://vanicare-api.onrender.com

## Project layout

```
├── src/            # React frontend (repo root)
├── backend/        # FastAPI application
│   ├── app/        # db, seed, security, routers
│   └── tests/      # pytest suite (8 tests)
└── DEMO_SCRIPT.md  # 12-scene demo walkthrough
```