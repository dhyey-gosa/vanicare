import React, { useEffect, useState } from 'react';
import { ClockIcon, HistoryIcon } from 'lucide-react';
import { api } from '../../api/client';
import { useApp } from '../../contexts/AppContext';
import type { CaseEvent } from '../../types';
import { formatDate } from '../../utils/derive';
import { EmptyState } from '../ui/EmptyState';

/**
 * CaseTimeline — the audit trail of a case: registration, allocation, plan
 * revisions, session co-signatures, report submission and outcome.
 * Data comes from the backend's case_events table.
 */
export function CaseTimeline({ caseId, limit }: { caseId: string; limit?: number }) {
  const { users } = useApp();
  const [events, setEvents] = useState<CaseEvent[] | null>(null);

  useEffect(() => {
    let alive = true;
    setEvents(null);
    api
      .fetchEvents(caseId)
      .then((rows) => {
        if (alive) setEvents(rows);
      })
      .catch(() => {
        if (alive) setEvents([]);
      });
    return () => {
      alive = false;
    };
  }, [caseId]);

  const visible = events ? (limit ? events.slice(-limit) : events) : [];

  return (
    <section className="rounded-card border p-5" aria-labelledby="case-timeline-title">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--accent)]" style={{ backgroundColor: 'var(--accent-soft)' }}>
          <HistoryIcon className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 id="case-timeline-title" className="text-base font-semibold text-slate-900">Case timeline</h2>
          <p className="text-sm text-slate-500">Every action on this case, recorded with who and when.</p>
        </div>
      </div>

      <div className="mt-5">
        {!events ?
          <p className="text-sm text-slate-500">Loading timeline…</p> :
          visible.length === 0 ?
          <EmptyState compact icon={HistoryIcon} title="No timeline events yet." description="Actions on this case will appear here." /> :
          <ol className="relative ml-2 flex flex-col gap-4 border-l border-slate-200 pl-5">
            {visible.map((ev) => {
              const actor = users.find((u) => u.id === ev.actorId);
              return (
                <li key={ev.id} className="relative">
                  <span
                    className="absolute -left-[26.5px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white"
                    style={{ backgroundColor: 'var(--accent)' }} />
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{ev.eventType}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <ClockIcon className="h-3 w-3" />
                      {formatDate(ev.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-700">{ev.detail}</p>
                  {actor && <p className="mt-0.5 text-xs font-medium text-slate-500">{actor.name}</p>}
                </li>
              );
            })}
          </ol>
        }
      </div>
    </section>
  );
}