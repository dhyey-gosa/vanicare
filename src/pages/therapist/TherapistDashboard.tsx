import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardListIcon, FileTextIcon, FolderOpenIcon, GaugeIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ActionCard } from '../../components/ui/ActionCard';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatTile } from '../../components/ui/StatTile';

export function TherapistDashboard() {
  const { currentUser, visibleCases, patientById, planForCase, sessionsForCase, reportsForCase } = useApp();
  const myCases = visibleCases();
  const openCases = myCases.filter((c) => c.status === 'Active');

  const plansPending = openCases.filter((c) => planForCase(c.id)?.status === 'Pending Supervisor Review').length;
  const changesRequested = openCases.filter((c) => planForCase(c.id)?.status === 'Changes Requested').length;
  const noPlan = openCases.filter((c) => !planForCase(c.id)).length;
  const sessionCount = openCases.reduce((sum, c) => sum + sessionsForCase(c.id).length, 0);

  return (
    <>
      <PageHeader
        breadcrumb="Student therapist"
        title="Your clinical caseload"
        description={`Signed in as ${currentUser?.name}. Only cases allocated to you appear here.`} />
      

      <section aria-label="Primary actions" className="grid gap-4 lg:grid-cols-3">
        <ActionCard
          featured
          to="/therapist/plans"
          step="Step 1"
          icon={ClipboardListIcon}
          title="Create therapy plan"
          description="Set long- and short-term goals, treatment approach and the session schedule."
          cta="Open therapy plans"
          meta={
          <p className="text-sm text-slate-500">
              {openCases.length === 0 ?
            'No cases assigned yet.' :
            noPlan > 0 ?
            `${noPlan} case${noPlan === 1 ? '' : 's'} without a plan` :
            'All assigned cases have a plan'}
            </p>
          } />
        
        <ActionCard
          to="/therapist/sessions"
          step="Step 2"
          icon={FileTextIcon}
          title="Document session"
          description="Record a session from 1–40 with goals addressed, response and progress values."
          cta="Document a session"
          meta={
          <p className="num text-sm text-slate-500">
              {sessionCount === 0 ? 'No sessions documented yet.' : `${sessionCount} documented`}
            </p>
          } />
        
        <ActionCard
          to="/therapist/reports"
          step="Step 3"
          icon={GaugeIcon}
          title="Submit progress report"
          description="Summarise progress, complete the SLP outcome profile and send it for evaluation."
          cta="Open progress reports"
          meta={<p className="text-sm text-slate-500">Includes the baseline vs current radar chart</p>} />
        
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card as="section" className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Assigned patients</h2>
            <span className="num text-xs text-slate-500">{openCases.length}</span>
          </div>
          <div className="px-5 py-5">
            {openCases.length === 0 ?
            <EmptyState
              icon={FolderOpenIcon}
              title="No cases assigned yet."
              description="An administrator allocates cases to you. Allocated cases appear here immediately." /> :


            <ul className="flex flex-col divide-y divide-slate-100">
                {openCases.map((c) => {
                const patient = patientById(c.patientId);
                const plan = planForCase(c.id);
                const sessions = sessionsForCase(c.id);
                const report = reportsForCase(c.id).find((r) => r.status !== 'Draft');
                return (
                  <li key={c.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{patient?.fullName}</p>
                          <p className="num mt-0.5 text-xs text-slate-500">
                            {c.reference} · {sessions.length}/{plan?.totalSessions ?? 0} sessions documented
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge label={c.priority} />
                          <Badge label={plan ? plan.status : 'No plan'} />
                          {report && <Badge label={report.status} />}
                        </div>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-3 text-xs font-semibold">
                        <Link to="/therapist/plans" className="text-[var(--accent)] hover:underline">
                          {plan ? 'Open plan' : 'Create plan'}
                        </Link>
                        {plan?.status === 'Approved' &&
                      <>
                            <Link to="/therapist/sessions" className="text-[var(--accent)] hover:underline">
                              Document session
                            </Link>
                            <Link to="/therapist/progress" className="text-[var(--accent)] hover:underline">
                              View progress
                            </Link>
                          </>
                      }
                      </div>
                    </li>);

              })}
              </ul>
            }
          </div>
        </Card>

        <Card as="section" className="h-fit overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Pending actions</h2>
          </div>
          <div className="grid grid-cols-2 divide-slate-100 sm:divide-x">
            <StatTile label="Active cases" value={openCases.length} empty="None" emphasis />
            <StatTile label="Plans awaiting review" value={plansPending} empty="None" />
            <StatTile label="Changes requested" value={changesRequested} empty="None" />
            <StatTile label="Sessions documented" value={sessionCount} empty="None" />
          </div>
          <div className="border-t border-slate-100 px-5 py-4">
            <p className="text-xs leading-relaxed text-slate-500">
              A plan must be approved by your supervisor before you can document sessions against it.
            </p>
          </div>
        </Card>
      </div>
    </>);

}