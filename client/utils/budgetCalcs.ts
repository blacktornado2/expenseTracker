import type { Budget } from '@/contexts/BudgetsContext';

export function ringPercent(spent: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.max(0, (spent / limit) * 100));
}

export function isOverBudget(spent: number, limit: number): boolean {
  return limit > 0 && spent > limit;
}

export type BudgetSegment = {
  label: string;
  color: string;
  spent: number;
  limit: number;
  percent: number;
};

export function totalConsumedStats(
  budgets: Budget[],
  spendByCategory: { label: string; value: number }[],
  getCategoryColor: (cat: string) => string
): { totalSpent: number; totalLimit: number; segments: BudgetSegment[] } {
  const spendMap = new Map(spendByCategory.map((s) => [s.label, s.value]));
  const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
  const segments: BudgetSegment[] = budgets.map((b) => {
    const spent = spendMap.get(b.cat) ?? 0;
    const percent = totalLimit > 0 ? (b.limit / totalLimit) * 100 : 0;
    return { label: b.cat, color: getCategoryColor(b.cat), spent, limit: b.limit, percent };
  });
  const totalSpent = segments.reduce((sum, s) => sum + s.spent, 0);
  return { totalSpent, totalLimit, segments };
}
