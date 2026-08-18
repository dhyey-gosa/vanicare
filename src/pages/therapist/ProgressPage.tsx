import React, { useState } from 'react';
import { FolderOpenIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { CaseSelectList } from '../../components/cases/CaseSelectList';
import { CaseSummaryCard } from '../../components/cases/CaseSummaryCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressVisuals } from '../../components/therapy/ProgressVisuals';

export function ProgressPage() {
  const { visibleCases, planForCase, sessionsForCase } = useApp();
  const cases = visibleCases().filter((c) => c.status === 'Active');
  const [caseId, setCaseId] = useState<string | null>(cases[0]?.id ?? null);
  const selected = cases.find((c) => c.id === caseId);

  if (cases.length === 0) {
    return (
      <>
        <PageHeader breadcrumb="Student therapist / Progress" title="Longitudinal progress" />
        <Card className="p-6">
          <EmptyState icon={FolderOpenIcon} title="No cases assigned yet." />
        </Card>
      </>);

  }

  return (
    <>
      <PageHeader
        breadcrumb="Student therapist / Progress"
        title="Longitudinal progress"
        description="Progress across the session lifecycle, built only from the values you entered during session documentation." />
      

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Card as="aside" className="h-fit p-5">
          <h2 className="text-sm font-semibold text-slate-900">Assigned cases</h2>
          <div className="mt-4">
            <CaseSelectList
              cases={cases}
              selectedId={caseId}
              onSelect={setCaseId}
              meta={(c) => {
                const plan = planForCase(c.id);
                const count = sessionsForCase(c.id).length;
                return (
                  <span className="flex items-center gap-2">
                    <Badge label={plan ? plan.status : 'No plan'} />
                    <span className="num text-xs text-slate-500">
                      {count}/{plan?.totalSessions ?? 0}
                    </span>
                  </span>);

              }} />
            
          </div>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          {selected && <CaseSummaryCard caseItem={selected} />}
          {caseId && <ProgressVisuals caseId={caseId} />}
        </div>
      </div>
    </>);

}