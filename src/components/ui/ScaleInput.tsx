import React from 'react';

export const SCALE_LABELS: Record<number, string> = {
  1: 'Beginning',
  2: 'Emerging',
  3: 'Developing',
  4: 'Progressing',
  5: 'Strong'
};

interface ScaleInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  name: string;
  disabled?: boolean;
  max?: number;
  labels?: Record<number, string>;
}

export function ScaleInput({ value, onChange, name, disabled, max = 5, labels = SCALE_LABELS }: ScaleInputProps) {
  const options = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-1.5">
      {options.map((n) => {
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            title={labels[n]}
            onClick={() => onChange(active ? null : n)}
            className={`num h-9 min-w-[2.25rem] rounded-lg border px-2 text-sm font-semibold transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${
            active ?
            'border-[var(--accent)] bg-[var(--accent)] text-white' :
            'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`
            }>
            
            {n}
          </button>);

      })}
      <span className="ml-1 self-center text-xs text-slate-500">{value ? labels[value] : 'Not entered'}</span>
    </div>);

}