import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ClipboardListIcon, FolderOpenIcon, InfoIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CaseSelectList } from '../../components/cases/CaseSelectList';
import { CaseSummaryCard } from '../../components/cases/CaseSummaryCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field } from '../../components/ui/Field';
import { GoalListEditor } from '../../components/therapy/GoalListEditor';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';

const emptyPlan = {
  longTermGoals: [''],
  shortTermGoals: [''],
  activities: '',
  baselineSummary: '',
  frequency: '',
  duration: '',
  totalSessions: 0
};

export function TherapyPlansPage() {
  const { visibleCases, planForCase, savePlan } = useApp();
  const openCases = visibleCases().filter((c) => c.status === 'Active');
  const [caseId, setCaseId] = useState<string | null>(openCases[0]?.id ?? null);
  const [form, setForm] = useState(emptyPlan);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCase = openCases.find((c) => c.id === caseId);
  const existing = caseId ? planForCase(caseId) : undefined;
  const locked = existing?.status === 'Pending Supervisor Review' || existing?.status === 'Approved';

  useEffect(() => {
    if (!caseId) return;
    if (existing) {
      setForm({
        longTermGoals: existing.longTermGoals.length ? existing.longTermGoals : [''],
        shortTermGoals: existing.shortTermGoals.length ? existing.shortTermGoals : [''],
        activities: existing.activities,
        baselineSummary: existing.baselineSummary,
        frequency: existing.frequency,
        duration: existing.duration,
        totalSessions: existing.totalSessions
      });
    } else {
      setForm(emptyPlan);
    }
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, existing?.id, existing?.status]);

  const sessionOptions = useMemo(() => Array.from({ length: 40 }, (_, i) => i + 1), []);
  const set = <K extends keyof typeof form,>(key: K, value: (typeof form)[K]) =>
  setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.longTermGoals.filter((g) => g.trim()).length === 0) next.longTermGoals = 'Enter at least one long-term goal.';
    if (form.shortTermGoals.filter((g) => g.trim()).length === 0)
    next.shortTermGoals = 'Enter at least one short-term goal — these become the goals you score each session.';
    if (!form.activities.trim()) next.activities = 'Describe the therapy activities.';
    if (!form.baselineSummary.trim()) next.baselineSummary = 'Enter the baseline summary.';
    if (!form.frequency.trim()) next.frequency = 'Enter the session frequency.';
    if (!form.duration.trim()) next.duration = 'Enter the session duration.';
    if (!form.totalSessions) next.totalSessions = 'Select the total number of sessions (1–40).';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const persist = (status: 'Draft' | 'Pending Supervisor Review') => {
    if (!caseId) return;
    if (status === 'Pending Supervisor Review' && !validate()) {
      toast.error('Complete the plan before submitting');
      return;
    }
    savePlan({
      caseId,
      longTermGoals: form.longTermGoals.filter((g) => g.trim()),
      shortTermGoals: form.shortTermGoals.filter((g) => g.trim()),
      activities: form.activities,
      baselineSummary: form.baselineSummary,
      frequency: form.frequency,
      duration: form.duration,
      totalSessions: form.totalSessions,
      status,
      feedback: existing?.feedback ?? ''
    });
    toast.success(status === 'Draft' ? 'Draft saved' : 'Plan submitted — pending supervisor review');
  };

  if (openCases.length === 0) {
    return (
      <>
        <PageHeader breadcrumb="Student therapist / Plans" title="Therapy plans" />
        <Card className="p-6">
          <EmptyState
            icon={FolderOpenIcon}
            title="No cases assigned yet."
            description="A therapy plan can only be created for a patient allocated to you." />
          
        </Card>
      </>);

  }

  return (
    <>
      <PageHeader
        breadcrumb="Student therapist / Plans"
        title="Create therapy plan"
        description="One plan per case. Submitting sends it to your supervisor for review; nothing is scored until it is approved." />
      

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Card as="aside" className="h-fit p-5">
          <h2 className="text-sm font-semibold text-slate-900">Your assigned cases</h2>
          <div className="mt-4">
            <CaseSelectList
              cases={openCases}
              selectedId={caseId}
              onSelect={setCaseId}
              meta={(c) => {
                const plan = planForCase(c.id);
                return <Badge label={plan ? plan.status : 'No plan'} />;
              }} />
            
          </div>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          {selectedCase && <CaseSummaryCard caseItem={selectedCase} />}

          {existing &&
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-slate-200 bg-white px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-medium text-slate-600">Plan status</span>
                <Badge label={existing.status.toUpperCase()} />
              </div>
              {existing.status === 'Approved' &&
            <Link to="/therapist/sessions" className="text-sm font-semibold text-[var(--accent)] hover:underline">
                  Document a session
                </Link>
            }
            </div>
          }

          {existing?.feedback &&
          <div className="rounded-card border border-orange-200 bg-orange-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Supervisor feedback</p>
              <p className="mt-1.5 text-sm leading-relaxed text-orange-900">{existing.feedback}</p>
              {existing?.status === 'Changes Requested' &&
          <p className="mt-2 text-xs text-orange-700">Update the plan below and resubmit for review.</p>
          }
            </div>
          }

          {locked &&
          <div className="flex items-start gap-2.5 rounded-card border border-slate-200 bg-slate-50 px-5 py-4">
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <p className="text-sm text-slate-600">
                {existing?.status === 'Approved' ?
              'This plan is approved and read-only. Continue with session documentation.' :
              'This plan is awaiting supervisor review and cannot be edited until the supervisor responds.'}
              </p>
            </div>
          }

          <Card className="p-6">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--accent)]"
                style={{ backgroundColor: 'var(--accent-soft)' }}>
                
                <ClipboardListIcon className="h-4.5 w-4.5" />
              </span>
              <h2 className="text-base font-semibold text-slate-900">Therapy plan</h2>
            </div>

            <div className="mt-6 flex flex-col gap-7">
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Goals</h3>
                <div className="flex flex-col gap-5">
                  <GoalListEditor
                    label="Long-term goals"
                    goals={form.longTermGoals}
                    onChange={(g) => set('longTermGoals', g)}
                    error={errors.longTermGoals}
                    disabled={locked}
                    placeholder="Long-term functional outcome" />
                  
                  <GoalListEditor
                    label="Short-term goals"
                    goals={form.shortTermGoals}
                    onChange={(g) => set('shortTermGoals', g)}
                    error={errors.shortTermGoals}
                    disabled={locked}
                    placeholder="e.g. Articulation of /s/ in words" />
                  
                </div>
              </section>

              <section className="border-t border-slate-100 pt-6">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Treatment approach
                </h3>
                <div className="flex flex-col gap-5">
                  <Field label="Therapy activities" htmlFor="activities" required error={errors.activities}>
                    <Textarea
                      id="activities"
                      rows={4}
                      disabled={locked}
                      value={form.activities}
                      onChange={(e) => set('activities', e.target.value)}
                      invalid={Boolean(errors.activities)} />
                    
                  </Field>
                  <Field label="Baseline summary" htmlFor="baseline" required error={errors.baselineSummary}>
                    <Textarea
                      id="baseline"
                      rows={4}
                      disabled={locked}
                      value={form.baselineSummary}
                      onChange={(e) => set('baselineSummary', e.target.value)}
                      invalid={Boolean(errors.baselineSummary)} />
                    
                  </Field>
                </div>
              </section>

              <section className="border-t border-slate-100 pt-6">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Session schedule
                </h3>
                <div className="grid gap-5 sm:grid-cols-3">
                  <Field label="Session frequency" htmlFor="frequency" required error={errors.frequency}>
                    <Input
                      id="frequency"
                      disabled={locked}
                      value={form.frequency}
                      onChange={(e) => set('frequency', e.target.value)}
                      placeholder="e.g. 2 per week"
                      invalid={Boolean(errors.frequency)} />
                    
                  </Field>
                  <Field label="Time duration" htmlFor="duration" required error={errors.duration}>
                    <Input
                      id="duration"
                      disabled={locked}
                      value={form.duration}
                      onChange={(e) => set('duration', e.target.value)}
                      placeholder="e.g. 45 minutes"
                      invalid={Boolean(errors.duration)} />
                    
                  </Field>
                  <Field label="Total sessions" htmlFor="totalSessions" required error={errors.totalSessions}>
                    <Select
                      id="totalSessions"
                      disabled={locked}
                      value={form.totalSessions || ''}
                      onChange={(e) => set('totalSessions', Number(e.target.value))}
                      invalid={Boolean(errors.totalSessions)}>
                      
                      <option value="">Select (1–40)</option>
                      {sessionOptions.map((n) =>
                      <option key={n} value={n}>
                          {n}
                        </option>
                      )}
                    </Select>
                  </Field>
                </div>
              </section>
            </div>

            {!locked &&
            <div className="mt-7 flex flex-col gap-2 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => persist('Draft')}>
                  Save draft
                </Button>
                <Button type="button" onClick={() => persist('Pending Supervisor Review')}>
                  {existing?.status === 'Changes Requested' ? 'Resubmit for review' : 'Submit for supervisor review'}
                </Button>
              </div>
            }
          </Card>
        </div>
      </div>
    </>);

}