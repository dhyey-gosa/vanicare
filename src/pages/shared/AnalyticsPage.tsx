import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3Icon, PieChartIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatTile } from '../../components/ui/StatTile';
import { ROLE_THEMES } from '../../utils/theme';

const PRIORITY_COLORS: Record<string, string> = {
  High: '#b03a5b',
  Medium: '#b08033',
  Low: '#64748b'
};

const tooltipStyle = { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 };

export function AnalyticsPage() {
  const { currentUser, patients, visibleCases, usersByRole, planForCase, sessionsForCase, reportsForCase } = useApp();
  const scoped = visibleCases();
  const isAdmin = currentUser?.role === 'ADMIN';
  const accent = ROLE_THEMES[currentUser?.role ?? 'ADMIN'].accent;

  const counts = useMemo(
    () => ({
      active: scoped.filter((c) => c.status === 'Active').length,
      unallocated: scoped.filter((c) => c.status === 'Unallocated').length,
      closed: scoped.filter((c) => c.status === 'Closed').length,
      discontinued: scoped.filter((c) => c.status === 'Discontinued').length
    }),
    [scoped]
  );

  const priorityData = useMemo(
    () =>
    (['High', 'Medium', 'Low'] as const).
    map((p) => ({ priority: p, cases: scoped.filter((c) => c.priority === p).length })).
    filter((row) => row.cases > 0),
    [scoped]
  );

  const therapistData = useMemo(
    () =>
    usersByRole('THERAPIST').
    map((t) => {
      const owned = scoped.filter((c) => c.therapistId === t.id);
      const active = owned.filter((c) => c.status === 'Active');
      return {
        name: t.name.split(' ')[0],
        'Active cases': active.length,
        'Sessions documented': active.reduce((sum, c) => sum + sessionsForCase(c.id).length, 0),
        'Pending plans': active.filter((c) => {
          const plan = planForCase(c.id);
          return !plan || plan.status !== 'Approved';
        }).length,
        'Pending reports': active.filter((c) =>
        reportsForCase(c.id).some((r) => r.status === 'Awaiting Supervisor Evaluation')
        ).length
      };
    }).
    filter((row) => row['Active cases'] > 0 || row['Sessions documented'] > 0),
    [usersByRole, scoped, sessionsForCase, planForCase, reportsForCase]
  );

  const supervisorData = useMemo(
    () =>
    usersByRole('SUPERVISOR').
    map((s) => {
      const owned = scoped.filter((c) => c.supervisorId === s.id && c.status === 'Active');
      return {
        name: s.name.split(' ')[0],
        'Plans to review': owned.filter((c) => planForCase(c.id)?.status === 'Pending Supervisor Review').length,
        'Reports to evaluate': owned.filter((c) =>
        reportsForCase(c.id).some((r) => r.status === 'Awaiting Supervisor Evaluation')
        ).length,
        'Cases supervised': owned.length
      };
    }).
    filter((row) => row['Cases supervised'] > 0),
    [usersByRole, scoped, planForCase, reportsForCase]
  );

  const sessionProgress = useMemo(
    () =>
    scoped.
    filter((c) => c.status === 'Active').
    map((c) => {
      const plan = planForCase(c.id);
      return {
        name: c.reference,
        Documented: sessionsForCase(c.id).length,
        Planned: plan?.totalSessions ?? 0
      };
    }).
    filter((row) => row.Planned > 0),
    [scoped, planForCase, sessionsForCase]
  );

  return (
    <>
      <PageHeader
        breadcrumb={isAdmin ? 'Admin / Analytics' : 'Supervisor / Analytics'}
        title="Analytics"
        description={
        isAdmin ?
        'Aggregated from records entered in this system. Nothing is estimated or simulated.' :
        'Scoped to the cases allocated to you for supervision.'
        } />
      

      <Card as="section" className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Case analytics</h2>
        </div>
        <div className="grid grid-cols-2 divide-slate-100 sm:grid-cols-5 sm:divide-x">
          <StatTile label={isAdmin ? 'Registered patients' : 'Patients supervised'} value={isAdmin ? patients.length : scoped.length} empty="None" emphasis />
          <StatTile label="Active cases" value={counts.active} empty="None" />
          <StatTile label="Awaiting allocation" value={counts.unallocated} empty="None" />
          <StatTile label="Closed cases" value={counts.closed} empty="None" />
          <StatTile label="Discontinued" value={counts.discontinued} empty="None" />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card as="section" className="p-5">
          <h2 className="text-base font-semibold text-slate-900">Priority distribution</h2>
          <p className="mt-1 text-sm text-slate-500">Cases by the priority set at case creation.</p>
          <div className="mt-4">
            {priorityData.length === 0 ?
            <EmptyState icon={PieChartIcon} title="No analytics available yet." description="Create cases to see the distribution." /> :

            <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="priority" tick={{ fontSize: 12, fill: '#475569' }} stroke="#cbd5e1" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="cases" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                      {priorityData.map((row) =>
                    <Cell key={row.priority} fill={PRIORITY_COLORS[row.priority]} />
                    )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            }
          </div>
        </Card>

        <Card as="section" className="p-5">
          <h2 className="text-base font-semibold text-slate-900">Session progression</h2>
          <p className="mt-1 text-sm text-slate-500">Documented sessions against the planned total per active case.</p>
          <div className="mt-4">
            {sessionProgress.length === 0 ?
            <EmptyState icon={BarChart3Icon} title="No session data available." /> :

            <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionProgress} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} stroke="#cbd5e1" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Documented" fill={accent} radius={[6, 6, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="Planned" fill="#cbd5e1" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            }
          </div>
        </Card>
      </div>

      <Card as="section" className="p-5">
        <h2 className="text-base font-semibold text-slate-900">Therapist workload</h2>
        <p className="mt-1 text-sm text-slate-500">
          Distribution of active cases, documented sessions and pending items across therapists.
        </p>
        <div className="mt-4">
          {therapistData.length === 0 ?
          <EmptyState
            icon={BarChart3Icon}
            title="No analytics available yet."
            description="Allocate cases to therapists to compare workload." /> :


          <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={therapistData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} stroke="#cbd5e1" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Active cases" fill={accent} radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="Sessions documented" fill="#8fb8d4" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="Pending plans" fill="#b08033" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="Pending reports" fill="#b03a5b" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        </div>
      </Card>

      <Card as="section" className="p-5">
        <h2 className="text-base font-semibold text-slate-900">Supervisor workload</h2>
        <p className="mt-1 text-sm text-slate-500">Pending plan reviews and report evaluations per supervisor.</p>
        <div className="mt-4">
          {supervisorData.length === 0 ?
          <EmptyState icon={BarChart3Icon} title="No analytics available yet." /> :

          <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supervisorData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} stroke="#cbd5e1" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Cases supervised" fill={accent} radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="Plans to review" fill="#b08033" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="Reports to evaluate" fill="#b03a5b" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        </div>
      </Card>
    </>);

}