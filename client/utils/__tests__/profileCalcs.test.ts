import { ageFromDob } from '../profileCalcs';

describe('ageFromDob', () => {
  const NOW = new Date('2026-06-22T00:00:00.000Z');

  it('returns null when dob is missing', () => {
    expect(ageFromDob(undefined, NOW)).toBeNull();
    expect(ageFromDob(null, NOW)).toBeNull();
    expect(ageFromDob('', NOW)).toBeNull();
  });

  it('returns null for an invalid date string', () => {
    expect(ageFromDob('not-a-date', NOW)).toBeNull();
  });

  it('computes whole-year age when the birthday has passed this year', () => {
    expect(ageFromDob('1990-01-01', NOW)).toBe(36);
  });

  it('does not count the current year when the birthday is still upcoming', () => {
    expect(ageFromDob('1990-12-31', NOW)).toBe(35);
  });

  it('counts the birthday itself as the new age', () => {
    expect(ageFromDob('2000-06-22', NOW)).toBe(26);
  });

  it('accepts a Date object', () => {
    expect(ageFromDob(new Date('1996-06-21'), NOW)).toBe(30);
  });

  it('defaults the reference date to now without throwing', () => {
    expect(() => ageFromDob('1990-01-01')).not.toThrow();
  });
});
