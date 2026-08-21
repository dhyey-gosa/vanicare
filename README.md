# VaniCare

Speech-language therapy clinical management and supervision platform. Built for SIH Sprint 2026 (PS-SW-008).

## What it does

Handles the day-to-day workflow of an SLP clinic — patient intake, case allocation, therapy planning, session documentation, progress tracking, and supervisor oversight. Everything is role-based so therapists, supervisors, and administrators each see what they need.

**Core features:**

- Patient registration with medical history and referral details
- Case management with therapist + supervisor assignment
- Therapy plan creation with a submit-review-approve workflow
- SOAP session notes with goal scoring on a 1–5 clinical scale
- Progress reports auto-drafted from session data, reviewed by supervisors
- Case outcome decisions (continue, close, discontinue) with a full audit trail
- Hours and competency tracking against supervision requirements
- Analytics across the practice

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | FastAPI (Python) with raw SQL |
| Database | SQLite (local) / PostgreSQL (hosted) |
| Auth | JWT tokens, role-based access control |
| Hosting | Render free tier (auto-deploy from main) |

## Running locally

**Backend:**

```bash
cd backend
pip install -r requirements.txt
python run.py
```

Seeds demo data on first run. Starts on `http://localhost:8000`.

**Frontend:**

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Demo accounts

All accounts use password: `vanicare123`

| Role | Email |
|------|-------|
| Admin | admin@vanicare.in |
| Therapist | riya@vanicare.in |
| Therapist | kabir@vanicare.in |
| Supervisor | ananya@vanicare.in |
| Supervisor | sen@vanicare.in |

## Hosted

- https://vanicare-web.onrender.com
- https://vanicare-api.onrender.com

## Project structure

```
src/                    # React frontend
  pages/                # Route-level components (admin/, therapist/, supervisor/, shared/)
  components/           # Reusable UI and feature components
  contexts/             # AppContext (server-backed state)
  api/                  # API client
  types/                # TypeScript interfaces
backend/
  app/
    routers/            # FastAPI route handlers
    db.py               # Dual-mode data layer (SQLite/PostgreSQL)
    seed.py             # Demo data seeder
    deps.py             # Auth dependencies
    schemas.py          # Request/response models
  tests/                # pytest suite
```

## License

Built for SIH Sprint 2026.
