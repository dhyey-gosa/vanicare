import {
  BarChart3Icon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  FileTextIcon,
  FolderPlusIcon,
  GaugeIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  UsersIcon,
  type LucideIcon } from
'lucide-react';
import type { Role } from '../types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export function navFor(role: Role): NavGroup[] {
  if (role === 'ADMIN') {
    return [
    {
      title: 'Overview',
      items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboardIcon, end: true }]
    },
    {
      title: 'Case intake',
      items: [
      { to: '/admin/patients', label: 'Patients', icon: UserPlusIcon },
      { to: '/admin/cases', label: 'Cases', icon: FolderPlusIcon },
      { to: '/admin/allocation', label: 'Allocation', icon: UsersIcon }]

    },
    {
      title: 'Programme',
      items: [
      { to: '/analytics', label: 'Analytics', icon: BarChart3Icon },
      { to: '/competencies', label: 'Hours & competency', icon: GraduationCapIcon },
      { to: '/closed-cases', label: 'Closed cases', icon: ShieldCheckIcon }]

    }];

  }
  if (role === 'THERAPIST') {
    return [
    {
      title: 'Overview',
      items: [{ to: '/therapist', label: 'Dashboard', icon: LayoutDashboardIcon, end: true }]
    },
    {
      title: 'Clinical work',
      items: [
      { to: '/therapist/plans', label: 'Therapy plans', icon: ClipboardListIcon },
      { to: '/therapist/sessions', label: 'Session documentation', icon: FileTextIcon },
      { to: '/therapist/progress', label: 'Longitudinal progress', icon: LineChartIcon },
      { to: '/therapist/reports', label: 'Progress reports', icon: GaugeIcon }]

    },
    {
      title: 'Training',
      items: [
      { to: '/competencies', label: 'Hours & competency', icon: GraduationCapIcon },
      { to: '/closed-cases', label: 'Closed cases', icon: ShieldCheckIcon }]

    }];

  }
  return [
  {
    title: 'Overview',
    items: [{ to: '/supervisor', label: 'Dashboard', icon: LayoutDashboardIcon, end: true }]
  },
  {
    title: 'Supervision',
    items: [
    { to: '/supervisor/plans', label: 'Plan reviews', icon: ClipboardCheckIcon },
    { to: '/supervisor/reports', label: 'Report evaluations', icon: GaugeIcon },
    { to: '/supervisor/outcomes', label: 'SLP outcomes', icon: LineChartIcon }]

  },
  {
    title: 'Programme',
    items: [
    { to: '/analytics', label: 'Analytics', icon: BarChart3Icon },
    { to: '/competencies', label: 'Hours & competency', icon: GraduationCapIcon },
    { to: '/closed-cases', label: 'Closed cases', icon: ShieldCheckIcon }]

  }];

}

export const HOME_FOR: Record<Role, string> = {
  ADMIN: '/admin',
  THERAPIST: '/therapist',
  SUPERVISOR: '/supervisor'
};