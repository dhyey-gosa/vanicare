import React from 'react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { useApp } from '../../contexts/AppContext';
import type { Case } from '../../types';
import { ROLE_LABEL } from '../../utils/theme';

function Row({ label, value }: {label: string;value: string;}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-sm text-slate-800">{value || '—'}</p>
    </div>);

}

export function CaseSummaryCard({ caseItem }: {caseItem: Case;}) {
  const { patientById, users } = useApp();
  const patient = patientById(caseItem.patientId);
  const therapist = users.find((u) => u.id === caseItem.therapistId);
  const supervisor = users.find((u) => u.id === caseItem.supervisorId);

  return (
    <Card className="p-5" as="section">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl text-slate-900">{patient?.fullName ?? 'Unknown patient'}</h2>
          <p className="num mt-1 text-xs text-slate-500">
            {caseItem.reference} · registered {patient ? new Date(patient.createdAt).toLocaleDateString() : '—'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge label={caseItem.priority} />
          <Badge label={caseItem.status} />
          {patient && <Badge label={patient.status} />}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-4">
        <Row label="Age" value={patient?.age ?? ''} />
        <Row label="Gender" value={patient?.gender ?? ''} />
        <Row label="Guardian" value={patient?.guardianName ?? ''} />
        <Row label="Contact" value={patient?.contactNumber ?? ''} />
        <Row label="Primary diagnosis" value={caseItem.primaryDiagnosis} />
        <Row label="Severity" value={caseItem.severity} />
        <Row label={ROLE_LABEL.THERAPIST} value={therapist?.name ?? 'Not allocated'} />
        <Row label={ROLE_LABEL.SUPERVISOR} value={supervisor?.name ?? 'Not allocated'} />
      </div>
    </Card>);

}