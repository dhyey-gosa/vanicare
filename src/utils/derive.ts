import type { TherapySession, TherapyPlan } from '../types';

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function calcAge(dob: string): string {
  if (!dob) return '';
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return '';
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return '';
  if (years === 0) return `${months} mo`;
  return `${years} y ${months} mo`;
}

export function formatDate(value: number | string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Goal labels tracked for a case: the plan's short-term goals. */
export function goalLabels(plan: TherapyPlan | undefined, sessions: TherapySession[]): string[] {
  const fromPlan = plan ? plan.shortTermGoals.filter((g) => g.trim().length > 0) : [];
  const fromSessions = new Set<string>();
  sessions.forEach((s) => Object.keys(s.goalScores).forEach((k) => fromSessions.add(k)));
  const merged = [...fromPlan];
  fromSessions.forEach((k) => {
    if (!merged.includes(k)) merged.push(k);
  });
  return merged;
}

export interface GoalPoint {
  session: number;
  [goal: string]: number | null;
}

export function goalSeries(sessions: TherapySession[], goals: string[]): GoalPoint[] {
  const documented = [...sessions].sort((a, b) => a.number - b.number);
  return documented.map((s) => {
    const point: GoalPoint = { session: s.number };
    goals.forEach((g) => {
      const v = s.goalScores[g];
      point[g] = typeof v === 'number' ? v : null;
    });
    return point;
  });
}

export interface DigestItem {
  kind: 'KEY MILESTONE' | 'ATTENTION' | 'TREND';
  text: string;
}

/** Builds a digest purely from manually entered session data. Returns [] when there is nothing to summarise. */
export function buildDigest(sessions: TherapySession[], goals: string[]): DigestItem[] {
  if (sessions.length === 0) return [];
  const ordered = [...sessions].sort((a, b) => a.number - b.number);
  const items: DigestItem[] = [];

  let bestGoal = '';
  let bestGain = 0;
  let dipGoal = '';
  let dipAmount = 0;
  let dipSession = 0;

  goals.forEach((goal) => {
    const points = ordered.
    map((s) => ({ n: s.number, v: s.goalScores[goal] })).
    filter((p): p is {n: number;v: number;} => typeof p.v === 'number');
    if (points.length < 2) return;
    const gain = points[points.length - 1].v - points[0].v;
    if (gain > bestGain) {
      bestGain = gain;
      bestGoal = goal;
    }
    for (let i = 1; i < points.length; i += 1) {
      const delta = points[i].v - points[i - 1].v;
      if (delta < dipAmount) {
        dipAmount = delta;
        dipGoal = goal;
        dipSession = points[i].n;
      }
    }
  });

  if (bestGoal) {
    items.push({
      kind: 'KEY MILESTONE',
      text: `"${bestGoal}" rose ${bestGain} point${bestGain === 1 ? '' : 's'} on the entered 1–5 scale between the first and latest scored session.`
    });
  }

  const missed = ordered.filter((s) => s.status === 'Missed' || s.status === 'Cancelled');
  if (dipGoal) {
    items.push({
      kind: 'ATTENTION',
      text: `"${dipGoal}" dropped ${Math.abs(dipAmount)} point${Math.abs(dipAmount) === 1 ? '' : 's'} at session ${dipSession} — review the therapist's notes for that session.`
    });
  } else if (missed.length > 0) {
    items.push({
      kind: 'ATTENTION',
      text: `${missed.length} of ${ordered.length} documented session${ordered.length === 1 ? '' : 's'} were recorded as missed or cancelled.`
    });
  }

  const completed = ordered.filter((s) => s.status === 'Completed').length;
  items.push({
    kind: 'TREND',
    text: `${completed} of ${ordered.length} documented session${ordered.length === 1 ? '' : 's'} completed${missed.length > 0 ? `, ${missed.length} missed or cancelled` : ''}. Latest documented session: #${ordered[ordered.length - 1].number}.`
  });

  return items;
}