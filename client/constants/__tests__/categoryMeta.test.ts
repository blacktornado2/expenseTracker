import { getCategoryMeta, CATEGORY_META } from '../categoryMeta';

describe('getCategoryMeta', () => {
  it('returns the known meta for a design-vocabulary category, case-insensitively', () => {
    expect(getCategoryMeta('Groceries')).toBe(CATEGORY_META.groceries);
    expect(getCategoryMeta('groceries')).toBe(CATEGORY_META.groceries);
  });

  it('trims whitespace before matching', () => {
    expect(getCategoryMeta('  Bills  ')).toBe(CATEGORY_META.bills);
  });

  it('returns a stable fallback for an unknown category', () => {
    const first = getCategoryMeta('fuel');
    const second = getCategoryMeta('fuel');
    expect(first).toEqual(second);
    expect(first.color).toBeDefined();
    expect(first.softBg).toBeDefined();
    expect(first.Icon).toBeDefined();
  });

  it('returns different fallbacks for different unknown categories when possible', () => {
    const fuel = getCategoryMeta('fuel');
    const loan = getCategoryMeta('loan');
    // Not guaranteed distinct for every pair, but these two specific strings
    // hash to different buckets in the 4-color fallback palette.
    expect(fuel).not.toBe(loan);
  });
});
