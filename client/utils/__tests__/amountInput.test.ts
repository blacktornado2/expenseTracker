// client/utils/__tests__/amountInput.test.ts
import { applyNumpadKey, parseAmount } from '../amountInput';

describe('applyNumpadKey', () => {
  it('appends a digit to an empty string', () => {
    expect(applyNumpadKey('', '5')).toBe('5');
  });

  it('appends a digit to a non-empty string', () => {
    expect(applyNumpadKey('5', '3')).toBe('53');
  });

  it('replaces a leading zero instead of prefixing it', () => {
    expect(applyNumpadKey('0', '5')).toBe('5');
  });

  it('appends a decimal point once', () => {
    expect(applyNumpadKey('5', '.')).toBe('5.');
  });

  it('ignores a second decimal point', () => {
    expect(applyNumpadKey('5.2', '.')).toBe('5.2');
  });

  it('starts a leading decimal from an empty string as 0.', () => {
    expect(applyNumpadKey('', '.')).toBe('0.');
  });

  it('allows up to two decimal digits', () => {
    expect(applyNumpadKey('5.2', '5')).toBe('5.25');
  });

  it('caps at two decimal digits and ignores further digits', () => {
    expect(applyNumpadKey('5.25', '5')).toBe('5.25');
  });

  it('removes the last character on backspace', () => {
    expect(applyNumpadKey('53', 'backspace')).toBe('5');
  });

  it('backspace on an empty string stays empty', () => {
    expect(applyNumpadKey('', 'backspace')).toBe('');
  });
});

describe('parseAmount', () => {
  it('parses a plain numeric string', () => {
    expect(parseAmount('5.25')).toBe(5.25);
  });

  it('returns 0 for an empty string', () => {
    expect(parseAmount('')).toBe(0);
  });

  it('returns 0 for a trailing-decimal string', () => {
    expect(parseAmount('5.')).toBe(5);
  });

  it('returns 0 for a non-numeric string', () => {
    expect(parseAmount('.')).toBe(0);
  });
});
