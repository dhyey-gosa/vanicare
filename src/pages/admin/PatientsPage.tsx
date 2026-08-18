import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { UserPlusIcon, UsersIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import type { PatientStatus } from '../../types';
import { calcAge, formatDate } from '../../utils/derive';

const emptyForm = {
  fullName: '',
  dob: '',
  gender: '',
  contactNumber: '',
  guardianName: '',
  referralSource: '',
  diagnosis: '',
  status: '' as PatientStatus | ''
};

export function PatientsPage() {
  const { patients, cases, addPatient } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const age = useMemo(() => calcAge(form.dob), [form.dob]);
  const set = <K extends keyof typeof form,>(key: K, value: (typeof form)[K]) =>
  setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.fullName.trim().length < 2) next.fullName = 'Enter the patient’s full name.';
    if (!form.dob) next.dob = 'Select a date of birth.';else
    if (new Date(form.dob) > new Date()) next.dob = 'Date of birth cannot be in the future.';
    if (!form.gender) next.gender = 'Select a gender.';
    if (!/^[+\d][\d\s-]{5,}$/.test(form.contactNumber.trim())) next.contactNumber = 'Enter a reachable contact number.';
    if (form.guardianName.trim().length < 2) next.guardianName = 'Enter the guardian or next of kin.';
    if (!form.referralSource.trim()) next.referralSource = 'Enter the referral source.';
    if (!form.diagnosis.trim()) next.diagnosis = 'Enter the working diagnosis.';
    if (!form.status) next.status = 'Select a patient status.';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error('Check the highlighted fields');
      return;
    }
    addPatient({ ...form, age, status: form.status as PatientStatus });
    setForm(emptyForm);
    toast.success(`${form.fullName.trim()} registered`);
  };

  return (
    <>
      <PageHeader
        breadcrumb="Admin / Patients"
        title="Patient registration"
        description="Every field is entered manually. Nothing is pre-filled and no record is created until you submit the form."
        actions={
        <Link to="/admin/cases">
            <Button variant="secondary">Go to case creation</Button>
          </Link>
        } />
      

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card as="section" className="p-6">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--accent)]"
              style={{ backgroundColor: 'var(--accent-soft)' }}>
              
              <UserPlusIcon className="h-4.5 w-4.5" />
            </span>
            <h2 className="text-base font-semibold text-slate-900">Add patient</h2>
          </div>

          <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" htmlFor="fullName" required error={errors.fullName} className="sm:col-span-2">
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  invalid={Boolean(errors.fullName)} />
                
              </Field>
              <Field label="Date of birth" htmlFor="dob" required error={errors.dob}>
                <Input
                  id="dob"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={form.dob}
                  onChange={(e) => set('dob', e.target.value)}
                  invalid={Boolean(errors.dob)} />
                
              </Field>
              <Field label="Age" htmlFor="age" hint="Calculated automatically from date of birth.">
                <Input id="age" value={age} readOnly placeholder="—" disabled />
              </Field>
              <Field label="Gender" htmlFor="gender" required error={errors.gender}>
                <Select
                  id="gender"
                  value={form.gender}
                  onChange={(e) => set('gender', e.target.value)}
                  invalid={Boolean(errors.gender)}>
                  
                  <option value="">Select</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </Select>
              </Field>
              <Field label="Contact number" htmlFor="contactNumber" required error={errors.contactNumber}>
                <Input
                  id="contactNumber"
                  inputMode="tel"
                  value={form.contactNumber}
                  onChange={(e) => set('contactNumber', e.target.value)}
                  invalid={Boolean(errors.contactNumber)} />
                
              </Field>
              <Field label="Guardian name" htmlFor="guardianName" required error={errors.guardianName}>
                <Input
                  id="guardianName"
                  value={form.guardianName}
                  onChange={(e) => set('guardianName', e.target.value)}
                  invalid={Boolean(errors.guardianName)} />
                
              </Field>
              <Field label="Referral source" htmlFor="referralSource" required error={errors.referralSource}>
                <Input
                  id="referralSource"
                  value={form.referralSource}
                  onChange={(e) => set('referralSource', e.target.value)}
                  invalid={Boolean(errors.referralSource)} />
                
              </Field>
              <Field label="Patient status" htmlFor="status" required error={errors.status}>
                <Select
                  id="status"
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as PatientStatus)}
                  invalid={Boolean(errors.status)}>
                  
                  <option value="">Select</option>
                  <option>Active</option>
                  <option>On Hold</option>
                  <option>Completed</option>
                </Select>
              </Field>
              <Field
                label="Diagnosis"
                htmlFor="diagnosis"
                required
                error={errors.diagnosis}
                className="sm:col-span-2">
                
                <Textarea
                  id="diagnosis"
                  rows={3}
                  value={form.diagnosis}
                  onChange={(e) => set('diagnosis', e.target.value)}
                  invalid={Boolean(errors.diagnosis)} />
                
              </Field>
            </div>
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setForm(emptyForm)}>
                Clear form
              </Button>
              <Button type="submit">Register patient</Button>
            </div>
          </form>
        </Card>

        <Card as="section" className="h-fit overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Registered patients</h2>
            <span className="num text-xs text-slate-500">{patients.length}</span>
          </div>
          <div className="px-5 py-5">
            {patients.length === 0 ?
            <EmptyState
              icon={UsersIcon}
              title="No patients registered yet."
              description="Complete the form to register the first patient." /> :


            <ul className="flex flex-col divide-y divide-slate-100">
                {[...patients].
              sort((a, b) => b.createdAt - a.createdAt).
              map((p) => {
                const caseCount = cases.filter((c) => c.patientId === p.id).length;
                return (
                  <li key={p.id} className="py-3.5 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{p.fullName}</p>
                            <p className="num mt-0.5 text-xs text-slate-500">
                              {p.age || '—'} · {p.gender} · {formatDate(p.createdAt)}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-600">{p.diagnosis}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <Badge label={p.status} />
                            <span className="num text-[11px] text-slate-400">
                              {caseCount === 0 ? 'no case' : `${caseCount} case${caseCount === 1 ? '' : 's'}`}
                            </span>
                          </div>
                        </div>
                      </li>);

              })}
              </ul>
            }
          </div>
        </Card>
      </div>
    </>);

}