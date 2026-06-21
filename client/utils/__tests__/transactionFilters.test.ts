import { filterTransactions } from '../transactionFilters';

const txns = [
  { transactionType: 'debit' as const, category: 'groceries', description: 'Supermarket' },
  { transactionType: 'credit' as const, category: 'income', description: 'Salary' },
  { transactionType: 'debit' as const, category: 'dining', description: 'Pizza night' },
];

describe('filterTransactions', () => {
  it('returns all when filter is all and query is empty', () => {
    expect(filterTransactions(txns, 'all', '')).toHaveLength(3);
  });

  it('returns only debit when filter is expenses', () => {
    const result = filterTransactions(txns, 'expenses', '');
    expect(result).toHaveLength(2);
    result.forEach((t) => expect(t.transactionType).toBe('debit'));
  });

  it('returns only credit when filter is income', () => {
    const result = filterTransactions(txns, 'income', '');
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('Salary');
  });

  it('filters by description case-insensitively', () => {
    expect(filterTransactions(txns, 'all', 'pizza')).toHaveLength(1);
  });

  it('filters by category case-insensitively', () => {
    expect(filterTransactions(txns, 'all', 'GROCERIES')).toHaveLength(1);
  });

  it('combines type filter and search query', () => {
    const result = filterTransactions(txns, 'expenses', 'night');
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('Pizza night');
  });

  it('returns empty array when nothing matches', () => {
    expect(filterTransactions(txns, 'all', 'zzz')).toHaveLength(0);
  });

  it('trims query whitespace before comparing', () => {
    expect(filterTransactions(txns, 'all', '  salary  ')).toHaveLength(1);
  });

  it('matches a transaction with no description via category', () => {
    const noDesc = [{ transactionType: 'debit' as const, category: 'groceries' }];
    expect(filterTransactions(noDesc, 'all', 'groc')).toHaveLength(1);
  });
});
