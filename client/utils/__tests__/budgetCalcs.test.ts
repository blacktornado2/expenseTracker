import { ringPercent, isOverBudget, totalConsumedStats } from '../budgetCalcs';
import type { Budget } from '@/contexts/BudgetsContext';

describe('ringPercent', () => {
  it('returns 0 for zero limit', () => {
    expect(ringPercent(100, 0)).toBe(0);
  });
  it('returns exact percent when under limit', () => {
    expect(ringPercent(50, 200)).toBe(25);
  });
  it('returns 100 when at the limit', () => {
    expect(ringPercent(200, 200)).toBe(100);
  });
  it('clamps to 100 when over limit', () => {
    expect(ringPercent(300, 200)).toBe(100);
  });
  it('returns 0 for zero spend', () => {
    expect(ringPercent(0, 200)).toBe(0);
  });
});

describe('isOverBudget', () => {
  it('returns false when under limit', () => {
    expect(isOverBudget(50, 100)).toBe(false);
  });
  it('returns false at exactly the limit', () => {
    expect(isOverBudget(100, 100)).toBe(false);
  });
  it('returns true when over limit', () => {
    expect(isOverBudget(101, 100)).toBe(true);
  });
  it('returns false for zero limit', () => {
    expect(isOverBudget(50, 0)).toBe(false);
  });
});

describe('totalConsumedStats', () => {
  const budgets: Budget[] = [
    { cat: 'groceries', limit: 3000 },
    { cat: 'dining', limit: 1000 },
  ];
  const spendByCategory = [
    { label: 'groceries', value: 1500 },
    { label: 'dining', value: 1200 },
  ];
  const getColor = (cat: string) => (cat === 'groceries' ? '#2FB872' : '#FF6B5E');

  it('sums totalLimit across all budgets', () => {
    const { totalLimit } = totalConsumedStats(budgets, spendByCategory, getColor);
    expect(totalLimit).toBe(4000);
  });
  it('sums totalSpent from matching spend entries', () => {
    const { totalSpent } = totalConsumedStats(budgets, spendByCategory, getColor);
    expect(totalSpent).toBe(2700);
  });
  it('defaults spent to 0 for categories with no spend entry', () => {
    const { segments } = totalConsumedStats(
      [{ cat: 'dining', limit: 500 }],
      [],
      getColor
    );
    expect(segments[0].spent).toBe(0);
  });
  it('assigns each segment its share of the total limit as percent', () => {
    const { segments } = totalConsumedStats(budgets, spendByCategory, getColor);
    expect(segments[0].percent).toBe(75); // 3000/4000 * 100
    expect(segments[1].percent).toBe(25); // 1000/4000 * 100
  });
  it('assigns correct color via getCategoryColor', () => {
    const { segments } = totalConsumedStats(budgets, spendByCategory, getColor);
    expect(segments[0].color).toBe('#2FB872');
    expect(segments[1].color).toBe('#FF6B5E');
  });
  it('returns empty segments and zero totals when budgets is empty', () => {
    const { totalLimit, totalSpent, segments } = totalConsumedStats([], [], getColor);
    expect(totalLimit).toBe(0);
    expect(totalSpent).toBe(0);
    expect(segments).toHaveLength(0);
  });
  it('matches spend to a budget category regardless of case or stray whitespace', () => {
    const { segments } = totalConsumedStats(
      [{ cat: 'Entertainment', limit: 1000 }],
      [{ label: ' entertainment ', value: 250 }],
      getColor
    );
    expect(segments[0].spent).toBe(250);
  });
});
