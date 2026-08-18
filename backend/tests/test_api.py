"""State machine + contract tests against a live in-process server.

Run:  C:\\Python314\\python.exe -m pytest tests -q
"""
import os
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

os.environ["VANICARE_DB"] = str(BACKEND / "test_vanicare.db")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

DEMO = "vanicare123"


@pytest.fixture(scope="module")
def client():
    """Enter the app context so the lifespan (schema init + seed) runs,
    exactly like uvicorn does in production."""
    db_path = Path(os.environ["VANICARE_DB"])
    if db_path.exists():
        db_path.unlink()
    with TestClient(app) as c:
        yield c
    if db_path.exists():
        db_path.unlink()


def auth(client: TestClient, email: str) -> dict:
    r = client.post("/api/auth/login", json={"email": email, "password": DEMO})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def test_health(client):
    assert client.get("/api/health").status_code == 200


def test_login_bad_password(client):
    r = client.post("/api/auth/login", json={"email": "admin@vanicare.in", "password": "wrong"})
    assert r.status_code == 401


def test_bootstrap_shapes(client):
    h = auth(client, "admin@vanicare.in")
    r = client.get("/api/bootstrap", headers=h)
    assert r.status_code == 200
    body = r.json()
    for key in ("users", "patients", "cases", "plans", "sessions", "reports", "records", "requirement"):
        assert key in body
    assert any(u["email"] == "riya@vanicare.in" for u in body["users"])
    aarav = next(c for c in body["cases"] if c["reference"] == "SLP-2026-001")
    assert aarav["status"] == "Active"
    assert aarav["therapistId"] and aarav["supervisorId"]
    plan = next(p for p in body["plans"] if p["caseId"] == aarav["id"])
    assert plan["status"] == "Approved"
    sessions = [s for s in body["sessions"] if s["caseId"] == aarav["id"]]
    assert len(sessions) == 10
    report = next(rp for rp in body["reports"] if rp["caseId"] == aarav["id"])
    assert report["status"] == "Awaiting Supervisor Evaluation"
    # every JSON blob round-trips
    assert isinstance(plan["longTermGoals"], list)
    assert isinstance(sessions[0]["goalScores"], dict)
    assert isinstance(report["domains"], dict)


def test_register_duplicate_email(client):
    h = auth(client, "admin@vanicare.in")
    r = client.post("/api/auth/register", json={
        "name": "Dup User", "email": "ADMIN@vanicare.in", "password": "secret1", "role": "THERAPIST",
    })
    assert r.status_code == 400


def test_case_lifecycle(client):
    admin = auth(client, "admin@vanicare.in")
    r = client.post("/api/patients", headers=admin, json={
        "fullName": "Test Child", "age": "6", "gender": "Male", "status": "Active",
    })
    assert r.status_code == 200
    patient_id = r.json()["id"]

    r = client.post("/api/cases", headers=admin, json={
        "patientId": patient_id, "priority": "High", "caseType": "Test",
        "referralReason": "Evaluation", "primaryDiagnosis": "Test",
    })
    assert r.status_code == 200
    case = r.json()
    assert case["status"] == "Unallocated"
    assert case["therapistId"] is None
    assert case["reference"].startswith("CS-")

    # allocate: therapist role checks
    r = client.post(f"/api/cases/{case['id']}/allocate", headers=admin,
                    json={"therapistId": "usr_admin", "supervisorId": "usr_ananya"})
    assert r.status_code == 400
    r = client.post(f"/api/cases/{case['id']}/allocate", headers=admin,
                    json={"therapistId": "usr_riya", "supervisorId": "usr_ananya"})
    assert r.status_code == 200
    assert r.json()["status"] == "Active"

    # double allocation -> 409
    r = client.post(f"/api/cases/{case['id']}/allocate", headers=admin,
                    json={"therapistId": "usr_kabir", "supervisorId": "usr_sen"})
    assert r.status_code == 409

    # therapist saves plan -> submits
    riya = auth(client, "riya@vanicare.in")
    r = client.put("/api/plans", headers=riya, json={
        "caseId": case["id"], "longTermGoals": ["LTG"], "shortTermGoals": ["STO"],
        "status": "Pending Supervisor Review", "totalSessions": 4,
    })
    assert r.status_code == 200
    plan = r.json()
    assert plan["status"] == "Pending Supervisor Review"
    assert plan["submittedAt"] is not None

    # wrong supervisor cannot review
    sen = auth(client, "sen@vanicare.in")
    r = client.post(f"/api/plans/{plan['id']}/review", headers=sen, json={"approve": True})
    assert r.status_code == 403

    # right supervisor approves
    ananya = auth(client, "ananya@vanicare.in")
    r = client.post(f"/api/plans/{plan['id']}/review", headers=ananya, json={"approve": True})
    assert r.status_code == 200
    assert r.json()["status"] == "Approved"
    assert r.json()["reviewedAt"] is not None

    # re-review -> 409
    r = client.post(f"/api/plans/{plan['id']}/review", headers=ananya, json={"approve": False, "feedback": "x"})
    assert r.status_code == 409

    # therapist documents a session
    r = client.put("/api/sessions", headers=riya, json={
        "caseId": case["id"], "number": 1, "date": "2026-08-01", "status": "Completed",
        "goalScores": {"STO": 3}, "patientResponse": "Good",
    })
    assert r.status_code == 200
    assert r.json()["goalScores"]["STO"] == 3

    # report submit -> evaluate as Close Case
    r = client.put("/api/reports", headers=riya, json={
        "caseId": case["id"], "summary": "S", "goalsAddressed": "G", "recommendations": "R",
        "observations": "O", "domains": {}, "status": "Awaiting Supervisor Evaluation",
    })
    assert r.status_code == 200
    report = r.json()
    assert report["status"] == "Awaiting Supervisor Evaluation"

    r = client.post(f"/api/reports/{report['id']}/evaluate", headers=ananya, json={
        "evaluation": {"feedback": "Well done", "rating": 4, "outcome": "Close Case"},
        "closureReason": "Goals met",
    })
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "Evaluated"
    assert body["evaluation"]["outcome"] == "Close Case"
    assert body["evaluation"]["evaluatedBy"] == "usr_ananya"

    closed = client.get(f"/api/cases/{case['id']}", headers=admin).json()
    assert closed["status"] == "Closed"
    assert closed["closure"]["decision"] == "Close Case"
    assert closed["closure"]["rating"] == 4


def test_plan_changes_requested_flow(client):
    admin = auth(client, "admin@vanicare.in")
    ananya = auth(client, "ananya@vanicare.in")
    riya = auth(client, "riya@vanicare.in")

    r = client.post("/api/patients", headers=admin, json={"fullName": "Flow Child"})
    pid = r.json()["id"]
    r = client.post("/api/cases", headers=admin, json={"patientId": pid})
    case = r.json()
    client.post(f"/api/cases/{case['id']}/allocate", headers=admin,
                json={"therapistId": "usr_riya", "supervisorId": "usr_ananya"})

    r = client.put("/api/plans", headers=riya, json={"caseId": case["id"], "shortTermGoals": ["A"],
                                                     "status": "Pending Supervisor Review"})
    plan = r.json()
    r = client.post(f"/api/plans/{plan['id']}/review", headers=ananya,
                    json={"approve": False, "feedback": "Add measurable criteria"})
    assert r.status_code == 200
    assert r.json()["status"] == "Changes Requested"
    assert r.json()["feedback"] == "Add measurable criteria"

    # resubmission clears feedback and re-enters review
    r = client.put("/api/plans", headers=riya, json={"id": plan["id"], "caseId": case["id"],
                                                     "shortTermGoals": ["A"], "status": "Pending Supervisor Review"})
    assert r.json()["status"] == "Pending Supervisor Review"
    assert r.json()["feedback"] == ""


def test_records_and_requirement(client):
    admin = auth(client, "admin@vanicare.in")
    riya = auth(client, "riya@vanicare.in")

    r = client.put("/api/records/usr_riya", headers=riya, json={"directHours": 25, "indirectHours": 20})
    assert r.status_code == 200
    rec = r.json()
    assert rec["directHours"] == 25
    assert rec["indirectHours"] == 20

    r = client.put("/api/records/usr_riya/competency", headers=riya,
                   json={"area": "Session Handling", "status": "Competent"})
    assert r.json()["competencies"]["Session Handling"] == "Competent"

    r = client.get("/api/requirements", headers=admin)
    assert r.json()["requiredDirect"] == 40

    r = client.put("/api/requirements", headers=admin, json={
        "requiredDirect": 50, "requiredIndirect": 50, "requiredDirectPercent": 30})
    assert r.status_code == 200
    assert r.json()["requiredDirect"] == 50


def test_events_and_notifications(client):
    admin = auth(client, "admin@vanicare.in")
    r = client.get("/api/cases/cas_aarav/events", headers=admin)
    assert r.status_code == 200
    types = [e["eventType"] for e in r.json()]
    assert "Case allocated" in types and "Plan approved" in types and "Report submitted" in types

    r = client.get("/api/notifications", headers=admin)
    assert any(n["text"].startswith("Case CS-2026-006") for n in r.json())
    r = client.post("/api/notifications/read-all", headers=admin)
    assert r.status_code == 200
