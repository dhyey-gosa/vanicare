import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheckIcon, FolderOpenIcon, GaugeIcon, LineChartIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ActionCard } from '../../components/ui/ActionCard';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatTile } from '../../components/ui/StatTile';
import { formatDate } from '../../utils/derive';

export function SupervisorDashboard() {
  const { currentUser, visibleCases, patientById, planForCase, reportsForCase, sessionsForCase, users } = useApp();
  const myCases = visibleCases();
  const active = myCases.filter((c) => c.status === 'Active');

  const plansPending = active.filter((c) => planForCase(c.id)?.status === 'Pending Supervisor Review');
  const reportsPending = active.filter((c) =>
  reportsForCase(c.id).some((r) => r.status === 'Awaiting Supervisor Evaluation')
  );

  return (
    <>
      <PageHeader
        breadcrumb="Supervisor"
        title="Supervision queue"
        description={`Signed in as ${currentUser?.name}. Only cases allocated to you for supervision appear here.`} />
      

      <section aria-label="Primary actions" className="grid gap-4 lg:grid-cols-3">
        <ActionCard
          featured
          to="/supervisor/plans"
          step="Step 1"
          icon={ClipboardCheckIcon}
          title="Review therapy plans"
          description="Read the goals, baseline and schedule, then approve or request changes."
          cta="Open plan reviews"
          meta={
          <p className="text-sm text-slate-500">
              {plansPending.length === 0 ?
            'No therapy plans awaiting review.' :
            `${plansPending.length} awaiting your review`}
            </p>
          } />
        
        <ActionCard
          to="/supervisor/reports"
          step="Step 2"
          icon={GaugeIcon}
          title="Evaluate progress reports"
          description="Start from the smart digest, then rate the work and set the case outcome."
          cta="Open evaluations"
          meta={
          <p className="text-sm text-slate-500">
              {reportsPending.length === 0 ?
            'No progress reports awaiting evaluation.' :
            `${reportsPending.length} awaiting evaluation`}
            </p>
          } />
        
        <ActionCard
          to="/supervisor/outcomes"
          step="Anytime"
          icon={LineChartIcon}
          title="SLP outcome visualisation"
          description="Compare baseline and current domain profiles across the cases you supervise."
          cta="View outcomes"
          meta={<p className="num text-sm text-slate-500">{active.length} cases under supervision</p>} />
        
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card as="section" className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Cases under supervision</h2>
          </div>
          <div className="px-5 py-5">
            {active.length === 0 ?
            <EmptyState
              icon={FolderOpenIcon}
              title="No cases assigned yet."
              description="An administrator allocates cases to you for supervision." /> :


            <ul className="flex flex-col divide-y divide-slate-100">
                {active.map((c) => {
                const patient = patientById(c.patientId);
                const therapist = users.find((u) => u.id === c.therapistId);
                const plan = planForCase(c.id);
                const report = reportsForCase(c.id).find((r) => r.status !== 'Draft');
                const sessions = sessionsForCase(c.id);
                return (
                  <li key={c.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{patient?.fullName}</p>
                          <p className="num mt-0.5 text-xs text-slate-500">
                            {c.reference} · {therapist?.name} · {sessions.length} session
                            {sessions.length === 1 ? '' : 's'} documented
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge label={c.priority} />
                          <Badge label={plan ? plan.status : 'No plan'} />
                          {report && <Badge label={report.status} />}
                        </div>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-3 text-xs font-semibold">
                        {plan?.status === 'Pending Supervisor Review' &&
                      <Link to="/supervisor/plans" className="text-[var(--accent)] hover:underline">
                            Review plan
                          </Link>
                      }
                        {report?.status === 'Awaiting Supervisor Evaluation' &&
                      <Link to="/supervisor/reports" className="text-[var(--accent)] hover:underline">
                            Evaluate report
                          </Link>
                      }
                        <Link to="/supervisor/outcomes" className="text-[var(--accent)] hover:underline">
                          View outcomes
                        </Link>
                      </div>
                    </li>);

              })}
              </ul>
            }
          </div>
        </Card>

        <Card as="section" className="h-fit overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Review workload</h2>
          </div>
          <div className="grid grid-cols-2 divide-slate-100 sm:divide-x">
            <StatTile label="Plans awaiting review" value={plansPending.length} empty="None" emphasis />
            <StatTile label="Reports awaiting evaluation" value={reportsPending.length} empty="None" />
            <StatTile label="Cases supervised" value={active.length} empty="None" />
            <StatTile
              label="Closed by you"
              value={myCases.filter((c) => c.status === 'Closed' || c.status === 'Discontinued').length}
              empty="None" />
            
          </div>
          <div className="border-t border-slate-100 px-5 py-4">
            <p className="text-xs text-slate-500">
              Oldest pending item:{' '}
              {plansPending.length > 0 ?
              `plan submitted ${formatDate(planForCase(plansPending[0].id)?.submittedAt ?? null)}` :
              reportsPending.length > 0 ?
              'a progress report' :
              'nothing pending'}
            </p>
          </div>
        </Card>
      </div>
    </>);

}