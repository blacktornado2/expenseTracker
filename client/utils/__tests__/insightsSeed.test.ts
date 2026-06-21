import { getSeedMonths } from '../insightsSeed';

describe('getSeedMonths', () => {
  const REFERENCE_DATE = new Date('2026-06-15T00:00:00.000Z');

  it('returns exactly 5 months', () => {
    expect(getSeedMonths(REFERENCE_DATE)).toHaveLength(5);
  });

  it('returns the 5 months immediately before the reference month, oldest first', () => {
    const result = getSeedMonths(REFERENCE_DATE);
    expect(result.map((m) => `${m.year}-${m.month}`)).toEqual([
      '2026-0', // Jan 2026
      '2026-1', // Feb 2026
      '2026-2', // Mar 2026
      '2026-3', // Apr 2026
      '2026-4', // May 2026
    ]);
  });

  it('each month has positive spent, income, and a non-empty cats map', () => {
    const result = getSeedMonths(REFERENCE_DATE);
    result.forEach((m) => {
      expect(m.spent).toBeGreaterThan(0);
      expect(m.income).toBeGreaterThan(0);
      expect(Object.keys(m.cats).length).toBeGreaterThan(0);
    });
  });

  it('rolls over the year boundary correctly', () => {
    const result = getSeedMonths(new Date('2026-02-10T00:00:00.000Z'));
    expect(result.map((m) => `${m.year}-${m.month}`)).toEqual([
      '2025-8',  // Sep 2025
      '2025-9',  // Oct 2025
      '2025-10', // Nov 2025
      '2025-11', // Dec 2025
      '2026-0',  // Jan 2026
    ]);
  });

  it('defaults to the current date when no referenceDate is passed', () => {
    expect(() => getSeedMonths()).not.toThrow();
    expect(getSeedMonths()).toHaveLength(5);
  });
});
