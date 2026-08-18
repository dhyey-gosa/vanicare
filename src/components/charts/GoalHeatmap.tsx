import React from 'react';
import type { TherapySession } from '../../types';
import { SCALE_LABELS } from '../ui/ScaleInput';

const SCALE_COLORS: Record<number, {bg: string;fg: string;}> = {
  1: { bg: '#eef2f7', fg: '#334155' },
  2: { bg: '#c9dcea', fg: '#1e293b' },
  3: { bg: '#8fb8d4', fg: '#0f172a' },
  4: { bg: '#4f8bb5', fg: '#ffffff' },
  5: { bg: '#1f5f8b', fg: '#ffffff' }
};

interface GoalHeatmapProps {
  goals: string[];
  sessions: TherapySession[];
  totalSessions: number;
}

export function GoalHeatmap({ goals, sessions, totalSessions }: GoalHeatmapProps) {
  const columns = Array.from({ length: Math.max(totalSessions, 1) }, (_, i) => i + 1);
  const byNumber = new Map(sessions.map((s) => [s.number, s]));

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <table className="border-separate border-spacing-1">
          <caption className="sr-only">Manually entered goal progress across sessions</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-white pr-3 text-left text-xs font-semibold text-slate-500">
                Goal
              </th>
              {columns.map((n) =>
              <th key={n} scope="col" className="num w-7 text-center text-[10px] font-medium text-slate-400">
                  {n}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {goals.map((goal) =>
            <tr key={goal}>
                <th
                scope="row"
                className="sticky left-0 z-10 max-w-[180px] truncate bg-white pr-3 text-left text-xs font-medium text-slate-700"
                title={goal}>
                
                  {goal}
                </th>
                {columns.map((n) => {
                const score = byNumber.get(n)?.goalScores[goal];
                const color = typeof score === 'number' ? SCALE_COLORS[score] : null;
                return (
                  <td key={n} className="p-0">
                      <div
                      className="num flex h-7 w-7 items-center justify-center rounded-md border text-[10px] font-semibold"
                      style={
                      color ?
                      { backgroundColor: color.bg, color: color.fg, borderColor: 'transparent' } :
                      { backgroundColor: '#fbfcfd', borderColor: '#e8edf3', color: '#cbd5e1' }
                      }
                      title={
                      typeof score === 'number' ?
                      `${goal} · Session ${n} · ${score} ${SCALE_LABELS[score]}` :
                      `${goal} · Session ${n} · no value entered`
                      }>
                      
                        {typeof score === 'number' ? score : ''}
                      </div>
                    </td>);

              })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-xs text-slate-500">Scale</span>
        {[1, 2, 3, 4, 5].map((n) =>
        <span key={n} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span
            className="h-3.5 w-3.5 rounded-sm"
            style={{ backgroundColor: SCALE_COLORS[n].bg, border: '1px solid #e8edf3' }} />
          
            {n} {SCALE_LABELS[n]}
          </span>
        )}
      </div>
    </div>);

}