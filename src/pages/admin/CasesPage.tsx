import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { FolderOpenIcon, UserPlusIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { AccordionSection } from '../../components/ui/Accordion';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import type { Priority } from '../../types';
import { formatDate } from '../../utils/derive';

const PRIORITIES: {value: Priority;hint: string;}[] = [
{ value: 'High', hint: 'Needs the earliest clinical attention' },
{ value: 'Medium', hint: 'Standard scheduling' },
{ value: 'Low', hint: 'Can be scheduled later' }];


const emptyForm = {
  caseType: '',
  referralReason: '',
  onsetDate: '',
  primaryDiagnosis: '',
  secondaryDiagnosis: '',
  severity: '',
  notes: ''
};

export function CasesPage() {
  const { patients, cases, addCase, patientById, users } = useApp();
  const [patientId, setPatientId] = useState('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof typeof form,>(key: K, value: (typeof form)[K]) =>
  setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!patientId) next.patientId = 'Select a registered patient.';
    if (!priority) next.priority = 'Set the case priority.';
    if (!form.caseType.trim()) next.caseType = 'Enter the case type.';
    if (!form.referralReason.trim()) next.referralReason = 'Enter the reason for referral.';
    if (!form.primaryDiagnosis.trim()) next.primaryDiagnosis = 'Enter the primary clinical diagnosis.';
    if (!form.severity) next.severity = 'Select a severity.';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error('Complete the required case details');
      return;
    }
    const created = await addCase({ ...form, patientId, priority: priority as Priority });
    setPatientId('');
    setPriority('');
    setForm(emptyForm);
    toast.success(`Case ${created.reference} created — allocate it next`);
  };

  return (
    <>
      <PageHeader
        breadcrumb="Admin / Cases"
        title="Create case"
        description="Open a clinical case against a registered patient, set its priority, then complete each section."
        actions={
        <Link to="/admin/allocation">
            <Button variant="secondary">Go to allocation</Button>
          </Link>
        } />
      

      {patients.length === 0 ?
      <Card className="p-6">
          <EmptyState
          icon={UserPlusIcon}
          title="No patients registered yet."
          description="A case can only be opened against a registered patient."
          action={
          <Link to="/admin/patients" className="mt-1 text-sm font-semibold text-[var(--accent)] hover:underline">
                Register a patient
              </Link>
          } />
        
        </Card> :

      <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <div className="flex flex-col gap-4">
            <Card className="p-6">
              <h2 className="text-base font-semibold text-slate-900">Select patient</h2>
              <p className="mt-1 text-sm text-slate-500">Registered patients and their current status.</p>
              <ul className="mt-4 flex flex-col gap-2">
                {patients.map((p) => {
                const active = patientId === p.id;
                return (
                  <li key={p.id}>
                      <button
                      type="button"
                      onClick={() => setPatientId(p.id)}
                      aria-pressed={active}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-[border-color,background-color] duration-150 ease-out ${
                      active ?
                      'border-[var(--accent)] bg-[var(--accent-soft)]' :
                      'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`
                      }>
                      
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-900">{p.fullName}</span>
                          <span className="num block text-xs text-slate-500">
                            {p.age || '—'} · {p.diagnosis || 'Diagnosis not entered'}
                          </span>
                        </span>
                        <Badge label={p.status} />
                      </button>
                    </li>);

              })}
              </ul>
              {errors.patientId && <p className="mt-2 text-xs font-medium text-rose-600">{errors.patientId}</p>}
            </Card>

            <Card className="p-6">
              <h2 className="text-base font-semibold text-slate-900">Case priority</h2>
              <p className="mt-1 text-sm text-slate-500">
                Priority determines which cases the clinic reviews and schedules first.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {PRIORITIES.map((p) => {
                const active = priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    aria-pressed={active}
                    className={`rounded-xl border px-4 py-3 text-left transition-[border-color,background-color] duration-150 ease-out ${
                    active ?
                    'border-[var(--accent)] bg-[var(--accent-soft)]' :
                    'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`
                    }>
                    
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">{p.value}</span>
                        <Badge label={p.value} />
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">{p.hint}</span>
                    </button>);

              })}
              </div>
              {errors.priority && <p className="mt-2 text-xs font-medium text-rose-600">{errors.priority}</p>}
            </Card>

            <div className="flex flex-col gap-3">
              <AccordionSection
              title="1 · Case information"
              description="Case type, referral reason and onset."
              defaultOpen>
              
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Case type" htmlFor="caseType" required error={errors.caseType}>
                    <Input
                    id="caseType"
                    value={form.caseType}
                    onChange={(e) => set('caseType', e.target.value)}
                    invalid={Boolean(errors.caseType)}
                    placeholder="e.g. Paediatric articulation" />
                  
                  </Field>
                  <Field label="Onset date" htmlFor="onsetDate">
                    <Input
                    id="onsetDate"
                    type="date"
                    value={form.onsetDate}
                    onChange={(e) => set('onsetDate', e.target.value)} />
                  
                  </Field>
                  <Field
                  label="Reason for referral"
                  htmlFor="referralReason"
                  required
                  error={errors.referralReason}
                  className="sm:col-span-2">
                  
                    <Textarea
                    id="referralReason"
                    rows={3}
                    value={form.referralReason}
                    onChange={(e) => set('referralReason', e.target.value)}
                    invalid={Boolean(errors.referralReason)} />
                  
                  </Field>
                </div>
              </AccordionSection>

              <AccordionSection title="2 · Clinical diagnosis" description="Primary, secondary and severity.">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Primary diagnosis" htmlFor="primaryDiagnosis" required error={errors.primaryDiagnosis}>
                    <Input
                    id="primaryDiagnosis"
                    value={form.primaryDiagnosis}
                    onChange={(e) => set('primaryDiagnosis', e.target.value)}
                    invalid={Boolean(errors.primaryDiagnosis)} />
                  
                  </Field>
                  <Field label="Secondary diagnosis" htmlFor="secondaryDiagnosis">
                    <Input
                    id="secondaryDiagnosis"
                    value={form.secondaryDiagnosis}
                    onChange={(e) => set('secondaryDiagnosis', e.target.value)} />
                  
                  </Field>
                  <Field label="Severity" htmlFor="severity" required error={errors.severity}>
                    <Select
                    id="severity"
                    value={form.severity}
                    onChange={(e) => set('severity', e.target.value)}
                    invalid={Boolean(errors.severity)}>
                    
                      <option value="">Select</option>
                      <option>Mild</option>
                      <option>Moderate</option>
                      <option>Severe</option>
                      <option>Profound</option>
                    </Select>
                  </Field>
                </div>
              </AccordionSection>

              <AccordionSection title="3 · Additional notes" description="Optional context for the clinical team.">
                <Field label="Notes" htmlFor="notes">
                  <Textarea id="notes" rows={4} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
                </Field>
              </AccordionSection>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setForm(emptyForm);
                setPatientId('');
                setPriority('');
              }}>
              
                Clear
              </Button>
              <Button type="submit">Create case</Button>
            </div>
          </div>

          <Card as="section" className="h-fit overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Cases</h2>
              <span className="num text-xs text-slate-500">{cases.length}</span>
            </div>
            <div className="px-5 py-5">
              {cases.length === 0 ?
            <EmptyState icon={FolderOpenIcon} title="No cases created yet." /> :

            <ul className="flex flex-col divide-y divide-slate-100">
                  {[...cases].
              sort((a, b) => b.createdAt - a.createdAt).
              map((c) => {
                const patient = patientById(c.patientId);
                const therapist = users.find((u) => u.id === c.therapistId);
                return (
                  <li key={c.id} className="py-3.5 first:pt-0 last:pb-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{patient?.fullName}</p>
                              <p className="num mt-0.5 text-xs text-slate-500">
                                {c.reference} · {formatDate(c.createdAt)}
                              </p>
                              <p className="mt-1 truncate text-xs text-slate-600">
                                {therapist ? `Therapist: ${therapist.name}` : 'Not allocated'}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                              <Badge label={c.priority} />
                              <Badge label={c.status} />
                            </div>
                          </div>
                        </li>);

              })}
                </ul>
            }
            </div>
          </Card>
        </form>
      }
    </>);

}