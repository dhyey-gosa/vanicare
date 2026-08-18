import React, { useState } from 'react';
import { toast } from 'sonner';
import { GraduationCapIcon, InfoIcon, UsersIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { COMPETENCY_AREAS, type CompetencyStatus } from '../../types';

const STATUSES: CompetencyStatus[] = ['Not Started', 'In Progress', 'Competent'];

export function CompetenciesPage() {
  const { currentUser, usersByRole, visibleCases, recordFor, updateRecord, setCompetency, requirement, setRequirement } =
  useApp();
  const role = currentUser?.role;

  const supervisedTherapistIds = new Set(
    visibleCases().
    map((c) => c.therapistId).
    filter((id): id is string => Boolean(id))
  );
  const therapists =
  role === 'THERAPIST' ?
  usersByRole('THERAPIST').filter((t) => t.id === currentUser?.id) :
  role === 'SUPERVISOR' ?
  usersByRole('THERAPIST').filter((t) => supervisedTherapistIds.has(t.id)) :
  usersByRole('THERAPIST');

  const [selectedId, setSelectedId] = useState<string>(therapists[0]?.id ?? '');
  const activeId = role === 'THERAPIST' ? currentUser?.id ?? '' : selectedId;
  const record = activeId ? recordFor(activeId) : null;
  const [req, setReq] = useState(requirement);
  const [hours, setHours] = useState({ direct: '', indirect: '' });

  const totalHours = record ? record.directHours + record.indirectHours : 0;
  const directPercent = totalHours > 0 && record ? Math.round(record.directHours / totalHours * 100) : 0;

  const logHours = () => {
    if (!activeId) return;
    const direct = Number(hours.direct || 0);
    const indirect = Number(hours.indirect || 0);
    if (direct <= 0 && indirect <= 0) {
      toast.error('Enter the hours to add');
      return;
    }
    updateRecord(activeId, {
      directHours: (record?.directHours ?? 0) + direct,
      indirectHours: (record?.indirectHours ?? 0) + indirect
    });
    setHours({ direct: '', indirect: '' });
    toast.success('Supervision hours logged');
  };

  return (
    <>
      <PageHeader
        breadcrumb={`${role === 'ADMIN' ? 'Admin' : role === 'THERAPIST' ? 'Student therapist' : 'Supervisor'} / Training`}
        title="Clinical hours & competency tracker"
        description="An optional programme module. Supervision requirements are configured by the institute and are not treated as a legal standard here." />
      

      {role === 'ADMIN' &&
      <Card as="section" className="p-6">
          <h2 className="text-base font-semibold text-slate-900">Programme requirement</h2>
          <p className="mt-1 text-sm text-slate-500">
            Set the hour targets and the direct supervision share your institute expects.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <Field label="Required direct hours" htmlFor="reqDirect">
              <Input
              id="reqDirect"
              type="number"
              min={0}
              value={req.requiredDirect}
              onChange={(e) => setReq({ ...req, requiredDirect: Number(e.target.value) })} />
            
            </Field>
            <Field label="Required indirect hours" htmlFor="reqIndirect">
              <Input
              id="reqIndirect"
              type="number"
              min={0}
              value={req.requiredIndirect}
              onChange={(e) => setReq({ ...req, requiredIndirect: Number(e.target.value) })} />
            
            </Field>
            <Field label="Required direct share (%)" htmlFor="reqPercent">
              <Input
              id="reqPercent"
              type="number"
              min={0}
              max={100}
              value={req.requiredDirectPercent}
              onChange={(e) => setReq({ ...req, requiredDirectPercent: Number(e.target.value) })} />
            
            </Field>
          </div>
          <div className="mt-5 flex justify-end border-t border-slate-100 pt-5">
            <Button
            onClick={() => {
              setRequirement(req);
              toast.success('Requirement updated');
            }}>
            
              Save requirement
            </Button>
          </div>
        </Card>
      }

      {therapists.length === 0 ?
      <Card className="p-6">
          <EmptyState
          icon={UsersIcon}
          title={role === 'SUPERVISOR' ? 'No therapists under your supervision yet.' : 'No therapist accounts yet.'}
          description="Hours and competency tracking appears once therapist accounts exist and cases are allocated." />
        
        </Card> :

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          {role !== 'THERAPIST' &&
        <Card as="aside" className="h-fit p-5">
              <h2 className="text-sm font-semibold text-slate-900">Student therapists</h2>
              <ul className="mt-4 flex flex-col gap-2">
                {therapists.map((t) => {
              const active = activeId === t.id;
              const r = recordFor(t.id);
              return (
                <li key={t.id}>
                      <button
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    aria-pressed={active}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-[border-color,background-color] duration-150 ease-out ${
                    active ?
                    'border-[var(--accent)] bg-[var(--accent-soft)]' :
                    'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`
                    }>
                    
                        <span className="block truncate text-sm font-semibold text-slate-900">{t.name}</span>
                        <span className="num block text-xs text-slate-500">
                          {r.directHours + r.indirectHours} total hours logged
                        </span>
                      </button>
                    </li>);

            })}
              </ul>
            </Card>
        }

          <div className={`flex min-w-0 flex-col gap-4 ${role === 'THERAPIST' ? 'xl:col-span-2' : ''}`}>
            {record &&
          <>
                <Card as="section" className="p-6">
                  <div className="flex items-center gap-2.5">
                    <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--accent)]"
                  style={{ backgroundColor: 'var(--accent-soft)' }}>
                  
                      <GraduationCapIcon className="h-4.5 w-4.5" />
                    </span>
                    <h2 className="text-base font-semibold text-slate-900">Supervision hours</h2>
                  </div>
                  <div className="mt-6 flex flex-col gap-5">
                    <ProgressBar
                  label="Direct supervision"
                  value={record.directHours}
                  max={requirement.requiredDirect} />
                
                    <ProgressBar
                  label="Indirect supervision"
                  value={record.indirectHours}
                  max={requirement.requiredIndirect} />
                
                    <ProgressBar
                  label="Total clinical hours"
                  value={totalHours}
                  max={requirement.requiredDirect + requirement.requiredIndirect} />
                
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
                    <InfoIcon className="h-4 w-4 text-slate-400" />
                    <p className="text-sm text-slate-600">
                      Direct share is <span className="num font-semibold">{directPercent}%</span> against a configured
                      target of <span className="num font-semibold">{requirement.requiredDirectPercent}%</span>.
                    </p>
                    <Badge
                  label={directPercent >= requirement.requiredDirectPercent ? 'On target' : 'Below target'}
                  tone={directPercent >= requirement.requiredDirectPercent ? 'approved' : 'pending'} />
                
                  </div>

                  <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <Field label="Add direct hours" htmlFor="addDirect">
                      <Input
                    id="addDirect"
                    type="number"
                    min={0}
                    step="0.5"
                    value={hours.direct}
                    onChange={(e) => setHours({ ...hours, direct: e.target.value })} />
                  
                    </Field>
                    <Field label="Add indirect hours" htmlFor="addIndirect">
                      <Input
                    id="addIndirect"
                    type="number"
                    min={0}
                    step="0.5"
                    value={hours.indirect}
                    onChange={(e) => setHours({ ...hours, indirect: e.target.value })} />
                  
                    </Field>
                    <Button onClick={logHours}>Log hours</Button>
                  </div>
                </Card>

                <Card as="section" className="p-6">
                  <h2 className="text-base font-semibold text-slate-900">Competency areas</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {role === 'SUPERVISOR' ?
                'Mark each area as you observe the therapist’s clinical work.' :
                'Competency status is set by your supervisor.'}
                  </p>
                  <ul className="mt-5 flex flex-col gap-2">
                    {COMPETENCY_AREAS.map((area) => {
                  const status = record.competencies[area] ?? 'Not Started';
                  return (
                    <li
                      key={area}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      
                          <span className="text-sm font-medium text-slate-800">{area}</span>
                          {role === 'SUPERVISOR' ?
                      <div className="flex flex-wrap gap-1.5">
                              {STATUSES.map((s) =>
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setCompetency(activeId, area, s);
                            toast.success(`${area} marked ${s}`);
                          }}
                          aria-pressed={status === s}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ease-out ${
                          status === s ?
                          'border-[var(--accent)] bg-[var(--accent)] text-white' :
                          'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`
                          }>
                          
                                  {s}
                                </button>
                        )}
                            </div> :

                      <Badge label={status.toUpperCase()} />
                      }
                        </li>);

                })}
                  </ul>
                </Card>
              </>
          }
          </div>
        </div>
      }
    </>);

}