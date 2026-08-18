import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2Icon, ClipboardCheckIcon, FolderOpenIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CaseSelectList } from '../../components/cases/CaseSelectList';
import { CaseSummaryCard } from '../../components/cases/CaseSummaryCard';
import { CaseTimeline } from '../../components/cases/CaseTimeline';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field } from '../../components/ui/Field';
import { PageHeader } from '../../components/ui/PageHeader';
import { Textarea } from '../../components/ui/Textarea';
import { formatDate } from '../../utils/derive';

function DetailBlock({ title, children }: {title: string;children: React.ReactNode;}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="mt-1 text-sm leading-relaxed text-slate-800">{children}</div>
    </div>);

}

export function PlanReviewsPage() {
  const { visibleCases, planForCase, reviewPlan, patientById } = useApp();
  const withPlans = visibleCases().filter((c) => c.status === 'Active' && planForCase(c.id));
  const pending = withPlans.filter((c) => planForCase(c.id)?.status === 'Pending Supervisor Review');
  const [caseId, setCaseId] = useState<string | null>(pending[0]?.id ?? withPlans[0]?.id ?? null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const selected = withPlans.find((c) => c.id === caseId);
  const plan = caseId ? planForCase(caseId) : undefined;

  useEffect(() => {
    setFeedback('');
    setError('');
  }, [caseId]);

  const approve = () => {
    if (!plan) return;
    reviewPlan(plan.id, true, '');
    toast.success(`Plan approved for ${patientById(selected?.patientId ?? '')?.fullName ?? 'the case'}`);
  };

  const requestChanges = () => {
    if (!plan) return;
    if (feedback.trim().length < 10) {
      setError('Explain what the therapist needs to change (at least 10 characters).');
      return;
    }
    reviewPlan(plan.id, false, feedback.trim());
    setFeedback('');
    setError('');
    toast.success('Changes requested — the therapist can update and resubmit');
  };

  if (withPlans.length === 0) {
    return (
      <>
        <PageHeader breadcrumb="Supervisor / Plans" title="Therapy plan review" />
        <Card className="p-6">
          <EmptyState
            icon={FolderOpenIcon}
            title="No therapy plans awaiting review."
            description="Plans submitted by therapists on the cases you supervise appear here." />
          
        </Card>
      </>);

  }

  return (
    <>
      <PageHeader
        breadcrumb="Supervisor / Plans"
        title="Therapy plan review"
        description="Approve a plan to unlock session documentation, or request changes with written feedback." />
      

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Card as="aside" className="h-fit p-5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Supervised plans</h2>
            <span className="num text-xs text-slate-500">{pending.length} pending</span>
          </div>
          <div className="mt-4">
            <CaseSelectList
              cases={withPlans}
              selectedId={caseId}
              onSelect={setCaseId}
              meta={(c) => <Badge label={planForCase(c.id)?.status ?? ''} />} />
            
          </div>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          {selected && <CaseSummaryCard caseItem={selected} />}

          {plan &&
          <>
              <Card as="section" className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--accent)]"
                    style={{ backgroundColor: 'var(--accent-soft)' }}>
                    
                      <ClipboardCheckIcon className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Submitted therapy plan</h2>
                      <p className="num text-xs text-slate-500">Submitted {formatDate(plan.submittedAt)}</p>
                    </div>
                  </div>
                  <Badge label={plan.status.toUpperCase()} />
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <DetailBlock title="Long-term goals">
                    <ul className="list-disc pl-4">
                      {plan.longTermGoals.map((g) =>
                    <li key={g}>{g}</li>
                    )}
                    </ul>
                  </DetailBlock>
                  <DetailBlock title="Short-term goals">
                    <ul className="list-disc pl-4">
                      {plan.shortTermGoals.map((g) =>
                    <li key={g}>{g}</li>
                    )}
                    </ul>
                  </DetailBlock>
                  <DetailBlock title="Baseline summary">
                    <p className="whitespace-pre-line">{plan.baselineSummary}</p>
                  </DetailBlock>
                  <DetailBlock title="Therapy activities">
                    <p className="whitespace-pre-line">{plan.activities}</p>
                  </DetailBlock>
                </div>

                <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
                  <DetailBlock title="Session frequency">{plan.frequency}</DetailBlock>
                  <DetailBlock title="Time duration">{plan.duration}</DetailBlock>
                  <DetailBlock title="Total sessions">
                    <span className="num">{plan.totalSessions}</span>
                  </DetailBlock>
                </div>
              </Card>

              {plan.status === 'Approved' ?
            <div className="flex items-start gap-2.5 rounded-card border border-emerald-200 bg-emerald-50 px-5 py-4">
                  <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-sm text-emerald-900">
                    Approved {formatDate(plan.reviewedAt)}. The therapist can document sessions against this plan.
                  </p>
                </div> :
            plan.status === 'Changes Requested' ?
            <Card className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Changes requested</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{plan.feedback}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Waiting for the therapist to update and resubmit the plan.
                  </p>
                </Card> :

            <Card className="p-6">
                  <h2 className="text-base font-semibold text-slate-900">Your decision</h2>
                  <div className="mt-4">
                    <Field
                  label="Feedback for the therapist"
                  htmlFor="feedback"
                  error={error}
                  hint="Required when requesting changes.">
                  
                      <Textarea
                    id="feedback"
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    invalid={Boolean(error)} />
                  
                    </Field>
                  </div>
                  <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                    <Button variant="secondary" onClick={requestChanges}>
                      Request changes
                    </Button>
                    <Button onClick={approve}>Approve plan</Button>
                  </div>
                </Card>
            }
            </>
          }
          {caseId && <CaseTimeline caseId={caseId} />}
        </div>
      </div>
    </>);

}