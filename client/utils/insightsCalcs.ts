import { format } from 'date-fns';
import type { MonthlyDatum } from './insightsSeed';

export type TrendDelta = {
  diff: number;
  direction: 'up' | 'down' | 'same';
};

export function trendDelta(selected: MonthlyDatum, previous?: MonthlyDatum): TrendDelta | null {
  if (!previous) return null;
  const diff = selected.spent - previous.spent;
  if (diff === 0) return { diff: 0, direction: 'same' };
  return { diff: Math.abs(diff), direction: diff > 0 ? 'up' : 'down' };
}

export type CategoryBreakdownRow = {
  label: string;
  value: number;
  pct: number;
};

export function categoryBreakdown(cats: Record<string, number>): CategoryBreakdownRow[] {
  const total = Object.values(cats).reduce((sum, v) => sum + v, 0);
  return Object.entries(cats)
    .map(([label, value]) => ({ label, value, pct: total > 0 ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}

export function monthPillLabel(month: number, year: number): string {
  return format(new Date(year, month, 1), "MMM ''yy");
}

export function monthFullLabel(month: number, year: number): string {
  return format(new Date(year, month, 1), 'MMMM yyyy');
}
