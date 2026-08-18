import React, { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';

interface AccordionSectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function AccordionSection({ title, description, defaultOpen = false, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-150 ease-out hover:bg-slate-50">
        
        <span>
          <span className="block text-sm font-semibold text-slate-900">{title}</span>
          {description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ease-out ${
          open ? 'rotate-180' : ''}`
          } />
        
      </button>
      {open && <div className="border-t border-slate-100 px-5 py-5">{children}</div>}
    </div>);

}