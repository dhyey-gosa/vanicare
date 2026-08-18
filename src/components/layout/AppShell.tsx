import React, { useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ActivityIcon, LogOutIcon, MenuIcon, XIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Sidebar } from './Sidebar';
import { NotificationsBell } from './NotificationsBell';
import { navFor } from '../../utils/nav';
import { ROLE_LABEL, ROLE_THEMES, themeVars } from '../../utils/theme';

export function AppShell() {
  const { currentUser, logout } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentUser) return <Navigate to="/" replace state={{ from: location.pathname }} />;

  const groups = navFor(currentUser.role);
  const theme = ROLE_THEMES[currentUser.role];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={themeVars(currentUser.role)} className="flex min-h-full w-full flex-col bg-[#f6f7f9]">
      <header
        className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 px-4 sm:px-6"
        style={{ backgroundColor: theme.accent }}>
        
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="-ml-1 rounded-lg p-2 text-white/80 transition-colors duration-150 ease-out hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu">
            
            <MenuIcon className="h-5 w-5" />
          </button>
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white">
              <ActivityIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-[15px] leading-tight text-white">VaniCare</span>
              <span className="block truncate text-[11px] leading-tight text-white/70">{theme.label}</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <NotificationsBell />
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-medium leading-tight text-white">{currentUser.name}</p>
            <p className="text-[11px] leading-tight text-white/70">{ROLE_LABEL[currentUser.role]}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/25 px-3 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-white/10">
            
            <LogOutIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
          <div className="sticky top-16">
            <Sidebar groups={groups} />
          </div>
        </aside>

        <AnimatePresence>
          {menuOpen &&
          <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div
              className="absolute inset-0 bg-slate-900/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              onClick={() => setMenuOpen(false)} />
            
              <motion.div
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-white"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}>
              
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <span className="font-display text-base text-slate-900">Navigation</span>
                  <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors duration-150 ease-out hover:bg-slate-100">
                  
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
                <Sidebar groups={groups} onNavigate={() => setMenuOpen(false)} />
              </motion.div>
            </div>
          }
        </AnimatePresence>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>);

}