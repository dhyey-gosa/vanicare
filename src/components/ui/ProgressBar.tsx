import React from 'react';

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
}

export function ProgressBar({ label, value, max, unit = 'hours' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round(value / max * 100)) : 0;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="num text-sm text-slate-500">
          {value} / {max} {unit}
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}>
        
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }} />
        
      </div>
    </div>);

}