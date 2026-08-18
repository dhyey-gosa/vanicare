import React from 'react';
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { DomainScore } from '../../types';

interface SlpRadarChartProps {
  domains: Record<string, DomainScore>;
}

const SHORT: Record<string, string> = {
  'Articulation & Phonology': 'Articulation',
  'Fluency & Stuttering': 'Fluency',
  'Receptive & Expressive Language': 'Language',
  'Voice & Resonance': 'Voice',
  'Pragmatics & Social Communication': 'Pragmatics'
};

export function SlpRadarChart({ domains }: SlpRadarChartProps) {
  const data = Object.entries(domains).
  filter(([, v]) => v.applicable).
  map(([key, v]) => ({
    domain: SHORT[key] ?? key,
    Baseline: v.baseline ?? 0,
    Current: v.current ?? 0
  }));

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11, fill: '#475569' }} />
          <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#e2e8f0" />
          <Radar name="Baseline" dataKey="Baseline" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} isAnimationActive={false} />
          <Radar
            name="Current"
            dataKey="Current"
            stroke="var(--accent)"
            fill="var(--accent)"
            fillOpacity={0.28}
            isAnimationActive={false} />
          
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
          
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>);

}