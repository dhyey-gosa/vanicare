import React from 'react';
import { SLP_DOMAINS, type DomainScore } from '../../types';
import { ScaleInput } from '../ui/ScaleInput';

interface DomainScoreEditorProps {
  domains: Record<string, DomainScore>;
  onChange: (domains: Record<string, DomainScore>) => void;
  disabled?: boolean;
}

export function DomainScoreEditor({ domains, onChange, disabled }: DomainScoreEditorProps) {
  const patch = (domain: string, next: Partial<DomainScore>) =>
  onChange({ ...domains, [domain]: { ...domains[domain], ...next } });

  return (
    <div className="flex flex-col gap-3">
      {SLP_DOMAINS.map((domain) => {
        const value = domains[domain];
        return (
          <div key={domain} className="rounded-xl border border-slate-200 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-slate-900">{domain}</h4>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={!value.applicable}
                  onChange={(e) =>
                  patch(domain, e.target.checked ? { applicable: false, baseline: null, current: null } : { applicable: true })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-[var(--accent)] focus:ring-[var(--accent)]" />
                
                Not applicable
              </label>
            </div>
            {value.applicable &&
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">Baseline score</p>
                  <ScaleInput
                  name={`${domain} baseline`}
                  value={value.baseline}
                  disabled={disabled}
                  onChange={(v) => patch(domain, { baseline: v })} />
                
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">Current score</p>
                  <ScaleInput
                  name={`${domain} current`}
                  value={value.current}
                  disabled={disabled}
                  onChange={(v) => patch(domain, { current: v })} />
                
                </div>
              </div>
            }
          </div>);

      })}
    </div>);

}

export function emptyDomains(): Record<string, DomainScore> {
  return SLP_DOMAINS.reduce<Record<string, DomainScore>>((acc, domain) => {
    acc[domain] = { applicable: true, baseline: null, current: null };
    return acc;
  }, {});
}