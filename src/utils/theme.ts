import type { CSSProperties } from 'react';
import type { Role } from '../types';

export interface RoleTheme {
  label: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentBorder: string;
  chart: string[];
}

export const ROLE_THEMES: Record<Role, RoleTheme> = {
  ADMIN: {
    label: 'Administration',
    accent: '#1f3a5f',
    accentStrong: '#152b47',
    accentSoft: '#eef2f7',
    accentBorder: '#c3d0e0',
    chart: ['#1f3a5f', '#4b7ba8', '#7ea6c9', '#b3cadd']
  },
  THERAPIST: {
    label: 'Clinical Practice',
    accent: '#0d7f79',
    accentStrong: '#0a6560',
    accentSoft: '#eaf6f5',
    accentBorder: '#b3ddda',
    chart: ['#0d7f79', '#3aa39c', '#6fc0ba', '#a6dcd8']
  },
  SUPERVISOR: {
    label: 'Clinical Supervision',
    accent: '#4b46b8',
    accentStrong: '#3a3596',
    accentSoft: '#f0effb',
    accentBorder: '#c9c6ee',
    chart: ['#4b46b8', '#7a75d0', '#a6a2e2', '#cdcbf0']
  }
};

export function themeVars(role: Role | null): CSSProperties {
  const theme = role ? ROLE_THEMES[role] : ROLE_THEMES.ADMIN;
  return {
    '--accent': theme.accent,
    '--accent-strong': theme.accentStrong,
    '--accent-soft': theme.accentSoft,
    '--accent-border': theme.accentBorder
  } as CSSProperties;
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Admin',
  THERAPIST: 'Student Therapist',
  SUPERVISOR: 'Supervisor'
};