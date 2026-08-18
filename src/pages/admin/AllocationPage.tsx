import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { FolderOpenIcon, UsersIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CaseSelectList } from '../../components/cases/CaseSelectList';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field } from '../../components/ui/Field';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';

export function AllocationPage() {
  const { cases, usersByRole, allocateCase, patientById, users } = useApp();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [therapistId, setTherapistId] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pending = cases.filter((c) => c.status === 'Unallocated');
  const allocated = cases.filter((c) => c.therapistId && c.status === 'Active');
  const therapists = usersByRole('THERAPIST');
  const supervisors = usersByRole('SUPERVISOR');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!caseId) next.caseId = 'Select a case to allocate.';
    if (!therapistId) next.therapistId = 'Assign a student therapist.';
    if (!supervisorId) next.supervisorId = 'Assign a supervising clinician.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    allocateCase(caseId as string, therapistId, supervisorId);
    const patient = patientById(cases.find((c) => c.id === caseId)?.patientId ?? '');
    setCaseId(null);
    setTherapistId('');
    setSupervisorId('');
    toast.success(`${patient?.fullName ?? 'Case'} allocated — visible only to the assigned therapist and supervisor`);
  };

  return (
    <>
      <PageHeader
        breadcrumb="Admin / Allocation"
        title="Patient allocation"
        description="Once allocated, a case is visible only to the assigned student therapist and the assigned supervisor." />
      

      {pending.length === 0 && allocated.length === 0 ?
      <Card className="p-6">
          <EmptyState
          icon={FolderOpenIcon}
          title="No cases available for allocation."
          description="Create a case first, then allocate it to clinical staff."
          action={
          <Link to="/admin/cases" className="mt-1 text-sm font-semibold text-[var(--accent)] hover:underline">
                Create a case
              </Link>
          } />
        
        </Card> :

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <Card className="p-6">
              <h2 className="text-base font-semibold text-slate-900">Unallocated cases</h2>
              <p className="mt-1 text-sm text-slate-500">Higher priority cases should be allocated first.</p>
              <div className="mt-4">
                {pending.length === 0 ?
              <EmptyState compact icon={FolderOpenIcon} title="No pending allocations." /> :

              <CaseSelectList cases={pending} selectedId={caseId} onSelect={setCaseId} />
              }
              </div>
              {errors.caseId && <p className="mt-2 text-xs font-medium text-rose-600">{errors.caseId}</p>}
            </Card>

            <Card className="p-6">
              <h2 className="text-base font-semibold text-slate-900">Assign clinical staff</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <Field
                label="Student therapist"
                htmlFor="therapist"
                required
                error={errors.therapistId}
                hint={therapists.length === 0 ? 'No therapist accounts exist yet.' : undefined}>
                
                  <Select
                  id="therapist"
                  value={therapistId}
                  onChange={(e) => setTherapistId(e.target.value)}
                  invalid={Boolean(errors.therapistId)}
                  disabled={therapists.length === 0}>
                  
                    <option value="">Select therapist</option>
                    {therapists.map((t) =>
                  <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                  )}
                  </Select>
                </Field>
                <Field
                label="Supervisor / clinical staff"
                htmlFor="supervisor"
                required
                error={errors.supervisorId}
                hint={supervisors.length === 0 ? 'No supervisor accounts exist yet.' : undefined}>
                
                  <Select
                  id="supervisor"
                  value={supervisorId}
                  onChange={(e) => setSupervisorId(e.target.value)}
                  invalid={Boolean(errors.supervisorId)}
                  disabled={supervisors.length === 0}>
                  
                    <option value="">Select supervisor</option>
                    {supervisors.map((s) =>
                  <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                  )}
                  </Select>
                </Field>
              </div>
              <div className="mt-5 flex justify-end border-t border-slate-100 pt-5">
                <Button type="submit" disabled={pending.length === 0}>
                  Allocate case
                </Button>
              </div>
            </Card>
          </form>

          <Card as="section" className="h-fit overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Current allocations</h2>
              <span className="num text-xs text-slate-500">{allocated.length}</span>
            </div>
            <div className="px-5 py-5">
              {allocated.length === 0 ?
            <EmptyState icon={UsersIcon} title="No cases allocated yet." /> :

            <ul className="flex flex-col divide-y divide-slate-100">
                  {allocated.map((c) => {
                const patient = patientById(c.patientId);
                const therapist = users.find((u) => u.id === c.therapistId);
                const supervisor = users.find((u) => u.id === c.supervisorId);
                return (
                  <li key={c.id} className="py-3.5 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{patient?.fullName}</p>
                            <p className="num text-xs text-slate-500">{c.reference}</p>
                            <p className="mt-1 truncate text-xs text-slate-600">
                              {therapist?.name} · supervised by {supervisor?.name}
                            </p>
                          </div>
                          <Badge label={c.status} />
                        </div>
                      </li>);

              })}
                </ul>
            }
            </div>
          </Card>
        </div>
      }
    </>);

}