import store from './store';

import { UserStateType, Transaction } from '@/types/global';
import { getSeedMonths, type MonthlyDatum } from '@/utils/insightsSeed';

export type StoreRootState = ReturnType<typeof store.getState>;

export const userSelector = (state: StoreRootState): UserStateType => state.user;
export const transactionSelector = (state: StoreRootState): Transaction => state.transaction;

type RawTransaction = {
  transactionType: 'credit' | 'debit';
  amount: number;
  date: string | Date;
  category: string;
  description?: string;
};

function isSameMonth(date: string | Date, reference: Date): boolean {
  const d = new Date(date);
  return d.getUTCFullYear() === reference.getUTCFullYear() && d.getUTCMonth() === reference.getUTCMonth();
}

export function monthSpentFromTransactions(
  transactions: RawTransaction[],
  referenceDate: Date = new Date()
): number {
  return transactions
    .filter((txn) => txn.transactionType === 'debit' && isSameMonth(txn.date, referenceDate))
    .reduce((sum, txn) => sum + txn.amount, 0);
}

export function monthIncomeFromTransactions(
  transactions: RawTransaction[],
  referenceDate: Date = new Date()
): number {
  return transactions
    .filter((txn) => txn.transactionType === 'credit' && isSameMonth(txn.date, referenceDate))
    .reduce((sum, txn) => sum + txn.amount, 0);
}

export function spendByCategoryFromTransactions(
  transactions: RawTransaction[],
  referenceDate: Date = new Date()
): { label: string; value: number }[] {
  const totals = new Map<string, number>();
  transactions
    .filter((txn) => txn.transactionType === 'debit' && isSameMonth(txn.date, referenceDate))
    .forEach((txn) => {
      totals.set(txn.category, (totals.get(txn.category) ?? 0) + txn.amount);
    });
  return Array.from(totals.entries()).map(([label, value]) => ({ label, value }));
}

export const selectMonthSpent = (state: StoreRootState): number =>
  monthSpentFromTransactions(((transactionSelector(state) as any).transactions ?? []) as RawTransaction[]);

export const selectMonthIncome = (state: StoreRootState): number =>
  monthIncomeFromTransactions(((transactionSelector(state) as any).transactions ?? []) as RawTransaction[]);

export const selectSpendByCategory = (state: StoreRootState): { label: string; value: number }[] =>
  spendByCategoryFromTransactions(((transactionSelector(state) as any).transactions ?? []) as RawTransaction[]);

export function buildMonthlyData(transactions: RawTransaction[], referenceDate: Date = new Date()): MonthlyDatum[] {
  const seed = getSeedMonths(referenceDate);
  const catsArr = spendByCategoryFromTransactions(transactions, referenceDate);
  const cats: Record<string, number> = {};
  catsArr.forEach((c) => { cats[c.label] = c.value; });

  const current: MonthlyDatum = {
    month: referenceDate.getUTCMonth(),
    year: referenceDate.getUTCFullYear(),
    spent: monthSpentFromTransactions(transactions, referenceDate),
    income: monthIncomeFromTransactions(transactions, referenceDate),
    cats,
  };

  return [...seed, current];
}

export const selectMonthlyData = (state: StoreRootState): MonthlyDatum[] =>
  buildMonthlyData(((transactionSelector(state) as any).transactions ?? []) as RawTransaction[]);