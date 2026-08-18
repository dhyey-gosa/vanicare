import React from 'react';

interface PageHeaderProps {
  breadcrumb?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ breadcrumb, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumb &&
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{breadcrumb}</p>
        }
        <h1 className="font-display text-2xl leading-tight text-slate-900 sm:text-[28px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>);

}