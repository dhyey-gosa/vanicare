"""Pydantic models. Field names are the DB snake_case; the API speaks the
frontend's camelCase contract via aliases. populate_by_name lets us accept
either casing on input."""
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Role = Literal["ADMIN", "THERAPIST", "SUPERVISOR"]
PatientStatus = Literal["Active", "On Hold", "Completed"]
CaseStatus = Literal["Unallocated", "Active", "Closed", "Discontinued"]
Priority = Literal["High", "Medium", "Low"]
PlanStatus = Literal["Draft", "Pending Supervisor Review", "Approved", "Changes Requested"]
SessionStatus = Literal["Scheduled", "Completed", "Missed", "Cancelled"]
ReportStatus = Literal["Draft", "Awaiting Supervisor Evaluation", "Evaluated"]
CompetencyStatus = Literal["Not Started", "In Progress", "Competent"]
Outcome = Literal["Continue Therapy", "Close Case", "Discontinue Case"]


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")


class UserOut(CamelModel):
    id: str
    name: str
    email: str
    role: Role


class RegisterIn(CamelModel):
    name: str = Field(min_length=2, max_length=120)
    email: str
    password: str = Field(min_length=6)
    role: Role


class LoginIn(CamelModel):
    email: str
    password: str


class PatientIn(CamelModel):
    full_name: str = Field(alias="fullName", min_length=1)
    dob: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    contact_number: Optional[str] = None
    guardian_name: Optional[str] = None
    referral_source: Optional[str] = None
    diagnosis: Optional[str] = None
    status: PatientStatus = "Active"


class Closure(CamelModel):
    decision: str
    reason: str
    rating: float
    closed_at: int = Field(alias="closedAt")
    closed_by: str = Field(alias="closedBy")


class CaseIn(CamelModel):
    patient_id: str = Field(alias="patientId")
    priority: Priority = "Medium"
    case_type: Optional[str] = None
    referral_reason: Optional[str] = None
    onset_date: Optional[str] = None
    primary_diagnosis: Optional[str] = None
    secondary_diagnosis: Optional[str] = None
    severity: Optional[str] = None
    notes: Optional[str] = None


class AllocateIn(CamelModel):
    therapist_id: str = Field(alias="therapistId")
    supervisor_id: str = Field(alias="supervisorId")


class PlanIn(CamelModel):
    id: Optional[str] = None
    case_id: str = Field(alias="caseId")
    long_term_goals: list[str] = Field(default_factory=list, alias="longTermGoals")
    short_term_goals: list[str] = Field(default_factory=list, alias="shortTermGoals")
    activities: str = ""
    baseline_summary: str = Field(default="", alias="baselineSummary")
    frequency: str = ""
    duration: str = ""
    total_sessions: int = Field(default=0, alias="totalSessions")
    status: PlanStatus = "Draft"


class ReviewIn(CamelModel):
    approve: bool
    feedback: str = ""


class SessionIn(CamelModel):
    id: Optional[str] = None
    case_id: str = Field(alias="caseId")
    number: int
    date: str = ""
    duration: str = ""
    goals_addressed: str = Field(default="", alias="goalsAddressed")
    activities: str = ""
    patient_response: str = Field(default="", alias="patientResponse")
    progress_observed: str = Field(default="", alias="progressObserved")
    challenges: str = ""
    notes: str = ""
    next_session_plan: str = Field(default="", alias="nextSessionPlan")
    status: SessionStatus = "Completed"
    goal_scores: dict[str, float] = Field(default_factory=dict, alias="goalScores")


class ReportIn(CamelModel):
    id: Optional[str] = None
    case_id: str = Field(alias="caseId")
    summary: str = ""
    goals_addressed: str = Field(default="", alias="goalsAddressed")
    recommendations: str = ""
    observations: str = ""
    domains: dict[str, dict] = Field(default_factory=dict)
    status: ReportStatus = "Draft"


class EvaluationIn(CamelModel):
    feedback: str
    rating: float = Field(ge=1, le=5)
    outcome: Outcome


class EvaluateIn(CamelModel):
    evaluation: EvaluationIn
    closure_reason: str = Field(default="", alias="closureReason")


class RecordPatch(CamelModel):
    direct_hours: Optional[float] = Field(default=None, alias="directHours")
    indirect_hours: Optional[float] = Field(default=None, alias="indirectHours")


class CompetencyIn(CamelModel):
    area: str
    status: CompetencyStatus


class RequirementIn(CamelModel):
    required_direct: float = Field(alias="requiredDirect")
    required_indirect: float = Field(alias="requiredIndirect")
    required_direct_percent: float = Field(alias="requiredDirectPercent")
