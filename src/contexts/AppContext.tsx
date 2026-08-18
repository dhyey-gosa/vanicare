/**
 * VaniCare AppContext — server-backed state layer.
 *
 * Same public API as the original local-state provider, but every mutation is
 * persisted to the VaniCare backend (FastAPI) via src/api/client.ts and state
 * is reconciled from server responses. Login/register/addCase are async;
 * fire-and-forget mutations reconcile optimistically and toast failures.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type {
  Case,
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
import { COMPETENCY_AREAS } from '../types';
import { api, ApiError } from '../api/client';

interface AppState {
  users: User[];
  currentUser: User | null;
  patients: Patient[];
  cases: Case[];
  plans: TherapyPlan[];
  sessions: TherapySession[];
  reports: ProgressReport[];
  records: TherapistRecord[];
  requirement: HoursRequirement;
  notifications: Notification[];
}

interface AppContextValue extends AppState {
  bootstrapping: boolean;
  hasAccounts: boolean;
  register: (input: Omit<User, 'id'>) => Promise<{ ok: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  addPatient: (input: Omit<Patient, 'id' | 'createdAt'>) => Patient;
  addCase: (input: Omit<Case, 'id' | 'createdAt' | 'status' | 'therapistId' | 'supervisorId' | 'closure' | 'reference'>) => Promise<Case>;
  allocateCase: (caseId: string, therapistId: string, supervisorId: string) => void;
  savePlan: (input: Omit<TherapyPlan, 'id' | 'submittedAt' | 'reviewedAt'> & { id?: string }) => TherapyPlan;
  reviewPlan: (planId: string, approve: boolean, feedback: string) => void;
  saveSession: (input: Omit<TherapySession, 'id' | 'createdAt'> & { id?: string }) => void;
  saveReport: (input: Omit<ProgressReport, 'id' | 'submittedAt' | 'evaluation'> & { id?: string }) => ProgressReport;
  evaluateReport: (reportId: string, evaluation: Omit<ReportEvaluation, 'evaluatedAt' | 'evaluatedBy'>, closureReason: string) => void;
  usersByRole: (role: Role) => User[];
  visibleCases: () => Case[];
  patientById: (id: string) => Patient | undefined;
  caseById: (id: string) => Case | undefined;
  planForCase: (caseId: string) => TherapyPlan | undefined;
  sessionsForCase: (caseId: string) => TherapySession[];
  reportsForCase: (caseId: string) => ProgressReport[];
  recordFor: (therapistId: string) => TherapistRecord;
  updateRecord: (therapistId: string, patch: Partial<Omit<TherapistRecord, 'therapistId'>>) => void;
  setCompetency: (therapistId: string, area: string, status: CompetencyStatus) => void;
  setRequirement: (req: HoursRequirement) => void;
  markAllNotificationsRead: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const emptyCompetencies = () =>
  COMPETENCY_AREAS.reduce<Record<string, CompetencyStatus>>((acc, area) => {
    acc[area] = 'Not Started';
    return acc;
  }, {});

const DEFAULT_REQUIREMENT: HoursRequirement = {
  requiredDirect: 40,
  requiredIndirect: 40,
  requiredDirectPercent: 25,
};

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx === -1) return [...list, item];
  const next = [...list];
  next[idx] = item;
  return next;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [plans, setPlans] = useState<TherapyPlan[]>([]);
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [records, setRecords] = useState<TherapistRecord[]>([]);
  const [requirement, setRequirementState] = useState<HoursRequirement>(DEFAULT_REQUIREMENT);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [hasAccounts, setHasAccounts] = useState(false);

  const applyBootstrap = useCallback((data: Awaited<ReturnType<typeof api.bootstrap>>) => {
    setUsers(data.users);
    setCurrentUser(data.currentUser);
    setPatients(data.patients);
    setCases(data.cases);
    setPlans(data.plans);
    setSessions(data.sessions);
    setReports(data.reports);
    setRecords(data.records);
    setRequirement(data.requirement);
  }, []);

  const clearState = useCallback(() => {
    setUsers([]);
    setCurrentUser(null);
    setPatients([]);
    setCases([]);
    setPlans([]);
    setSessions([]);
    setReports([]);
    setRecords([]);
    setRequirement(DEFAULT_REQUIREMENT);
    setNotifications([]);
  }, []);

  const load = useCallback(async (): Promise<boolean> => {
    try {
      const data = await api.bootstrap();
      applyBootstrap(data);
      api
        .fetchNotifications()
        .then(setNotifications)
        .catch(() => setNotifications([]));
      return true;
    } catch (err) {
      clearState();
      return false;
    }
  }, [applyBootstrap, clearState]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setHasAccounts(await api.publicStatus());
      } catch {
        /* backend offline — auth page still renders */
      }
      if (alive) setBootstrapping(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('vanicare_token');
    if (token) {
      load().finally(() => setBootstrapping(false));
    } else {
      setBootstrapping(false);
    }
  }, [load]);

  const register = useCallback(
    async (input: Omit<User, 'id'>): Promise<{ ok: boolean; error?: string }> => {
      try {
        const result = await api.register(input);
        if (!result.ok) return result;
        const ok = await load();
        if (!ok) return { ok: false, error: 'Account created but the server could not be loaded.' };
        setHasAccounts(true);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof ApiError ? err.detail : 'Could not reach the server.' };
      }
    },
    [load]
  );

  const login = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const result = await api.login(email, password);
        if (!result.ok) return result;
        await load();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof ApiError ? err.detail : 'Could not reach the server.' };
      }
    },
    [load]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('vanicare_token');
    api.logout().catch(() => undefined);
    clearState();
    setBootstrapping(false);
  }, [clearState]);

  const addPatient: AppContextValue['addPatient'] = useCallback((input) => {
    const optimistic: Patient = { ...input, id: `pat_${Date.now()}`, createdAt: Date.now() };
    api
      .createPatient(input)
      .then((patient) => setPatients((prev) => upsert(prev, patient)))
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.detail : 'Could not register the patient.');
        setPatients((prev) => prev.filter((p) => p.id !== optimistic.id));
      });
    return optimistic;
  }, []);

  const addCase: AppContextValue['addCase'] = useCallback(async (input) => {
    const created = await api.createCase(input);
    setCases((prev) => upsert(prev, created));
    return created;
  }, []);

  const allocateCase: AppContextValue['allocateCase'] = useCallback((caseId, therapistId, supervisorId) => {
    api
      .allocateCase(caseId, therapistId, supervisorId)
      .then((updated) => setCases((prev) => upsert(prev, updated)))
      .catch((err) => toast.error(err instanceof ApiError ? err.detail : 'Allocation failed.'));
  }, []);

  const savePlan: AppContextValue['savePlan'] = useCallback((input) => {
    const optimistic: TherapyPlan = {
      ...input,
      id: input.id ?? `plan_${Date.now()}`,
      submittedAt: input.status === 'Pending Supervisor Review' ? Date.now() : null,
      reviewedAt: null,
    };
    api
      .savePlan(input)
      .then((plan) => setPlans((prev) => upsert(prev, plan)))
      .catch((err) => toast.error(err instanceof ApiError ? err.detail : 'Could not save the plan.'));
    return optimistic;
  }, []);

  const reviewPlan: AppContextValue['reviewPlan'] = useCallback((planId, approve, feedback) => {
    api
      .reviewPlan(planId, approve, feedback)
      .then((plan) => setPlans((prev) => upsert(prev, plan)))
      .catch((err) => toast.error(err instanceof ApiError ? err.detail : 'Could not review the plan.'));
  }, []);

  const saveSession: AppContextValue['saveSession'] = useCallback((input) => {
    api
      .saveSession(input)
      .then((session) => setSessions((prev) => upsert(prev, session)))
      .catch((err) => toast.error(err instanceof ApiError ? err.detail : 'Could not save the session.'));
  }, []);

  const saveReport: AppContextValue['saveReport'] = useCallback((input) => {
    const optimistic: ProgressReport = {
      ...input,
      id: input.id ?? `rep_${Date.now()}`,
      submittedAt: input.status === 'Awaiting Supervisor Evaluation' ? Date.now() : null,
      evaluation: null,
    };
    api
      .saveReport(input)
      .then((report) => setReports((prev) => upsert(prev, report)))
      .catch((err) => toast.error(err instanceof ApiError ? err.detail : 'Could not save the report.'));
    return optimistic;
  }, []);

  const evaluateReport: AppContextValue['evaluateReport'] = useCallback((reportId, evaluation, closureReason) => {
    api
      .evaluateReport(reportId, evaluation, closureReason)
      .then((report) => {
        setReports((prev) => upsert(prev, report));
        // evaluation also moves the case state machine server-side
        return api.fetchCases();
      })
      .then((latest) => setCases(latest))
      .catch((err) => toast.error(err instanceof ApiError ? err.detail : 'Could not evaluate the report.'));
  }, []);

  const usersByRole = useCallback((role: Role) => users.filter((u) => u.role === role), [users]);

  const visibleCases = useCallback(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN') return cases;
    if (currentUser.role === 'THERAPIST') return cases.filter((c) => c.therapistId === currentUser.id);
    return cases.filter((c) => c.supervisorId === currentUser.id);
  }, [cases, currentUser]);

  const patientById = useCallback((id: string) => patients.find((p) => p.id === id), [patients]);
  const caseById = useCallback((id: string) => cases.find((c) => c.id === id), [cases]);
  const planForCase = useCallback((caseId: string) => plans.find((p) => p.caseId === caseId), [plans]);
  const sessionsForCase = useCallback(
    (caseId: string) => sessions.filter((s) => s.caseId === caseId).sort((a, b) => a.number - b.number),
    [sessions]
  );
  const reportsForCase = useCallback((caseId: string) => reports.filter((r) => r.caseId === caseId), [reports]);

  const recordFor = useCallback(
    (therapistId: string): TherapistRecord =>
      records.find((r) => r.therapistId === therapistId) ?? {
        therapistId,
        directHours: 0,
        indirectHours: 0,
        competencies: emptyCompetencies(),
      },
    [records]
  );

  const updateRecord: AppContextValue['updateRecord'] = useCallback((therapistId, patch) => {
    api
      .updateRecord(therapistId, patch)
      .then((record) => setRecords((prev) => upsert(prev, record)))
      .catch((err) => toast.error(err instanceof ApiError ? err.detail : 'Could not update the record.'));
  }, []);

  const setCompetency: AppContextValue['setCompetency'] = useCallback((therapistId, area, status) => {
    api
      .setCompetency(therapistId, area, status)
      .then((record) => setRecords((prev) => upsert(prev, record)))
      .catch((err) => toast.error(err instanceof ApiError ? err.detail : 'Could not update the competency.'));
  }, []);

  const setRequirement: AppContextValue['setRequirement'] = useCallback((req) => {
    api
      .setRequirement(req)
      .then((saved) => setRequirementState(saved))
      .catch((err) => toast.error(err instanceof ApiError ? err.detail : 'Could not save the requirement.'));
  }, []);

  const markAllNotificationsRead: AppContextValue['markAllNotificationsRead'] = useCallback(() => {
    api
      .readAllNotifications()
      .then(() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))))
      .catch((err) => toast.error(err instanceof ApiError ? err.detail : 'Could not update notifications.'));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      users,
      currentUser,
      patients,
      cases,
      plans,
      sessions,
      reports,
      records,
      requirement,
      notifications,
      bootstrapping,
      hasAccounts,
      register,
      login,
      logout,
      addPatient,
      addCase,
      allocateCase,
      savePlan,
      reviewPlan,
      saveSession,
      saveReport,
      evaluateReport,
      usersByRole,
      visibleCases,
      patientById,
      caseById,
      planForCase,
      sessionsForCase,
      reportsForCase,
      recordFor,
      updateRecord,
      setCompetency,
      setRequirement,
      markAllNotificationsRead,
    }),
    [
      users,
      currentUser,
      patients,
      cases,
      plans,
      sessions,
      reports,
      records,
      requirement,
      notifications,
      bootstrapping,
      hasAccounts,
      register,
      login,
      logout,
      addPatient,
      addCase,
      allocateCase,
      savePlan,
      reviewPlan,
      saveSession,
      saveReport,
      evaluateReport,
      usersByRole,
      visibleCases,
      patientById,
      caseById,
      planForCase,
      sessionsForCase,
      reportsForCase,
      recordFor,
      updateRecord,
      setCompetency,
      setRequirement,
      markAllNotificationsRead,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}