import React from 'react';
import { ArchiveIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { formatDate } from '../../utils/derive';

export function ClosedCasesPage() {
  const { visibleCases, patientById, users } = useApp();
  const closed = visibleCases().
  filter((c) => c.status === 'Closed' || c.status === 'Discontinued').
  sort((a, b) => (b.closure?.closedAt ?? 0) - (a.closure?.closedAt ?? 0));

  return (
    <>
      <PageHeader
        breadcrumb="Case lifecycle"
        title="Closed & discontinued cases"
        description="Read-only records. Closed cases no longer appear in active cases, therapy planning, session documentation or progress reporting." />
      

      {closed.length === 0 ?
      <Card className="p-6">
          <EmptyState
          icon={ArchiveIcon}
          title="No closed cases yet."
          description="Cases appear here after a supervisor closes or discontinues them." />
        
        </Card> :

      <>
          <div className="hidden overflow-hidden rounded-card border border-slate-200 bg-white shadow-card lg:block">
            <table className="w-full text-left">
              <caption className="sr-only">Closed and discontinued cases</caption>
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {['Patient', 'Case', 'Therapist', 'Supervisor', 'Rating', 'Closed', 'Reason', 'Status'].map((h) =>
                <th key={h} scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {h}
                    </th>
                )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {closed.map((c) => {
                const patient = patientById(c.patientId);
                const therapist = users.find((u) => u.id === c.therapistId);
                const supervisor = users.find((u) => u.id === c.supervisorId);
                return (
                  <tr key={c.id} className="align-top">
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-900">{patient?.fullName}</td>
                      <td className="num px-4 py-3.5 text-sm text-slate-600">{c.reference}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{therapist?.name ?? '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{supervisor?.name ?? '—'}</td>
                      <td className="num px-4 py-3.5 text-sm text-slate-600">
                        {c.closure ? `${c.closure.rating}/5` : '—'}
                      </td>
                      <td className="num px-4 py-3.5 text-sm text-slate-600">{formatDate(c.closure?.closedAt ?? null)}</td>
                      <td className="max-w-[240px] px-4 py-3.5 text-sm text-slate-600">{c.closure?.reason}</td>
                      <td className="px-4 py-3.5">
                        <Badge label={c.status.toUpperCase()} />
                      </td>
                    </tr>);

              })}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-3 lg:hidden">
            {closed.map((c) => {
            const patient = patientById(c.patientId);
            const therapist = users.find((u) => u.id === c.therapistId);
            const supervisor = users.find((u) => u.id === c.supervisorId);
            return (
              <li key={c.id}>
                  <Card className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{patient?.fullName}</p>
                        <p className="num text-xs text-slate-500">{c.reference}</p>
                      </div>
                      <Badge label={c.status.toUpperCase()} />
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Therapist</dt>
                        <dd className="text-sm text-slate-700">{therapist?.name ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Supervisor</dt>
                        <dd className="text-sm text-slate-700">{supervisor?.name ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Final rating</dt>
                        <dd className="num text-sm text-slate-700">{c.closure ? `${c.closure.rating}/5` : '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Closed</dt>
                        <dd className="num text-sm text-slate-700">{formatDate(c.closure?.closedAt ?? null)}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Reason</dt>
                        <dd className="text-sm leading-relaxed text-slate-700">{c.closure?.reason}</dd>
                      </div>
                    </dl>
                  </Card>
                </li>);

          })}
          </ul>
        </>
      }
    </>);

}