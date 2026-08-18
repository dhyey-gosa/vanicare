import React from 'react';

const TONES: Record<string, string> = {
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  review: 'bg-sky-50 text-sky-700 border-sky-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  changes: 'bg-orange-50 text-orange-700 border-orange-200',
  active: 'bg-teal-50 text-teal-700 border-teal-200',
  closed: 'bg-slate-800 text-white border-slate-800',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200'
};

function toneFor(label: string): string {
  const key = label.toUpperCase();
  if (key.includes('AWAITING') || key.includes('PENDING')) return 'pending';
  if (key.includes('UNDER REVIEW') || key.includes('REVIEW')) return 'review';
  if (key.includes('APPROVED') || key.includes('COMPLETED') || key.includes('COMPETENT') || key.includes('EVALUATED'))
  return 'approved';
  if (key.includes('CHANGES')) return 'changes';
  if (key.includes('ACTIVE') || key.includes('IN PROGRESS')) return 'active';
  if (key.includes('DISCONTINUED') || key.includes('MISSED')) return 'danger';
  if (key.includes('CLOSED')) return 'closed';
  if (key === 'HIGH') return 'high';
  if (key === 'MEDIUM') return 'medium';
  if (key === 'LOW') return 'low';
  return 'neutral';
}

interface BadgeProps {
  label: string;
  tone?: keyof typeof TONES;
  className?: string;
}

export function Badge({ label, tone, className = '' }: BadgeProps) {
  const resolved = TONES[tone ?? toneFor(label)] ?? TONES.neutral;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${resolved} ${className}`}>
      
      {label}
    </span>);

}