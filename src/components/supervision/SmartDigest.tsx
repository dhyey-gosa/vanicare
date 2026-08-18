import React from 'react';
import { AlertTriangleIcon, SparklesIcon, TrendingUpIcon, TrophyIcon } from 'lucide-react';
import type { DigestItem } from '../../utils/derive';
import { EmptyState } from '../ui/EmptyState';

const ICONS = {
  'KEY MILESTONE': TrophyIcon,
  ATTENTION: AlertTriangleIcon,
  TREND: TrendingUpIcon
};

const TONES = {
  'KEY MILESTONE': 'text-emerald-600 bg-emerald-50 border-emerald-100',
  ATTENTION: 'text-amber-600 bg-amber-50 border-amber-100',
  TREND: 'text-sky-600 bg-sky-50 border-sky-100'
};

export function SmartDigest({ items }: {items: DigestItem[];}) {
  return (
    <section
      className="rounded-card border p-5"
      style={{ backgroundColor: 'var(--accent-soft)', borderColor: 'var(--accent-border)' }}
      aria-labelledby="smart-digest-title">
      
      <div className="flex items-center gap-2">
        <SparklesIcon className="h-4 w-4 text-[var(--accent)]" />
        <h2 id="smart-digest-title" className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
          Smart digest
        </h2>
      </div>
      <p className="mt-1 text-xs text-slate-600">
        Summarised only from session data the therapist entered. Nothing here is generated or inferred beyond the
        recorded values.
      </p>
      <div className="mt-4">
        {items.length === 0 ?
        <EmptyState
          compact
          icon={SparklesIcon}
          title="No session data available."
          description="A digest appears once sessions with progress values have been documented." /> :


        <ul className="flex flex-col gap-2.5">
            {items.map((item) => {
            const Icon = ICONS[item.kind];
            return (
              <li key={item.kind} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${TONES[item.kind]}`}>
                  
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{item.kind}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-700">{item.text}</p>
                  </div>
                </li>);

          })}
          </ul>
        }
      </div>
    </section>);

}