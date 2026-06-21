export type ActivityFilter = 'all' | 'expenses' | 'income';

type Filterable = {
  transactionType: 'credit' | 'debit';
  category: string;
  description?: string;
};

export function filterTransactions<T extends Filterable>(
  transactions: T[],
  filter: ActivityFilter,
  query: string
): T[] {
  const q = query.trim().toLowerCase();
  return transactions.filter((txn) => {
    if (filter === 'expenses' && txn.transactionType !== 'debit') return false;
    if (filter === 'income' && txn.transactionType !== 'credit') return false;
    if (q) {
      const nameMatch = (txn.description ?? '').toLowerCase().includes(q);
      const catMatch = txn.category.toLowerCase().includes(q);
      if (!nameMatch && !catMatch) return false;
    }
    return true;
  });
}
