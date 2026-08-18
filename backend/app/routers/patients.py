"""Patients."""
from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..deps import get_current_user, require_roles
from ..schemas import PatientIn

router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.get("")
def list_patients():
    return db.qa("SELECT * FROM patients ORDER BY created_at")


@router.get("/{patient_id}")
def get_patient(patient_id: str):
    row = db.q("SELECT * FROM patients WHERE id = ?", (patient_id,))
    if row is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return row


@router.post("")
def create_patient(body: PatientIn, user: dict = Depends(require_roles("ADMIN"))):
    patient_id = db.uid("pat")
    db.x(
        "INSERT INTO patients (id, full_name, dob, age, gender, contact_number, guardian_name, "
        "referral_source, diagnosis, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (patient_id, body.full_name, body.dob, body.age, body.gender, body.contact_number,
         body.guardian_name, body.referral_source, body.diagnosis, body.status, db.now_ms()),
    )
    return db.q("SELECT * FROM patients WHERE id = ?", (patient_id,))
