import React, { useState } from 'react';
import { ChevronDownIcon, FileTextIcon } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import type { TherapySession } from '../../types';
import { formatDate } from '../../utils/derive';

function Detail({ label, value }: {label: string;value: string;}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">{value}</p>
    </div>);

}

export function SessionLog({ sessions }: {sessions: TherapySession[];}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (sessions.length === 0) {
    return <EmptyState icon={FileTextIcon} title="No session data available." />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {sessions.map((s) => {
        const open = openId === s.id;
        return (
          <li key={s.id} className="overflow-hidden rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : s.id)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-slate-50">
              
              <span className="min-w-0">
                <span className="num block text-sm font-semibold text-slate-900">Session {s.number}</span>
                <span className="num block text-xs text-slate-500">
                  {formatDate(s.date)} · {s.duration || 'duration not entered'}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <Badge label={s.status} />
                <ChevronDownIcon
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ease-out ${open ? 'rotate-180' : ''}`} />
                
              </span>
            </button>
            {open &&
            <div className="grid gap-4 border-t border-slate-100 px-4 py-4 sm:grid-cols-2">
                <Detail label="Goals addressed" value={s.goalsAddressed} />
                <Detail label="Activities performed" value={s.activities} />
                <Detail label="Patient response" value={s.patientResponse} />
                <Detail label="Progress observed" value={s.progressObserved} />
                <Detail label="Challenges" value={s.challenges} />
                <Detail label="Therapist notes" value={s.notes} />
                <Detail label="Next session plan" value={s.nextSessionPlan} />
                {Object.keys(s.goalScores).length > 0 &&
              <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Goal values</p>
                    <ul className="mt-1 flex flex-col gap-1">
                      {Object.entries(s.goalScores).map(([goal, score]) =>
                  <li key={goal} className="num flex justify-between gap-3 text-sm text-slate-700">
                          <span className="truncate">{goal}</span>
                          <span className="font-semibold">{score}/5</span>
                        </li>
                  )}
                    </ul>
                  </div>
              }
              </div>
            }
          </li>);

      })}
    </ul>);

}