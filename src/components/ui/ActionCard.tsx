import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon, BoxIcon } from "lucide-react";
interface ActionCardProps {
  to: string;
  step?: string;
  icon: BoxIcon;
  title: string;
  description: string;
  cta: string;
  meta?: React.ReactNode;
  featured?: boolean;
}
export function ActionCard({
  to,
  step,
  icon: Icon,
  title,
  description,
  cta,
  meta,
  featured
}: ActionCardProps) {
  return <Link to={to} className={`group flex flex-col justify-between gap-6 rounded-card border bg-white p-6 shadow-card transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift ${featured ? 'border-[var(--accent-border)]' : 'border-slate-200 hover:border-slate-300'}`}>
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--accent)]" style={{
          backgroundColor: 'var(--accent-soft)'
        }}>
            <Icon className="h-5 w-5" />
          </span>
          {step && <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{step}</span>}
        </div>
        <h3 className={`mt-4 font-semibold text-slate-900 ${featured ? 'text-lg' : 'text-base'}`}>{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>
        {meta && <div className="mt-4">{meta}</div>}
      </div>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)]">
        {cta}
        <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
      </span>
    </Link>;
}