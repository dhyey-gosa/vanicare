import React, { useEffect, useRef, useState } from 'react';
import { BellIcon, CheckCheckIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { formatDate } from '../../utils/derive';

/** Header bell with unread badge + dropdown. Data lives in AppContext (backend /api/notifications). */
export function NotificationsBell() {
  const { notifications, markAllNotificationsRead } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 text-white transition-colors duration-150 ease-out hover:bg-white/10">
        <BellIcon className="h-4.5 w-4.5" />
        {unread > 0 &&
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread}
          </span>
        }
      </button>

      {open &&
      <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unread > 0 &&
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline">
              <CheckCheckIcon className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          }
          </div>
          <ul className="flex max-h-80 flex-col divide-y divide-slate-100 overflow-y-auto">
            {notifications.length === 0 &&
          <li className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet.</li>
          }
            {[...notifications]
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((n) =>
          <li key={n.id} className={`flex gap-3 px-4 py-3 ${n.read ? 'opacity-60' : ''}`}>
                    <span
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-slate-200' : 'bg-[var(--accent)]'}`} />
                    <div className="min-w-0">
                      <p className="text-sm leading-snug text-slate-700">{n.text}</p>
                      <p className="num mt-0.5 text-[11px] text-slate-400">{formatDate(n.createdAt)}</p>
                    </div>
                  </li>
          )}
          </ul>
        </div>
      }
    </div>
  );
}