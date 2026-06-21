import {
  monthSpentFromTransactions,
  monthIncomeFromTransactions,
  spendByCategoryFromTransactions,
} from '../selectors';

const REFERENCE_DATE = new Date('2026-06-15T00:00:00.000Z');

const fixtureTransactions = [
  { transactionType: 'debit', amount: 200, category: 'Groceries', date: '2026-06-01T00:00:00.000Z' },
  { transactionType: 'debit', amount: 300, category: 'Groceries', date: '2026-06-10T00:00:00.000Z' },
  { transactionType: 'debit', amount: 150, category: 'Transport', date: '2026-06-12T00:00:00.000Z' },
  { transactionType: 'credit', amount: 5000, category: 'Salary', date: '2026-06-01T00:00:00.000Z' },
  // Different month — must be excluded from every selector below.
  { transactionType: 'debit', amount: 999, category: 'Groceries', date: '2026-05-20T00:00:00.000Z' },
];

describe('monthSpentFromTransactions', () => {
  it('sums debit amounts within the reference month only', () => {
    expect(monthSpentFromTransactions(fixtureTransactions as any, REFERENCE_DATE)).toBe(650);
  });

  it('returns 0 for an empty list', () => {
    expect(monthSpentFromTransactions([], REFERENCE_DATE)).toBe(0);
  });
});

describe('monthIncomeFromTransactions', () => {
  it('sums credit amounts within the reference month only', () => {
    expect(monthIncomeFromTransactions(fixtureTransactions as any, REFERENCE_DATE)).toBe(5000);
  });

  it('returns 0 for an empty list', () => {
    expect(monthIncomeFromTransactions([], REFERENCE_DATE)).toBe(0);
  });
});

describe('spendByCategoryFromTransactions', () => {
  it('groups debit amounts by category within the reference month', () => {
    const result = spendByCategoryFromTransactions(fixtureTransactions as any, REFERENCE_DATE);
    expect(result).toEqual(
      expect.arrayContaining([
        { label: 'Groceries', value: 500 },
        { label: 'Transport', value: 150 },
      ])
    );
    expect(result).toHaveLength(2);
  });

  it('returns an empty array when there is no spend in the month', () => {
    expect(spendByCategoryFromTransactions([], REFERENCE_DATE)).toEqual([]);
  });
});
