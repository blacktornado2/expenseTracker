import {
  savingsAmount,
  savingsRate,
  expensesBarWidthPct,
  goalProgressPct,
  amountToGoal,
  isGoalReached,
  savingsTrend,
  resolveSaveOutcome,
} from '../savingsCalcs';

describe('savingsAmount', () => {
  it('returns income minus spent', () => {
    expect(savingsAmount(5000, 3000)).toBe(2000);
  });

  it('can be negative when spent exceeds income', () => {
    expect(savingsAmount(1000, 1500)).toBe(-500);
  });
});

describe('savingsRate', () => {
  it('returns saved as a percent of income', () => {
    expect(savingsRate(2000, 8000)).toBe(25);
  });

  it('returns 0 when income is 0', () => {
    expect(savingsRate(0, 0)).toBe(0);
  });

  it('returns 0 when income is negative', () => {
    expect(savingsRate(100, -50)).toBe(0);
  });
});

describe('expensesBarWidthPct', () => {
  it('returns spent as a percent of income', () => {
    expect(expensesBarWidthPct(3000, 8000)).toBe(37.5);
  });

  it('clamps to 100 when spent exceeds income', () => {
    expect(expensesBarWidthPct(9000, 8000)).toBe(100);
  });

  it('returns 0 when income is 0', () => {
    expect(expensesBarWidthPct(500, 0)).toBe(0);
  });
});

describe('goalProgressPct', () => {
  it('returns saved as a percent of goal', () => {
    expect(goalProgressPct(2500, 10000)).toBe(25);
  });

  it('clamps to 100 when saved exceeds goal', () => {
    expect(goalProgressPct(12000, 10000)).toBe(100);
  });

  it('returns 0 when goal is 0', () => {
    expect(goalProgressPct(2500, 0)).toBe(0);
  });

  it('returns 0 when saved is negative', () => {
    expect(goalProgressPct(-500, 10000)).toBe(0);
  });
});

describe('amountToGoal', () => {
  it('returns the remaining amount needed to hit the goal', () => {
    expect(amountToGoal(6000, 10000)).toBe(4000);
  });

  it('returns 0 when saved meets or exceeds the goal', () => {
    expect(amountToGoal(10000, 10000)).toBe(0);
    expect(amountToGoal(12000, 10000)).toBe(0);
  });
});

describe('isGoalReached', () => {
  it('returns true when saved meets the goal', () => {
    expect(isGoalReached(10000, 10000)).toBe(true);
  });

  it('returns true when saved exceeds the goal', () => {
    expect(isGoalReached(12000, 10000)).toBe(true);
  });

  it('returns false when saved is below the goal', () => {
    expect(isGoalReached(8000, 10000)).toBe(false);
  });

  it('returns false when goal is 0 or unset', () => {
    expect(isGoalReached(8000, 0)).toBe(false);
  });
});

describe('savingsTrend', () => {
  it('returns null when there is no previous value', () => {
    expect(savingsTrend(1000, undefined)).toBeNull();
  });

  it('returns direction "up" with the absolute diff when saved increased', () => {
    expect(savingsTrend(1500, 1000)).toEqual({ diff: 500, direction: 'up' });
  });

  it('returns direction "down" with the absolute diff when saved decreased', () => {
    expect(savingsTrend(800, 1000)).toEqual({ diff: 200, direction: 'down' });
  });

  it('returns direction "same" with diff 0 when saved is unchanged', () => {
    expect(savingsTrend(1000, 1000)).toEqual({ diff: 0, direction: 'same' });
  });
});

describe('resolveSaveOutcome', () => {
  it('returns "noop" when there was no in-flight save (wasPending false)', () => {
    expect(resolveSaveOutcome(false, false, false)).toBe('noop');
  });

  it('returns "noop" while still pending, even if wasPending was true', () => {
    expect(resolveSaveOutcome(true, true, false)).toBe('noop');
  });

  it('returns "close" on a pending -> not-pending transition with no error', () => {
    expect(resolveSaveOutcome(true, false, false)).toBe('close');
  });

  it('returns "error" on a pending -> not-pending transition with an error', () => {
    expect(resolveSaveOutcome(true, false, true)).toBe('error');
  });

  it('returns "close" even when the saved value is identical to the prior value', () => {
    // Regression for the bug where value-equality (not the pending flag) was
    // used to decide resolution: a retry saving the same amount must still
    // resolve and close edit mode, since pending correctly flips true -> false
    // regardless of whether the underlying value changed.
    expect(resolveSaveOutcome(true, false, false)).toBe('close');
  });
});
