export type NumpadKeyValue =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '.'
  | 'backspace';

export function applyNumpadKey(current: string, key: NumpadKeyValue): string {
  if (key === 'backspace') {
    return current.slice(0, -1);
  }

  if (key === '.') {
    if (current.includes('.')) {
      return current;
    }
    return current === '' ? '0.' : `${current}.`;
  }

  if (current.includes('.')) {
    const decimals = current.split('.')[1];
    if (decimals.length >= 2) {
      return current;
    }
  }

  if (current === '0') {
    return key;
  }

  return `${current}${key}`;
}

export function parseAmount(value: string): number {
  if (!value || value === '.') {
    return 0;
  }
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
