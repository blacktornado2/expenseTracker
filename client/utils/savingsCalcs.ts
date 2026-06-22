export function savingsAmount(income: number, spent: number): number {
  return income - spent;
}

export function savingsRate(saved: number, income: number): number {
  if (income <= 0) return 0;
  return (saved / income) * 100;
}

export function expensesBarWidthPct(spent: number, income: number): number {
  if (income <= 0) return 0;
  return Math.max(0, Math.min(100, (spent / income) * 100));
}

export function goalProgressPct(saved: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.max(0, Math.min(100, (saved / goal) * 100));
}

export function amountToGoal(saved: number, goal: number): number {
  return Math.max(0, goal - saved);
}

export function isGoalReached(saved: number, goal: number): boolean {
  return goal > 0 && saved >= goal;
}

export type SavingsTrend = {
  diff: number;
  direction: 'up' | 'down' | 'same';
};

export function savingsTrend(current: number, previous?: number): SavingsTrend | null {
  if (previous === undefined) return null;
  const diff = current - previous;
  if (diff === 0) return { diff: 0, direction: 'same' };
  return { diff: Math.abs(diff), direction: diff > 0 ? 'up' : 'down' };
}

export const SAVE_ERROR_MESSAGE = "Couldn't save — check your connection and try again.";

export type SaveOutcome = 'close' | 'error' | 'noop';

/**
 * Decides what a save-goal (or similar pending-tracked) attempt should do once
 * redux state settles, based on the pending flag's true -> false transition
 * rather than on whether any particular value changed. Value-equality is the
 * wrong signal: a retry that saves the same value as before would otherwise
 * never resolve, leaving the UI stuck in edit mode.
 */
export function resolveSaveOutcome(wasPending: boolean, isPending: boolean, hasError: boolean): SaveOutcome {
  if (!wasPending || isPending) return 'noop';
  return hasError ? 'error' : 'close';
}
