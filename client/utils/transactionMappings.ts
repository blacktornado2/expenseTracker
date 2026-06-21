export type RawStoreTxn = {
  _id: string;
  transactionType: 'credit' | 'debit';
  amount: number;
  date: string;
  category: string;
  description?: string;
};

export type TxDraft = {
  id: string;
  entryType: 'expense' | 'income';
  name: string;
  amountStr: string;
  date: string;
  category: string;
};

export type UpdatePayload = {
  transactionType: 'credit' | 'debit';
  amount: number;
  category: string;
  date: string;
  description: string;
};

export function rawToTxDraft(txn: RawStoreTxn): TxDraft {
  return {
    id: txn._id,
    entryType: txn.transactionType === 'credit' ? 'income' : 'expense',
    name: txn.description ?? '',
    amountStr: String(txn.amount),
    date: txn.date,
    category: txn.category,
  };
}

export function txDraftToUpdatePayload(draft: TxDraft): UpdatePayload {
  return {
    transactionType: draft.entryType === 'income' ? 'credit' : 'debit',
    amount: parseFloat(draft.amountStr) || 0,
    category: draft.category,
    date: draft.date,
    description: draft.name,
  };
}
