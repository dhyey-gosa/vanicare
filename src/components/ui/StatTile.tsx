import React from 'react';

interface StatTileProps {
  label: string;
  value: number | string;
  empty?: string;
  emphasis?: boolean;
}

export function StatTile({ label, value, empty, emphasis }: StatTileProps) {
  const isEmpty = value === 0 || value === '' || value === null;
  return (
    <div className="flex flex-col gap-1 px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      {isEmpty && empty ?
      <p className="text-sm text-slate-400">{empty}</p> :

      <p
        className={`num font-display leading-none ${emphasis ? 'text-3xl text-[var(--accent)]' : 'text-2xl text-slate-900'}`}>
        
          {value}
        </p>
      }
    </div>);

}