import { trendDelta, categoryBreakdown, monthPillLabel, monthFullLabel } from '../insightsCalcs';
import type { MonthlyDatum } from '../insightsSeed';

const month = (overrides: Partial<MonthlyDatum>): MonthlyDatum => ({
  month: 5,
  year: 2026,
  spent: 0,
  income: 0,
  cats: {},
  ...overrides,
});

describe('trendDelta', () => {
  it('returns null when there is no previous month', () => {
    expect(trendDelta(month({ spent: 1000 }), undefined)).toBeNull();
  });

  it('returns direction "up" with the absolute diff when spend increased', () => {
    expect(trendDelta(month({ spent: 1500 }), month({ spent: 1000 }))).toEqual({ diff: 500, direction: 'up' });
  });

  it('returns direction "down" with the absolute diff when spend decreased', () => {
    expect(trendDelta(month({ spent: 800 }), month({ spent: 1000 }))).toEqual({ diff: 200, direction: 'down' });
  });

  it('returns direction "same" with diff 0 when spend is unchanged', () => {
    expect(trendDelta(month({ spent: 1000 }), month({ spent: 1000 }))).toEqual({ diff: 0, direction: 'same' });
  });
});

describe('categoryBreakdown', () => {
  it('sorts categories highest to lowest by value', () => {
    const result = categoryBreakdown({ groceries: 200, dining: 500, transport: 100 });
    expect(result.map((r) => r.label)).toEqual(['dining', 'groceries', 'transport']);
  });

  it('computes percentage of total for each row', () => {
    const result = categoryBreakdown({ groceries: 300, dining: 100 });
    expect(result).toEqual([
      { label: 'groceries', value: 300, pct: 75 },
      { label: 'dining', value: 100, pct: 25 },
    ]);
  });

  it('returns an empty array for an empty cats map', () => {
    expect(categoryBreakdown({})).toEqual([]);
  });

  it('returns 0 pct for every row when total is 0', () => {
    expect(categoryBreakdown({ groceries: 0 })).toEqual([{ label: 'groceries', value: 0, pct: 0 }]);
  });
});

describe('monthPillLabel', () => {
  it('formats as abbreviated month + 2-digit year', () => {
    expect(monthPillLabel(2, 2026)).toBe("Mar '26");
  });

  it('formats December correctly', () => {
    expect(monthPillLabel(11, 2025)).toBe("Dec '25");
  });
});

describe('monthFullLabel', () => {
  it('formats as full month name + 4-digit year', () => {
    expect(monthFullLabel(2, 2026)).toBe('March 2026');
  });
});
