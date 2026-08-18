import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { FolderOpenIcon, GaugeIcon, LockIcon, RadarIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CaseSelectList } from '../../components/cases/CaseSelectList';
import { CaseSummaryCard } from '../../components/cases/CaseSummaryCard';
import { DomainScoreEditor, emptyDomains } from '../../components/therapy/DomainScoreEditor';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field } from '../../components/ui/Field';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressVisuals } from '../../components/therapy/ProgressVisuals';
import { SlpRadarChart } from '../../components/charts/SlpRadarChart';
import { Textarea } from '../../components/ui/Textarea';
import type { DomainScore } from '../../types';
import { formatDate } from '../../utils/derive';

export function ReportsPage() {
  const { visibleCases, planForCase, sessionsForCase, reportsForCase, saveReport } = useApp();
  const cases = visibleCases().filter((c) => c.status === 'Active');
  const [caseId, setCaseId] = useState<string | null>(cases[0]?.id ?? null);
  const [summary, setSummary] = useState('');
  const [goalsAddressed, setGoalsAddressed] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [observations, setObservations] = useState('');
  const [domains, setDomains] = useState<Record<string, DomainScore>>(emptyDomains());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selected = cases.find((c) => c.id === caseId);
  const plan = caseId ? planForCase(caseId) : undefined;
  const sessions = caseId ? sessionsForCase(caseId) : [];
  const completed = sessions.filter((s) => s.status === 'Completed').length;
  const reports = caseId ? reportsForCase(caseId) : [];
  const openReport = reports.find((r) => r.status !== 'Evaluated');
  const locked = openReport?.status === 'Awaiting Supervisor Evaluation';

  useEffect(() => {
    if (openReport) {
      setSummary(openReport.summary);
      setGoalsAddressed(openReport.goalsAddressed);
      setRecommendations(openReport.recommendations);
      setObservations(openReport.observations);
      setDomains(openReport.domains);
    } else {
      setSummary('');
      setGoalsAddressed('');
      setRecommendations('');
      setObservations('');
      setDomains(emptyDomains());
    }
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, openReport?.id, openReport?.status]);

  const persist = (status: 'Draft' | 'Awaiting Supervisor Evaluation') => {
    if (!caseId) return;
    if (status === 'Awaiting Supervisor Evaluation') {
      const next: Record<string, string> = {};
      if (!summary.trim()) next.summary = 'Enter the progress summary.';
      if (!goalsAddressed.trim()) next.goalsAddressed = 'List the goals addressed in this reporting period.';
      if (!recommendations.trim()) next.recommendations = 'Enter your recommendations.';
      const scored = Object.values(domains).some((d) => d.applicable && d.current !== null);
      if (!scored) next.domains = 'Enter at least one current score in the SLP outcome profile.';
      setErrors(next);
      if (Object.keys(next).length > 0) {
        toast.error('Complete the report before submitting');
        return;
      }
    }
    saveReport({
      id: openReport?.id,
      caseId,
      summary,
      goalsAddressed,
      recommendations,
      observations,
      domains,
      status
    });
    toast.success(status === 'Draft' ? 'Draft saved' : 'Report submitted — awaiting supervisor evaluation');
  };

  if (cases.length === 0) {
    return (
      <>
        <PageHeader breadcrumb="Student therapist / Reports" title="Progress reports" />
        <Card className="p-6">
          <EmptyState icon={FolderOpenIcon} title="No cases assigned yet." />
        </Card>
      </>);

  }

  return (
    <>
      <PageHeader
        breadcrumb="Student therapist / Reports"
        title="Progress report"
        description="Everything in the report comes from what you entered: session records, goal values and the SLP outcome profile." />
      

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Card as="aside" className="h-fit p-5">
          <h2 className="text-sm font-semibold text-slate-900">Assigned cases</h2>
          <div className="mt-4">
            <CaseSelectList
              cases={cases}
              selectedId={caseId}
              onSelect={setCaseId}
              meta={(c) => {
                const r = reportsForCase(c.id).find((rep) => rep.status !== 'Evaluated');
                return <Badge label={r ? r.status : 'No report'} />;
              }} />
            
          </div>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          {selected && <CaseSummaryCard caseItem={selected} />}

          {!plan || plan.status !== 'Approved' ?
          <Card className="p-6">
              <EmptyState
              icon={LockIcon}
              title="Therapy plan not approved yet."
              description="A progress report can be built once the supervisor approves the therapy plan."
              action={
              <Link to="/therapist/plans" className="mt-1 text-sm font-semibold text-[var(--accent)] hover:underline">
                    Open therapy plans
                  </Link>
              } />
            
            </Card> :

          <>
              <Card as="section" className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Therapy plan reference</h2>
                    <p className="num mt-1 text-xs text-slate-500">
                      Approved {formatDate(plan.reviewedAt)} · {plan.frequency} · {plan.duration} ·{' '}
                      {plan.totalSessions} planned sessions
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge label="APPROVED" />
                    {openReport && <Badge label={openReport.status} />}
                  </div>
                </div>
                <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Sessions completed
                    </p>
                    <p className="num mt-0.5 text-sm text-slate-800">
                      {completed} of {plan.totalSessions}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Long-term goals</p>
                    <p className="mt-0.5 text-sm text-slate-800">{plan.longTermGoals.join(' · ')}</p>
                  </div>
                </div>
              </Card>

              {sessions.length === 0 &&
            <div className="rounded-card border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                  No sessions have been documented for this case yet. Document sessions so the supervisor has progress
                  data to evaluate.
                </div>
            }

              {openReport &&
            <div className="flex items-start gap-2.5 rounded-card border border-amber-200 bg-amber-50 px-5 py-4">
                  <GaugeIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <p className="text-sm leading-relaxed text-amber-900">
                    This is an automatically generated draft based on recorded session data. The therapist and
                    supervisor must verify and approve all clinical conclusions.
                  </p>
                </div>
            }

              <Card className="p-6">
                <div className="flex items-center gap-2.5">
                  <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--accent)]"
                  style={{ backgroundColor: 'var(--accent-soft)' }}>
                  
                    <GaugeIcon className="h-4.5 w-4.5" />
                  </span>
                  <h2 className="text-base font-semibold text-slate-900">Report narrative</h2>
                </div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="Progress summary" htmlFor="summary" required error={errors.summary} className="sm:col-span-2">
                    <Textarea
                    id="summary"
                    rows={4}
                    disabled={locked}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    invalid={Boolean(errors.summary)} />
                  
                  </Field>
                  <Field label="Goals addressed" htmlFor="reportGoals" required error={errors.goalsAddressed}>
                    <Textarea
                    id="reportGoals"
                    rows={4}
                    disabled={locked}
                    value={goalsAddressed}
                    onChange={(e) => setGoalsAddressed(e.target.value)}
                    invalid={Boolean(errors.goalsAddressed)} />
                  
                  </Field>
                  <Field label="Recommendations" htmlFor="recommendations" required error={errors.recommendations}>
                    <Textarea
                    id="recommendations"
                    rows={4}
                    disabled={locked}
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    invalid={Boolean(errors.recommendations)} />
                  
                  </Field>
                  <Field label="Therapist observations" htmlFor="observations" className="sm:col-span-2">
                    <Textarea
                    id="observations"
                    rows={4}
                    disabled={locked}
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)} />
                  
                  </Field>
                </div>
              </Card>

              {caseId && <ProgressVisuals caseId={caseId} />}

              <Card as="section" className="p-5">
                <div className="flex items-center gap-2.5">
                  <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--accent)]"
                  style={{ backgroundColor: 'var(--accent-soft)' }}>
                  
                    <RadarIcon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">SLP outcome profile</h2>
                    <p className="text-sm text-slate-500">
                      Enter baseline and current scores per domain (1 Beginning → 5 Strong). The chart updates as you
                      type.
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-6 lg:grid-cols-2">
                  <DomainScoreEditor domains={domains} onChange={setDomains} disabled={locked} />
                  <div className="rounded-xl border border-slate-200 p-3">
                    {Object.values(domains).some((d) => d.applicable && (d.baseline !== null || d.current !== null)) ?
                  <SlpRadarChart domains={domains} /> :

                  <EmptyState
                    icon={RadarIcon}
                    title="No outcome data entered yet."
                    description="Enter a baseline or current score to draw the baseline vs current profile." />

                  }
                  </div>
                </div>
                {errors.domains && <p className="mt-3 text-xs font-medium text-rose-600">{errors.domains}</p>}
              </Card>

              {locked ?
            <div className="flex items-start gap-2.5 rounded-card border border-slate-200 bg-slate-50 px-5 py-4">
                  <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <p className="text-sm text-slate-600">
                    This report is awaiting supervisor evaluation and is read-only until the supervisor responds.
                  </p>
                </div> :

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={() => persist('Draft')}>
                    Save draft
                  </Button>
                  <Button type="button" onClick={() => persist('Awaiting Supervisor Evaluation')}>
                    Submit progress report
                  </Button>
                </div>
            }

              {reports.filter((r) => r.status === 'Evaluated').length > 0 &&
            <Card as="section" className="overflow-hidden">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-sm font-semibold text-slate-900">Evaluated reports</h2>
                  </div>
                  <ul className="flex flex-col divide-y divide-slate-100 px-5 py-4">
                    {reports.
                filter((r) => r.status === 'Evaluated').
                map((r) =>
                <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="num text-sm font-medium text-slate-900">
                              Clinical rating {r.evaluation?.rating}/5 · {r.evaluation?.outcome}
                            </p>
                            <span className="num text-xs text-slate-500">{formatDate(r.evaluation?.evaluatedAt ?? null)}</span>
                          </div>
                          {r.evaluation?.feedback &&
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{r.evaluation.feedback}</p>
                  }
                        </li>
                )}
                  </ul>
                </Card>
            }
            </>
          }
        </div>
      </div>
    </>);

}