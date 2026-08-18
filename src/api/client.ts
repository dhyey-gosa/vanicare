/**
 * Locutus SLP API client — the single bridge between the frontend and the backend.
 *
 * Base URL: VITE_API_URL env var, else http://127.0.0.1:8000 (local demo).
 * Auth: Bearer token persisted in localStorage under `locutus_token`.
 */
import type {
  Case,
  CaseEvent,
  CompetencyStatus,
  HoursRequirement,
  Notification,
  Patient,
  ProgressReport,
  ReportEvaluation,
  Role,
  TherapistRecord,
  TherapyPlan,
  TherapySession,
  User,
} from '../types';

export const API_BASE: string =
  (import.meta.env?.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8000';

const TOKEN_KEY = 'locutus_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  detail?: string;

  constructor(status: number, detail?: string) {
    super(detail ?? `Request failed (${status})`);
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    let detail: string | undefined;
    try {
      const data = await res.json();
      detail = typeof data.detail === 'string' ? data.detail : undefined;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: User;
}

export interface Bootstrap {
  currentUser: User;
  users: User[];
  patients: Patient[];
  cases: Case[];
  plans: TherapyPlan[];
  sessions: TherapySession[];
  reports: ProgressReport[];
  records: TherapistRecord[];
  requirement: HoursRequirement;
}

export const api = {
  publicStatus: () =>
    request<{ hasUsers: boolean }>('GET', '/api/public/status').then((r) => r.hasUsers),

  register: (input: Omit<User, 'id'>): Promise<AuthResult> =>
    request<{ ok: true; user: User; token: string }>('POST', '/api/auth/register', input).then(
      (r) => {
        setToken(r.token);
        return { ok: true, user: r.user };
      }
    ),

  login: (email: string, password: string): Promise<AuthResult> =>
    request<{ ok: true; user: User; token: string }>('POST', '/api/auth/login', { email, password }).then(
      (r) => {
        setToken(r.token);
        return { ok: true, user: r.user };
      }
    ),

  logout: () => request<{ ok: boolean }>('POST', '/api/auth/logout'),

  bootstrap: () => request<Bootstrap>('GET', '/api/bootstrap'),

  createPatient: (input: Omit<Patient, 'id' | 'createdAt'>) =>
    request<Patient>('POST', '/api/patients', input),

  createCase: (input: Omit<Case, 'id' | 'createdAt' | 'status' | 'therapistId' | 'supervisorId' | 'closure' | 'reference'>) =>
    request<Case>('POST', '/api/cases', input),

  allocateCase: (caseId: string, therapistId: string, supervisorId: string) =>
    request<Case>('POST', `/api/cases/${caseId}/allocate`, { therapistId, supervisorId }),

  savePlan: (input: Omit<TherapyPlan, 'id' | 'submittedAt' | 'reviewedAt'> & { id?: string }) =>
    request<TherapyPlan>('PUT', '/api/plans', input),

  reviewPlan: (planId: string, approve: boolean, feedback: string) =>
    request<TherapyPlan>('POST', `/api/plans/${planId}/review`, { approve, feedback }),

  saveSession: (input: Omit<TherapySession, 'id' | 'createdAt'> & { id?: string }) =>
    request<TherapySession>('PUT', '/api/sessions', input),

  saveReport: (input: Omit<ProgressReport, 'id' | 'submittedAt' | 'evaluation'> & { id?: string }) =>
    request<ProgressReport>('PUT', '/api/reports', input),

  evaluateReport: (
    reportId: string,
    evaluation: Omit<ReportEvaluation, 'evaluatedAt' | 'evaluatedBy'>,
    closureReason: string
  ) =>
    request<ProgressReport>('POST', `/api/reports/${reportId}/evaluate`, {
      evaluation,
      closureReason,
    }),

  fetchCases: () => request<Case[]>('GET', '/api/cases'),

  fetchEvents: (caseId: string) => request<CaseEvent[]>('GET', `/api/cases/${caseId}/events`),

  fetchNotifications: () => request<Notification[]>('GET', '/api/notifications'),

  updateRecord: (therapistId: string, patch: Partial<Omit<TherapistRecord, 'therapistId'>>) =>
    request<TherapistRecord>('PUT', `/api/records/${therapistId}`, patch),

  setCompetency: (therapistId: string, area: string, status: CompetencyStatus) =>
    request<TherapistRecord>('PUT', `/api/records/${therapistId}/competency`, { area, status }),

  setRequirement: (req: HoursRequirement) =>
    request<HoursRequirement>('PUT', '/api/requirements', req),

  readAllNotifications: () => request<{ ok: boolean }>('POST', '/api/notifications/read-all'),
};