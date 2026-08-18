import React from 'react';
import { NavLink } from 'react-router-dom';
import type { NavGroup } from '../../utils/nav';

interface SidebarProps {
  groups: NavGroup[];
  onNavigate?: () => void;
}

export function Sidebar({ groups, onNavigate }: SidebarProps) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-7 px-4 py-6">
      {groups.map((group) =>
      <div key={group.title}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {group.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) =>
          <li key={item.to}>
                <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 ease-out ${
              isActive ?
              'bg-[var(--accent-soft)] font-semibold text-[var(--accent)]' :
              'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`

              }>
              
                  {({ isActive }) =>
              <>
                      <item.icon className={`h-4 w-4 shrink-0 ${isActive ? '' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </>
              }
                </NavLink>
              </li>
          )}
          </ul>
        </div>
      )}
    </nav>);

}