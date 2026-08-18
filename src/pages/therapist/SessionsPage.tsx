import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { FileTextIcon, FolderOpenIcon, LockIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CaseSelectList } from '../../components/cases/CaseSelectList';
import { CaseTimeline } from '../../components/cases/CaseTimeline';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { ScaleInput } from '../../components/ui/ScaleInput';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import type { SessionStatus } from '../../types';
import { formatDate } from '../../utils/derive';

const emptySession = {
  number: 0,
  date: '',
  duration: '',
  goalsAddressed: '',
  activities: '',
  patientResponse: '',
  progressObserved: '',
  challenges: '',
  notes: '',
  nextSessionPlan: '',
  status: '' as SessionStatus | ''
};

export function SessionsPage() {
  const { visibleCases, planForCase, sessionsForCase, saveSession } = useApp();
  const eligible = visibleCases().filter((c) => c.status === 'Active');
  const [caseId, setCaseId] = useState<string | null>(eligible[0]?.id ?? null);
  const [form, setForm] = useState(emptySession);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const plan = caseId ? planForCase(caseId) : undefined;
  const approved = plan?.status === 'Approved';
  const sessions = caseId ? sessionsForCase(caseId) : [];
  const goals = plan?.shortTermGoals.filter((g) => g.trim()) ?? [];

  useEffect(() => {
    setForm(emptySession);
    setScores({});
    setErrors({});
  }, [caseId]);

  const set = <K extends keyof typeof form,>(key: K, value: (typeof form)[K]) =>
  setForm((prev) => ({ ...prev, [key]: value }));

  const loadSession = (number: number) => {
    const existing = sessions.find((s) => s.number === number);
    if (existing) {
      setForm({
        number: existing.number,
        date: existing.date,
        duration: existing.duration,
        goalsAddressed: existing.goalsAddressed,
        activities: existing.activities,
        patientResponse: existing.patientResponse,
        progressObserved: existing.progressObserved,
        challenges: existing.challenges,
        notes: existing.notes,
        nextSessionPlan: existing.nextSessionPlan,
        status: existing.status
      });
      setScores(existing.goalScores);
    } else {
      setForm({ ...emptySession, number });
      setScores({});
    }
    setErrors({});
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId) return;
    const next: Record<string, string> = {};
    if (!form.number) next.number = 'Select the session number.';
    if (!form.date) next.date = 'Select the session date.';
    if (!form.status) next.status = 'Set the session status.';
    if (form.status === 'Completed') {
      if (!form.duration.trim()) next.duration = 'Enter the session duration.';
      if (!form.goalsAddressed.trim()) next.goalsAddressed = 'List the therapy goals addressed.';
      if (!form.activities.trim()) next.activities = 'Describe the activities performed.';
      if (!form.patientResponse.trim()) next.patientResponse = 'Record the patient response.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error('Check the highlighted fields');
      return;
    }
    saveSession({
      caseId,
      number: form.number,
      date: form.date,
      duration: form.duration,
      goalsAddressed: form.goalsAddressed,
      activities: form.activities,
      patientResponse: form.patientResponse,
      progressObserved: form.progressObserved,
      challenges: form.challenges,
      notes: form.notes,
      nextSessionPlan: form.nextSessionPlan,
      status: form.status as SessionStatus,
      goalScores: scores
    });
    toast.success(`Session ${form.number} saved`);
    setForm(emptySession);
    setScores({});
  };

  if (eligible.length === 0) {
    return (
      <>
        <PageHeader breadcrumb="Student therapist / Sessions" title="Session documentation" />
        <Card className="p-6">
          <EmptyState icon={FolderOpenIcon} title="No cases assigned yet." />
        </Card>
      </>);

  }

  return (
    <>
      <PageHeader
        breadcrumb="Student therapist / Sessions"
        title="Document session"
        description="Sessions are numbered against the approved plan. Progress values you enter here drive the longitudinal charts and heatmap." />
      

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Card as="aside" className="h-fit p-5">
          <h2 className="text-sm font-semibold text-slate-900">Assigned cases</h2>
          <div className="mt-4">
            <CaseSelectList
              cases={eligible}
              selectedId={caseId}
              onSelect={setCaseId}
              meta={(c) => {
                const p = planForCase(c.id);
                return <Badge label={p ? p.status : 'No plan'} />;
              }} />
            
          </div>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          {!approved ?
          <Card className="p-6">
              <EmptyState
              icon={LockIcon}
              title={plan ? 'Therapy plan not approved yet.' : 'No therapy plan for this case.'}
              description={
              plan ?
              `The plan is currently "${plan.status}". Sessions can be documented once the supervisor approves it.` :
              'Create and submit a therapy plan before documenting sessions.'
              }
              action={
              <Link to="/therapist/plans" className="mt-1 text-sm font-semibold text-[var(--accent)] hover:underline">
                    Open therapy plans
                  </Link>
              } />
            
            </Card> :

          <>
              <Card as="section" className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Session lifecycle</h2>
                    <p className="num mt-0.5 text-xs text-slate-500">
                      {sessions.length} of {plan.totalSessions} sessions documented · {plan.frequency} · {plan.duration}
                    </p>
                  </div>
                  <Link to="/therapist/progress" className="text-sm font-semibold text-[var(--accent)] hover:underline">
                    View longitudinal progress
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {Array.from({ length: plan.totalSessions }, (_, i) => i + 1).map((n) => {
                  const existing = sessions.find((s) => s.number === n);
                  const selected = form.number === n;
                  const tone = existing ?
                  existing.status === 'Completed' ?
                  'border-transparent bg-[var(--accent)] text-white' :
                  existing.status === 'Missed' || existing.status === 'Cancelled' ?
                  'border-rose-200 bg-rose-50 text-rose-700' :
                  'border-amber-200 bg-amber-50 text-amber-700' :
                  'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50';
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => loadSession(n)}
                      title={existing ? `Session ${n} · ${existing.status}` : `Session ${n} · not documented`}
                      className={`num h-8 w-8 rounded-lg border text-xs font-semibold transition-colors duration-150 ease-out ${tone} ${
                      selected ? 'ring-2 ring-[var(--accent)] ring-offset-1' : ''}`
                      }>
                      
                        {n}
                      </button>);

                })}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2.5">
                  <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--accent)]"
                  style={{ backgroundColor: 'var(--accent-soft)' }}>
                  
                    <FileTextIcon className="h-4.5 w-4.5" />
                  </span>
                  <h2 className="text-base font-semibold text-slate-900">
                    {form.number ? `Session ${form.number}` : 'Session record'}
                  </h2>
                </div>

                <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-6">
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Field label="Session number" htmlFor="number" required error={errors.number}>
                      <Select
                      id="number"
                      value={form.number || ''}
                      onChange={(e) => loadSession(Number(e.target.value))}
                      invalid={Boolean(errors.number)}>
                      
                        <option value="">Select (1–{plan.totalSessions})</option>
                        {Array.from({ length: plan.totalSessions }, (_, i) => i + 1).map((n) =>
                      <option key={n} value={n}>
                            {n}
                            {sessions.some((s) => s.number === n) ? ' · documented' : ''}
                          </option>
                      )}
                      </Select>
                    </Field>
                    <Field label="Session date" htmlFor="date" required error={errors.date}>
                      <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) => set('date', e.target.value)}
                      invalid={Boolean(errors.date)} />
                    
                    </Field>
                    <Field label="Session duration" htmlFor="sessionDuration" error={errors.duration}>
                      <Input
                      id="sessionDuration"
                      value={form.duration}
                      onChange={(e) => set('duration', e.target.value)}
                      placeholder="e.g. 45 minutes"
                      invalid={Boolean(errors.duration)} />
                    
                    </Field>
                    <Field label="Session status" htmlFor="sessionStatus" required error={errors.status}>
                      <Select
                      id="sessionStatus"
                      value={form.status}
                      onChange={(e) => set('status', e.target.value as SessionStatus)}
                      invalid={Boolean(errors.status)}>
                      
                        <option value="">Select</option>
                        <option>Scheduled</option>
                        <option>Completed</option>
                        <option>Missed</option>
                        <option>Cancelled</option>
                      </Select>
                    </Field>
                  </div>

                  <div className="grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
                    <Field label="Therapy goals addressed" htmlFor="goalsAddressed" error={errors.goalsAddressed}>
                      <Textarea
                      id="goalsAddressed"
                      rows={3}
                      value={form.goalsAddressed}
                      onChange={(e) => set('goalsAddressed', e.target.value)}
                      invalid={Boolean(errors.goalsAddressed)} />
                    
                    </Field>
                    <Field label="Activities performed" htmlFor="sessionActivities" error={errors.activities}>
                      <Textarea
                      id="sessionActivities"
                      rows={3}
                      value={form.activities}
                      onChange={(e) => set('activities', e.target.value)}
                      invalid={Boolean(errors.activities)} />
                    
                    </Field>
                    <Field label="Patient response" htmlFor="patientResponse" error={errors.patientResponse}>
                      <Textarea
                      id="patientResponse"
                      rows={3}
                      value={form.patientResponse}
                      onChange={(e) => set('patientResponse', e.target.value)}
                      invalid={Boolean(errors.patientResponse)} />
                    
                    </Field>
                    <Field label="Progress observed" htmlFor="progressObserved">
                      <Textarea
                      id="progressObserved"
                      rows={3}
                      value={form.progressObserved}
                      onChange={(e) => set('progressObserved', e.target.value)} />
                    
                    </Field>
                    <Field label="Challenges / difficulties" htmlFor="challenges">
                      <Textarea
                      id="challenges"
                      rows={3}
                      value={form.challenges}
                      onChange={(e) => set('challenges', e.target.value)} />
                    
                    </Field>
                    <Field label="Therapist notes" htmlFor="sessionNotes">
                      <Textarea
                      id="sessionNotes"
                      rows={3}
                      value={form.notes}
                      onChange={(e) => set('notes', e.target.value)} />
                    
                    </Field>
                    <Field label="Next session plan" htmlFor="nextSessionPlan" className="sm:col-span-2">
                      <Textarea
                      id="nextSessionPlan"
                      rows={3}
                      value={form.nextSessionPlan}
                      onChange={(e) => set('nextSessionPlan', e.target.value)} />
                    
                    </Field>
                  </div>

                  <section className="border-t border-slate-100 pt-6">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Goal progress values
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-500">
                      Enter a value only where you observed the goal this session. Blank values stay blank in the charts.
                    </p>
                    <div className="mt-4 flex flex-col gap-4">
                      {goals.length === 0 ?
                    <EmptyState
                      compact
                      icon={FileTextIcon}
                      title="No short-term goals in the plan."
                      description="Add short-term goals to the therapy plan to score progress here." /> :


                    goals.map((goal) =>
                    <div
                      key={goal}
                      className="flex flex-col gap-2 rounded-xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      
                            <span className="text-sm font-medium text-slate-700">{goal}</span>
                            <ScaleInput
                        name={goal}
                        value={scores[goal] ?? null}
                        onChange={(v) =>
                        setScores((prev) => {
                          const next = { ...prev };
                          if (v === null) delete next[goal];else
                          next[goal] = v;
                          return next;
                        })
                        } />
                      
                          </div>
                    )
                    }
                    </div>
                  </section>

                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                    <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setForm(emptySession);
                      setScores({});
                    }}>
                    
                      Clear
                    </Button>
                    <Button type="submit">Save session record</Button>
                  </div>
                </form>
              </Card>

              <Card as="section" className="overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="text-sm font-semibold text-slate-900">Documented sessions</h2>
                </div>
                <div className="px-5 py-5">
                  {sessions.length === 0 ?
                <EmptyState icon={FileTextIcon} title="No session data available." description="Document the first session above." /> :

                <ul className="flex flex-col divide-y divide-slate-100">
                      {sessions.map((s) =>
                  <li key={s.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                          <div className="min-w-0">
                            <p className="num text-sm font-semibold text-slate-900">Session {s.number}</p>
                            <p className="num text-xs text-slate-500">
                              {formatDate(s.date)} · {s.duration || 'duration not entered'} ·{' '}
                              {Object.keys(s.goalScores).length} goal value
                              {Object.keys(s.goalScores).length === 1 ? '' : 's'}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge label={s.status} />
                            <button
                        type="button"
                        onClick={() => loadSession(s.number)}
                        className="text-xs font-semibold text-[var(--accent)] hover:underline">
                        
                              Edit
                            </button>
                          </div>
                        </li>
                  )}
                    </ul>
                }
                </div>
              </Card>
            </>
          }
          {caseId && <CaseTimeline caseId={caseId} />}
        </div>
      </div>
    </>);

}