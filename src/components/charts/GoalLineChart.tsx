import React from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import type { GoalPoint } from '../../utils/derive';

const PALETTE = ['#1f5f8b', '#0d7f79', '#8a5a2b', '#5b4bb8', '#a03d6a', '#3f7d3f'];

interface GoalLineChartProps {
  data: GoalPoint[];
  goals: string[];
  totalSessions: number;
}

export function GoalLineChart({ data, goals, totalSessions }: GoalLineChartProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
          <CartesianGrid stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="session"
            type="number"
            domain={[1, Math.max(totalSessions, 2)]}
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#64748b' }}
            stroke="#cbd5e1"
            label={{ value: 'Session', position: 'insideBottom', offset: -4, fontSize: 11, fill: '#94a3b8' }} />
          
          <YAxis
            domain={[0, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 11, fill: '#64748b' }}
            stroke="#cbd5e1" />
          
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              fontSize: 12,
              boxShadow: '0 8px 24px -12px rgba(15,23,42,0.18)'
            }}
            labelFormatter={(v) => `Session ${v}`} />
          
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          {goals.map((goal, i) =>
          <Line
            key={goal}
            type="monotone"
            dataKey={goal}
            stroke={PALETTE[i % PALETTE.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
            isAnimationActive={false} />

          )}
        </LineChart>
      </ResponsiveContainer>
    </div>);

}