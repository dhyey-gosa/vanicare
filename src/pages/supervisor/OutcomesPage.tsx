import React, { useState } from 'react';
import { RadarIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { CaseSelectList } from '../../components/cases/CaseSelectList';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressVisuals } from '../../components/therapy/ProgressVisuals';
import { SlpRadarChart } from '../../components/charts/SlpRadarChart';
import { formatDate } from '../../utils/derive';

export function OutcomesPage() {
  const { visibleCases, reportsForCase } = useApp();
  const cases = visibleCases();
  const withOutcomes = cases.filter((c) =>
  reportsForCase(c.id).some(
    (r) => r.status !== 'Draft' && Object.values(r.domains).some((d) => d.applicable && d.current !== null)
  )
  );
  const [caseId, setCaseId] = useState<string | null>(withOutcomes[0]?.id ?? null);
  const report = caseId ?
  [...reportsForCase(caseId)].
  filter((r) => r.status !== 'Draft').
  sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0))[0] :
  undefined;

  if (withOutcomes.length === 0) {
    return (
      <>
        <PageHeader breadcrumb="Supervisor / Outcomes" title="SLP outcome visualisation" />
        <Card className="p-6">
          <EmptyState
            icon={RadarIcon}
            title="No outcome data entered yet."
            description="Domain profiles appear once a therapist submits a progress report with SLP scores." />
          
        </Card>
      </>);

  }

  return (
    <>
      <PageHeader
        breadcrumb="Supervisor / Outcomes"
        title="SLP outcome visualisation"
        description="Baseline versus current domain profiles for the cases you supervise, plus the underlying goal progress." />
      

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Card as="aside" className="h-fit p-5">
          <h2 className="text-sm font-semibold text-slate-900">Cases with outcome data</h2>
          <div className="mt-4">
            <CaseSelectList
              cases={withOutcomes}
              selectedId={caseId}
              onSelect={setCaseId}
              meta={(c) => {
                const r = reportsForCase(c.id).find((rep) => rep.status !== 'Draft');
                return <Badge label={r?.status ?? ''} />;
              }} />
            
          </div>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          {report &&
          <Card as="section" className="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold text-slate-900">SLP outcome profile</h2>
                <p className="num text-xs text-slate-500">Reported {formatDate(report.submittedAt)}</p>
              </div>
              <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_300px]">
                <SlpRadarChart domains={report.domains} />
                <ul className="flex flex-col gap-2">
                  {Object.entries(report.domains).map(([domain, score]) => {
                  const delta =
                  score.applicable && score.baseline !== null && score.current !== null ?
                  score.current - score.baseline :
                  null;
                  return (
                    <li key={domain} className="rounded-xl border border-slate-200 px-3 py-2.5">
                        <p className="text-xs font-medium text-slate-700">{domain}</p>
                        <p className="num mt-0.5 text-xs text-slate-500">
                          {score.applicable ?
                        `${score.baseline ?? '—'} → ${score.current ?? '—'}${
                        delta !== null ? ` (${delta > 0 ? '+' : ''}${delta})` : ''}` :

                        'Not applicable'}
                        </p>
                      </li>);

                })}
                </ul>
              </div>
            </Card>
          }
          {caseId && <ProgressVisuals caseId={caseId} />}
        </div>
      </div>
    </>);

}