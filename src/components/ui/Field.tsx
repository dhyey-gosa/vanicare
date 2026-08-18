import React from 'react';

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, hint, error, required, children, className = '' }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {children}
      {error ?
      <p className="text-xs font-medium text-rose-600">{error}</p> :
      hint ?
      <p className="text-xs text-slate-500">{hint}</p> :
      null}
    </div>);

}

export const controlClass =
'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 ease-out focus:border-[var(--accent)] focus:outline-none disabled:bg-slate-50 disabled:text-slate-400';