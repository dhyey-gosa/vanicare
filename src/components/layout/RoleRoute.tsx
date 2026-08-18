import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { HOME_FOR } from '../../utils/nav';
import type { Role } from '../../types';

interface RoleRouteProps {
  allow: Role[];
  children: React.ReactNode;
}

export function RoleRoute({ allow, children }: RoleRouteProps) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/" replace />;
  if (!allow.includes(currentUser.role)) return <Navigate to={HOME_FOR[currentUser.role]} replace />;
  return <>{children}</>;
}