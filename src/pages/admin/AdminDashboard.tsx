import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircleIcon, FolderPlusIcon, UserPlusIcon, UsersIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ActionCard } from '../../components/ui/ActionCard';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatTile } from '../../components/ui/StatTile';
import { formatDate } from '../../utils/derive';

export function AdminDashboard() {
  const { currentUser, patients, cases, planForCase } = useApp();

  const activeCases = cases.filter((c) => c.status === 'Active');
  const pendingAllocations = cases.filter((c) => c.status === 'Unallocated');
  const attention = cases.filter(
    (c) =>
    c.status === 'Unallocated' && c.priority === 'High' ||
    c.status === 'Active' && !planForCase(c.id)
  );

  return (
    <>
      <PageHeader
        breadcrumb="Admin"
        title={`Case intake and allocation`}
        description={`Signed in as ${currentUser?.name}. Register patients, open clinical cases, then allocate each case to a student therapist and a supervisor.`} />
      

      <section aria-label="Primary actions" className="grid gap-4 lg:grid-cols-3">
        <ActionCard
          featured
          to="/admin/patients"
          step="Step 1"
          icon={UserPlusIcon}
          title="Add patient"
          description="Register a patient with demographics, referral source and working diagnosis."
          cta="Open registration form"
          meta={
          <p className="num text-sm text-slate-500">
              {patients.length === 0 ? 'No patients registered yet.' : `${patients.length} registered`}
            </p>
          } />
        
        <ActionCard
          to="/admin/cases"
          step="Step 2"
          icon={FolderPlusIcon}
          title="Create case"
          description="Open a case against a registered patient and set its clinical priority."
          cta="Create a case"
          meta={
          <p className="num text-sm text-slate-500">
              {cases.length === 0 ? 'No cases created yet.' : `${cases.length} total`}
            </p>
          } />
        
        <ActionCard
          to="/admin/allocation"
          step="Step 3"
          icon={UsersIcon}
          title="Patient allocation"
          description="Assign a student therapist and a supervising clinician to an open case."
          cta="Allocate a case"
          meta={
          <p className="num text-sm text-slate-500">
              {pendingAllocations.length === 0 ?
            'No pending allocations.' :
            `${pendingAllocations.length} awaiting allocation`}
            </p>
          } />
        
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card as="section" className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">System overview</h2>
            <Link to="/analytics" className="text-sm font-semibold text-[var(--accent)] hover:underline">
              Analytics
            </Link>
          </div>
          <div className="grid grid-cols-2 divide-slate-100 sm:grid-cols-4 sm:divide-x">
            <StatTile label="Registered patients" value={patients.length} empty="None yet" emphasis />
            <StatTile label="Active cases" value={activeCases.length} empty="None yet" />
            <StatTile label="Pending allocations" value={pendingAllocations.length} empty="None" />
            <StatTile label="Needs attention" value={attention.length} empty="Clear" />
          </div>
          <div className="border-t border-slate-100 px-5 py-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cases requiring earlier attention
            </h3>
            {attention.length === 0 ?
            <EmptyState
              compact
              icon={AlertCircleIcon}
              title="Nothing requires attention."
              description="High-priority unallocated cases and active cases without a therapy plan appear here." /> :


            <ul className="flex flex-col gap-2">
                {attention.slice(0, 5).map((c) => {
                const patient = patients.find((p) => p.id === c.patientId);
                return (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                    
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{patient?.fullName}</p>
                        <p className="num text-xs text-slate-500">
                          {c.reference} ·{' '}
                          {c.status === 'Unallocated' ? 'awaiting allocation' : 'no therapy plan submitted'}
                        </p>
                      </div>
                      <Badge label={c.priority} />
                    </li>);

              })}
              </ul>
            }
          </div>
        </Card>

        <Card as="section" className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Recently registered patients</h2>
          </div>
          <div className="px-5 py-5">
            {patients.length === 0 ?
            <EmptyState
              icon={UserPlusIcon}
              title="No patients registered yet."
              description="Create your first patient to get started."
              action={
              <Link
                to="/admin/patients"
                className="mt-1 text-sm font-semibold text-[var(--accent)] hover:underline">
                
                    Add patient
                  </Link>
              } /> :


            <ul className="flex flex-col divide-y divide-slate-100">
                {[...patients].
              sort((a, b) => b.createdAt - a.createdAt).
              slice(0, 6).
              map((p) =>
              <li key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{p.fullName}</p>
                        <p className="truncate text-xs text-slate-500">
                          {p.diagnosis || 'Diagnosis not entered'} · {formatDate(p.createdAt)}
                        </p>
                      </div>
                      <Badge label={p.status} />
                    </li>
              )}
              </ul>
            }
          </div>
        </Card>
      </div>
    </>);

}