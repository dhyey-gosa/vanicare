import React from 'react';
import { Badge } from '../ui/Badge';
import { useApp } from '../../contexts/AppContext';
import type { Case } from '../../types';

interface CaseSelectListProps {
  cases: Case[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  meta?: (c: Case) => React.ReactNode;
  label?: string;
}

export function CaseSelectList({ cases, selectedId, onSelect, meta, label = 'Select a case' }: CaseSelectListProps) {
  const { patientById } = useApp();
  return (
    <ul aria-label={label} className="flex flex-col gap-2">
      {cases.map((c) => {
        const patient = patientById(c.patientId);
        const active = selectedId === c.id;
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              aria-pressed={active}
              className={`w-full rounded-xl border px-4 py-3 text-left transition-[border-color,background-color,box-shadow] duration-150 ease-out ${
              active ?
              'border-[var(--accent)] bg-[var(--accent-soft)]' :
              'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`
              }>
              
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{patient?.fullName ?? 'Unknown patient'}</p>
                  <p className="num mt-0.5 text-xs text-slate-500">
                    {c.reference} · {c.caseType || 'Case type not entered'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge label={c.priority} />
                  <Badge label={c.status} />
                </div>
              </div>
              {meta && <div className="mt-2">{meta(c)}</div>}
            </button>
          </li>);

      })}
    </ul>);

}