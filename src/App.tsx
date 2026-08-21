import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider, useApp } from './contexts/AppContext';
import { AppShell } from './components/layout/AppShell';
import { RoleRoute } from './components/layout/RoleRoute';
import { Auth } from './pages/Auth';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PatientsPage } from './pages/admin/PatientsPage';
import { CasesPage } from './pages/admin/CasesPage';
import { AllocationPage } from './pages/admin/AllocationPage';
import { TherapistDashboard } from './pages/therapist/TherapistDashboard';
import { TherapyPlansPage } from './pages/therapist/TherapyPlansPage';
import { SessionsPage } from './pages/therapist/SessionsPage';
import { ProgressPage } from './pages/therapist/ProgressPage';
import { ReportsPage } from './pages/therapist/ReportsPage';
import { SupervisorDashboard } from './pages/supervisor/SupervisorDashboard';
import { PlanReviewsPage } from './pages/supervisor/PlanReviewsPage';
import { ReportEvaluationsPage } from './pages/supervisor/ReportEvaluationsPage';
import { OutcomesPage } from './pages/supervisor/OutcomesPage';
import { AnalyticsPage } from './pages/shared/AnalyticsPage';
import { CompetenciesPage } from './pages/shared/CompetenciesPage';
import { ClosedCasesPage } from './pages/shared/ClosedCasesPage';
import { HOME_FOR } from './utils/nav';

const DEMO_PASSWORD = 'vanicare123';

function DemoSigningIn() {
  return (
    <div className="flex min-h-full w-full items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
        <p className="text-sm">Signing in to the demo account…</p>
      </div>
    </div>
  );
}

function Landing() {
  const { currentUser, bootstrapping, login } = useApp();
  const [demoAttempted, setDemoAttempted] = React.useState(false);
  const [demoFailed, setDemoFailed] = React.useState(false);
  const demoEmail = React.useMemo(
    () => new URLSearchParams(window.location.search).get('demo'),
    []
  );

  React.useEffect(() => {
    if (bootstrapping || currentUser || !demoEmail || demoAttempted) return;
    setDemoAttempted(true);
    login(demoEmail, DEMO_PASSWORD).then((result) => {
      if (!result.ok) setDemoFailed(true);
    });
  }, [bootstrapping, currentUser, demoEmail, demoAttempted, login]);

  if (bootstrapping) return null;
  if (currentUser) return <Navigate to={HOME_FOR[currentUser.role]} replace />;
  if (demoEmail && !demoFailed) return <DemoSigningIn />;
  return <Auth />;
}

export function App() {
  return (
    <AppProvider>
      <BrowserRouter basename="/app">
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<AppShell />}>
            <Route
              path="/admin"
              element={
              <RoleRoute allow={['ADMIN']}>
                  <AdminDashboard />
                </RoleRoute>
              } />
            
            <Route
              path="/admin/patients"
              element={
              <RoleRoute allow={['ADMIN']}>
                  <PatientsPage />
                </RoleRoute>
              } />
            
            <Route
              path="/admin/cases"
              element={
              <RoleRoute allow={['ADMIN']}>
                  <CasesPage />
                </RoleRoute>
              } />
            
            <Route
              path="/admin/allocation"
              element={
              <RoleRoute allow={['ADMIN']}>
                  <AllocationPage />
                </RoleRoute>
              } />
            

            <Route
              path="/therapist"
              element={
              <RoleRoute allow={['THERAPIST']}>
                  <TherapistDashboard />
                </RoleRoute>
              } />
            
            <Route
              path="/therapist/plans"
              element={
              <RoleRoute allow={['THERAPIST']}>
                  <TherapyPlansPage />
                </RoleRoute>
              } />
            
            <Route
              path="/therapist/sessions"
              element={
              <RoleRoute allow={['THERAPIST']}>
                  <SessionsPage />
                </RoleRoute>
              } />
            
            <Route
              path="/therapist/progress"
              element={
              <RoleRoute allow={['THERAPIST']}>
                  <ProgressPage />
                </RoleRoute>
              } />
            
            <Route
              path="/therapist/reports"
              element={
              <RoleRoute allow={['THERAPIST']}>
                  <ReportsPage />
                </RoleRoute>
              } />
            

            <Route
              path="/supervisor"
              element={
              <RoleRoute allow={['SUPERVISOR']}>
                  <SupervisorDashboard />
                </RoleRoute>
              } />
            
            <Route
              path="/supervisor/plans"
              element={
              <RoleRoute allow={['SUPERVISOR']}>
                  <PlanReviewsPage />
                </RoleRoute>
              } />
            
            <Route
              path="/supervisor/reports"
              element={
              <RoleRoute allow={['SUPERVISOR']}>
                  <ReportEvaluationsPage />
                </RoleRoute>
              } />
            
            <Route
              path="/supervisor/outcomes"
              element={
              <RoleRoute allow={['SUPERVISOR']}>
                  <OutcomesPage />
                </RoleRoute>
              } />
            

            <Route
              path="/analytics"
              element={
              <RoleRoute allow={['ADMIN', 'SUPERVISOR']}>
                  <AnalyticsPage />
                </RoleRoute>
              } />
            
            <Route
              path="/competencies"
              element={
              <RoleRoute allow={['ADMIN', 'THERAPIST', 'SUPERVISOR']}>
                  <CompetenciesPage />
                </RoleRoute>
              } />
            
            <Route
              path="/closed-cases"
              element={
              <RoleRoute allow={['ADMIN', 'THERAPIST', 'SUPERVISOR']}>
                  <ClosedCasesPage />
                </RoleRoute>
              } />
            
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>);

}