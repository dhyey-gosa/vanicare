export type Role = 'ADMIN' | 'THERAPIST' | 'SUPERVISOR';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}

export type PatientStatus = 'Active' | 'On Hold' | 'Completed';

export interface Patient {
  id: string;
  fullName: string;
  dob: string;
  age: string;
  gender: string;
  contactNumber: string;
  guardianName: string;
  referralSource: string;
  diagnosis: string;
  status: PatientStatus;
  createdAt: number;
}

export type Priority = 'High' | 'Medium' | 'Low';

export type CaseStatus = 'Unallocated' | 'Active' | 'Closed' | 'Discontinued';

export interface Case {
  id: string;
  reference: string;
  patientId: string;
  priority: Priority;
  status: CaseStatus;
  /* Case information */
  caseType: string;
  referralReason: string;
  onsetDate: string;
  /* Clinical diagnosis */
  primaryDiagnosis: string;
  secondaryDiagnosis: string;
  severity: string;
  /* Additional notes */
  notes: string;
  therapistId: string | null;
  supervisorId: string | null;
  createdAt: number;
  closure: CaseClosure | null;
}

export interface CaseClosure {
  decision: 'Closed' | 'Discontinued';
  reason: string;
  rating: number;
  closedAt: number;
  closedBy: string;
}

export type PlanStatus = 'Draft' | 'Pending Supervisor Review' | 'Approved' | 'Changes Requested';

export interface TherapyPlan {
  id: string;
  caseId: string;
  longTermGoals: string[];
  shortTermGoals: string[];
  activities: string;
  baselineSummary: string;
  frequency: string;
  duration: string;
  totalSessions: number;
  status: PlanStatus;
  feedback: string;
  submittedAt: number | null;
  reviewedAt: number | null;
}

export type SessionStatus = 'Scheduled' | 'Completed' | 'Missed' | 'Cancelled';

export interface TherapySession {
  id: string;
  caseId: string;
  number: number;
  date: string;
  duration: string;
  goalsAddressed: string;
  activities: string;
  patientResponse: string;
  progressObserved: string;
  challenges: string;
  notes: string;
  nextSessionPlan: string;
  status: SessionStatus;
  /* manually entered goal progress values, keyed by goal label, scale 1-5 */
  goalScores: Record<string, number>;
  createdAt: number;
}

export const SLP_DOMAINS = [
'Articulation & Phonology',
'Fluency & Stuttering',
'Receptive & Expressive Language',
'Voice & Resonance',
'Pragmatics & Social Communication'] as
const;

export type SlpDomain = (typeof SLP_DOMAINS)[number];

export interface DomainScore {
  applicable: boolean;
  baseline: number | null;
  current: number | null;
}

export type ReportStatus = 'Draft' | 'Awaiting Supervisor Evaluation' | 'Evaluated';

export interface ProgressReport {
  id: string;
  caseId: string;
  summary: string;
  goalsAddressed: string;
  recommendations: string;
  observations: string;
  domains: Record<string, DomainScore>;
  status: ReportStatus;
  submittedAt: number | null;
  evaluation: ReportEvaluation | null;
}

export interface ReportEvaluation {
  feedback: string;
  rating: number;
  outcome: 'Continue Therapy' | 'Close Case' | 'Discontinue Case';
  evaluatedAt: number;
  evaluatedBy: string;
}

export const COMPETENCY_AREAS = [
'Clinical Documentation',
'Therapy Planning',
'Session Handling',
'Patient Management',
'Progress Reporting'] as
const;

export type CompetencyStatus = 'Not Started' | 'In Progress' | 'Competent';

export interface TherapistRecord {
  therapistId: string;
  directHours: number;
  indirectHours: number;
  competencies: Record<string, CompetencyStatus>;
}

export interface HoursRequirement {
  requiredDirect: number;
  requiredIndirect: number;
  requiredDirectPercent: number;
}

export interface CaseEvent {
  id: string;
  caseId: string;
  actorId: string;
  eventType: string;
  detail: string;
  createdAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  text: string;
  read: boolean;
  createdAt: number;
}