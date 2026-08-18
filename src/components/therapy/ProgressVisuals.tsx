import React from 'react';
import { LineChartIcon, TableIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { GoalHeatmap } from '../charts/GoalHeatmap';
import { GoalLineChart } from '../charts/GoalLineChart';
import { goalLabels, goalSeries } from '../../utils/derive';

export function ProgressVisuals({ caseId }: {caseId: string;}) {
  const { planForCase, sessionsForCase } = useApp();
  const plan = planForCase(caseId);
  const sessions = sessionsForCase(caseId);
  const goals = goalLabels(plan, sessions);
  const scored = sessions.filter((s) => Object.keys(s.goalScores).length > 0);
  const data = goalSeries(scored, goals);
  const totalSessions = plan?.totalSessions ?? 40;

  return (
    <div className="flex flex-col gap-4">
      <Card as="section" className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">Goal mastery over time</h2>
          <p className="num text-xs text-slate-500">
            {scored.length} of {totalSessions} sessions scored
          </p>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Manually entered goal values plotted across the session lifecycle (scale 1–5).
        </p>
        <div className="mt-4">
          {goals.length === 0 || data.length === 0 ?
          <EmptyState
            icon={LineChartIcon}
            title="No outcome data entered yet."
            description="Score short-term goals while documenting a session to build this chart." /> :


          <GoalLineChart data={data} goals={goals} totalSessions={totalSessions} />
          }
        </div>
      </Card>

      <Card as="section" className="p-5">
        <h2 className="text-base font-semibold text-slate-900">Goal progress heatmap</h2>
        <p className="mt-1 text-sm text-slate-500">
          Each cell is a value the therapist entered for that goal in that session. Empty cells were not scored.
        </p>
        <div className="mt-4">
          {goals.length === 0 || scored.length === 0 ?
          <EmptyState icon={TableIcon} title="No session data available." /> :

          <GoalHeatmap goals={goals} sessions={scored} totalSessions={totalSessions} />
          }
        </div>
      </Card>
    </div>);

}