import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2Icon, FileTextIcon, GaugeIcon, InboxIcon, RadarIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CaseSelectList } from '../../components/cases/CaseSelectList';
import { CaseSummaryCard } from '../../components/cases/CaseSummaryCard';
import { CaseTimeline } from '../../components/cases/CaseTimeline';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressVisuals } from '../../components/therapy/ProgressVisuals';
import { ScaleInput } from '../../components/ui/ScaleInput';
import { SessionLog } from '../../components/therapy/SessionLog';
import { SlpRadarChart } from '../../components/charts/SlpRadarChart';
import { SmartDigest } from '../../components/supervision/SmartDigest';
import { Textarea } from '../../components/ui/Textarea';
import type { ReportEvaluation } from '../../types';
import { buildDigest, formatDate, goalLabels } from '../../utils/derive';

const OUTCOMES: {value: ReportEvaluation['outcome'];blurb: string;}[] = [
{ value: 'Continue Therapy', blurb: 'Case stays active; the therapist keeps documenting sessions.' },
{ value: 'Close Case', blurb: 'Therapy goals met or episode complete. Requires a closure reason.' },
{ value: 'Discontinue Case', blurb: 'Therapy stops before completion. Requires a reason.' }];


const RATING_LABELS: Record<number, string> = {
  1: 'Needs significant support',
  2: 'Developing',
  3: 'Satisfactory',
  4: 'Strong',
  5: 'Exemplary'
};

export function ReportEvaluationsPage() {
  const { visibleCases, patientById, planForCase, sessionsForCase, reportsForCase, evaluateReport } = useApp();
  const cases = visibleCases().filter((c) => reportsForCase(c.id).some((r) => r.status !== 'Draft'));
  const [caseId, setCaseId] = useState<string | null>(cases[0]?.id ?? null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<ReportEvaluation['outcome'] | ''>('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selected = cases.find((c) => c.id === caseId);
  const plan = caseId ? planForCase(caseId) : undefined;
  const sessions = caseId ? sessionsForCase(caseId) : [];
  const report = caseId ? reportsForCase(caseId).find((r) => r.status === 'Awaiting Supervisor Evaluation') : undefined;
  const evaluated = caseId ? reportsForCase(caseId).filter((r) => r.status === 'Evaluated') : [];

  const digest = useMemo(() => buildDigest(sessions, goalLabels(plan, sessions)), [sessions, plan]);

  useEffect(() => {
    setFeedback('');
    setRating(null);
    setOutcome('');
    setReason('');
    setErrors({});
  }, [caseId]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (feedback.trim().length < 10) next.feedback = 'Enter supervisor feedback for the therapist.';
    if (!rating) next.rating = 'Give a clinical rating from 1 to 5.';
    if (!outcome) next.outcome = 'Select a case outcome.';
    if ((outcome === 'Close Case' || outcome === 'Discontinue Case') && reason.trim().length < 5)
    next.reason = outcome === 'Close Case' ? 'A closure reason is required.' : 'A reason is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const attemptSubmit = () => {
    if (!validate()) {
      toast.error('Complete the evaluation');
      return;
    }
    if (outcome === 'Close Case' || outcome === 'Discontinue Case') {
      setConfirmOpen(true);
      return;
    }
    commit();
  };

  const commit = () => {
    if (!report || !rating || !outcome) return;
    evaluateReport(report.id, { feedback: feedback.trim(), rating, outcome }, reason.trim());
    setConfirmOpen(false);
    toast.success(
      outcome === 'Continue Therapy' ?
      'Evaluation submitted — case remains active' :
      `Case ${outcome === 'Close Case' ? 'closed' : 'discontinued'} and set to read-only`
    );
    setFeedback('');
    setRating(null);
    setOutcome('');
    setReason('');
  };

  if (cases.length === 0) {
    return (
      <>
        <PageHeader breadcrumb="Supervisor / Evaluations" title="Progress report evaluation" />
        <Card className="p-6">
          <EmptyState
            icon={InboxIcon}
            title="No progress reports awaiting evaluation."
            description="Submitted reports from the cases you supervise appear here." />
          
        </Card>
      </>);

  }

  return (
    <>
      <PageHeader
        breadcrumb="Supervisor / Evaluations"
        title="Evaluate progress report"
        description="Start with the smart digest, check the underlying session data, then rate the work and set the case outcome." />
      

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Card as="aside" className="h-fit p-5">
          <h2 className="text-sm font-semibold text-slate-900">Reports</h2>
          <div className="mt-4">
            <CaseSelectList
              cases={cases}
              selectedId={caseId}
              onSelect={setCaseId}
              meta={(c) => {
                const r = reportsForCase(c.id).find((rep) => rep.status !== 'Draft');
                return <Badge label={r?.status ?? ''} />;
              }} />
            
          </div>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          {selected && <CaseSummaryCard caseItem={selected} />}

          <SmartDigest items={digest} />

          {report ?
          <>
              <Card as="section" className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Submitted progress report</h2>
                    <p className="num mt-0.5 text-xs text-slate-500">
                      Submitted {formatDate(report.submittedAt)} ·{' '}
                      {sessions.filter((s) => s.status === 'Completed').length} of {plan?.totalSessions ?? 0} sessions
                      completed
                    </p>
                  </div>
                  <Badge label={report.status} />
                </div>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Progress summary</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-800">{report.summary}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Goals addressed</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-800">
                      {report.goalsAddressed}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Recommendations</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-800">
                      {report.recommendations}
                    </p>
                  </div>
                  {report.observations &&
                <div className="sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Therapist observations
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-800">
                        {report.observations}
                      </p>
                    </div>
                }
                </div>
              </Card>

              {caseId && <ProgressVisuals caseId={caseId} />}

              <Card as="section" className="p-5">
                <div className="flex items-center gap-2.5">
                  <RadarIcon className="h-4.5 w-4.5 text-[var(--accent)]" />
                  <h2 className="text-base font-semibold text-slate-900">SLP outcome profile — baseline vs current</h2>
                </div>
                <div className="mt-4">
                  {Object.values(report.domains).some((d) => d.applicable && (d.baseline !== null || d.current !== null)) ?
                <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
                      <SlpRadarChart domains={report.domains} />
                      <ul className="flex flex-col gap-2">
                        {Object.entries(report.domains).map(([domain, score]) =>
                    <li key={domain} className="rounded-xl border border-slate-200 px-3 py-2.5">
                            <p className="text-xs font-medium text-slate-700">{domain}</p>
                            <p className="num mt-0.5 text-xs text-slate-500">
                              {score.applicable ?
                        `Baseline ${score.baseline ?? '—'} → Current ${score.current ?? '—'}` :
                        'Not applicable'}
                            </p>
                          </li>
                    )}
                      </ul>
                    </div> :

                <EmptyState icon={RadarIcon} title="No outcome data entered yet." />
                }
                </div>
              </Card>

              <Card as="section" className="p-5">
                <div className="flex items-center gap-2.5">
                  <FileTextIcon className="h-4.5 w-4.5 text-[var(--accent)]" />
                  <h2 className="text-base font-semibold text-slate-900">Session documentation</h2>
                </div>
                <div className="mt-4">
                  <SessionLog sessions={sessions} />
                </div>
              </Card>

              <Card as="section" className="p-6">
                <div className="flex items-center gap-2.5">
                  <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--accent)]"
                  style={{ backgroundColor: 'var(--accent-soft)' }}>
                  
                    <GaugeIcon className="h-4.5 w-4.5" />
                  </span>
                  <h2 className="text-base font-semibold text-slate-900">Supervisor evaluation</h2>
                </div>

                <div className="mt-6 flex flex-col gap-6">
                  <Field label="Supervisor feedback" htmlFor="supFeedback" required error={errors.feedback}>
                    <Textarea
                    id="supFeedback"
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    invalid={Boolean(errors.feedback)} />
                  
                  </Field>

                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      Clinical rating<span className="ml-1 text-rose-500">*</span>
                    </p>
                    <ScaleInput name="Clinical rating" value={rating} onChange={setRating} labels={RATING_LABELS} />
                    {errors.rating && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.rating}</p>}
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      Case outcome<span className="ml-1 text-rose-500">*</span>
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {OUTCOMES.map((o) => {
                      const active = outcome === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => setOutcome(o.value)}
                          aria-pressed={active}
                          className={`rounded-xl border px-4 py-3 text-left transition-[border-color,background-color] duration-150 ease-out ${
                          active ?
                          'border-[var(--accent)] bg-[var(--accent-soft)]' :
                          'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`
                          }>
                          
                            <span className="block text-sm font-semibold text-slate-900">{o.value}</span>
                            <span className="mt-1 block text-xs leading-relaxed text-slate-500">{o.blurb}</span>
                          </button>);

                    })}
                    </div>
                    {errors.outcome && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.outcome}</p>}
                  </div>

                  {(outcome === 'Close Case' || outcome === 'Discontinue Case') &&
                <Field
                  label={outcome === 'Close Case' ? 'Closure reason' : 'Discontinuation reason'}
                  htmlFor="reason"
                  required
                  error={errors.reason}>
                  
                      <Textarea
                    id="reason"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    invalid={Boolean(errors.reason)} />
                  
                    </Field>
                }
                </div>

                <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
                  <Button onClick={attemptSubmit}>Submit evaluation</Button>
                </div>
              </Card>
            </> :

          <Card className="p-6">
              <EmptyState
              icon={InboxIcon}
              title="No progress report awaiting evaluation for this case."
              description="Previous evaluations for this case are shown below." />
            
            </Card>
          }

          {evaluated.length > 0 &&
          <Card as="section" className="overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-900">Evaluation history</h2>
              </div>
              <ul className="flex flex-col divide-y divide-slate-100 px-5 py-4">
                {evaluated.map((r) =>
              <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        <CheckCircle2Icon className="h-4 w-4 text-emerald-600" />
                        <span className="num">Rating {r.evaluation?.rating}/5</span> · {r.evaluation?.outcome}
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
          {caseId && <CaseTimeline caseId={caseId} />}
        </div>
      </div>

      <Modal
        open={confirmOpen}
        title={outcome === 'Close Case' ? 'Are you sure you want to close this case?' : 'Discontinue this case?'}
        onClose={() => setConfirmOpen(false)}
        footer={
        <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant={outcome === 'Close Case' ? 'primary' : 'danger'} onClick={commit}>
              {outcome === 'Close Case' ? 'Confirm case closure' : 'Confirm discontinuation'}
            </Button>
          </>
        }>
        
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-slate-600">
            The case becomes read-only and is removed from active cases, therapy planning, session documentation and
            progress report creation.
          </p>
          <dl className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4">
            <div className="flex justify-between gap-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Patient</dt>
              <dd className="text-sm font-medium text-slate-900">
                {patientById(selected?.patientId ?? '')?.fullName ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Case</dt>
              <dd className="num text-sm text-slate-900">{selected?.reference}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Final rating</dt>
              <dd className="num text-sm text-slate-900">{rating}/5</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {outcome === 'Close Case' ? 'Closure reason' : 'Reason'}
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-slate-700">{reason}</dd>
            </div>
          </dl>
        </div>
      </Modal>
    </>);

}