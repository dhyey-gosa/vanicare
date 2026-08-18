import React from 'react';
import { PlusIcon, TrashIcon } from 'lucide-react';
import { Input } from '../ui/Input';

interface GoalListEditorProps {
  label: string;
  goals: string[];
  onChange: (goals: string[]) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export function GoalListEditor({ label, goals, onChange, placeholder, error, disabled }: GoalListEditorProps) {
  const update = (index: number, value: string) => {
    const next = [...goals];
    next[index] = value;
    onChange(next);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...goals, ''])}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] transition-colors duration-150 ease-out hover:underline disabled:opacity-50">
          
          <PlusIcon className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {goals.map((goal, i) =>
        <div key={i} className="flex items-center gap-2">
            <span className="num w-5 shrink-0 text-xs text-slate-400">{i + 1}</span>
            <Input
            value={goal}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => update(i, e.target.value)}
            aria-label={`${label} ${i + 1}`} />
          
            <button
            type="button"
            disabled={disabled || goals.length === 1}
            onClick={() => onChange(goals.filter((_, idx) => idx !== i))}
            aria-label={`Remove ${label} ${i + 1}`}
            className="rounded-lg p-2 text-slate-400 transition-colors duration-150 ease-out hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400">
            
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
    </div>);

}