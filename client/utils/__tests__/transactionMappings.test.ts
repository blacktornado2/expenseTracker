import { rawToTxDraft, txDraftToUpdatePayload } from '../transactionMappings';
import type { RawStoreTxn, TxDraft } from '../transactionMappings';

describe('rawToTxDraft', () => {
  it('maps debit to expense entryType', () => {
    const raw: RawStoreTxn = { _id: 'a1', transactionType: 'debit', amount: 500, date: '2026-06-21T00:00:00.000Z', category: 'groceries', description: 'Weekly shop' };
    const draft = rawToTxDraft(raw);
    expect(draft).toEqual({ id: 'a1', entryType: 'expense', name: 'Weekly shop', amountStr: '500', date: '2026-06-21T00:00:00.000Z', category: 'groceries' });
  });

  it('maps credit to income entryType', () => {
    const raw: RawStoreTxn = { _id: 'b2', transactionType: 'credit', amount: 3000, date: '2026-06-01T00:00:00.000Z', category: 'income', description: 'Salary' };
    expect(rawToTxDraft(raw).entryType).toBe('income');
  });

  it('defaults name to empty string when description is missing', () => {
    const raw: RawStoreTxn = { _id: 'c3', transactionType: 'debit', amount: 100, date: '2026-06-01T00:00:00.000Z', category: 'dining' };
    expect(rawToTxDraft(raw).name).toBe('');
  });

  it('stringifies the amount', () => {
    const raw: RawStoreTxn = { _id: 'd4', transactionType: 'debit', amount: 125.5, date: '2026-06-01T00:00:00.000Z', category: 'dining' };
    expect(rawToTxDraft(raw).amountStr).toBe('125.5');
  });
});

describe('txDraftToUpdatePayload', () => {
  it('maps expense to debit transactionType with correct amount and description', () => {
    const draft: TxDraft = { id: 'a1', entryType: 'expense', name: 'Weekly shop', amountStr: '500', date: '2026-06-21T00:00:00.000Z', category: 'groceries' };
    const payload = txDraftToUpdatePayload(draft);
    expect(payload.transactionType).toBe('debit');
    expect(payload.amount).toBe(500);
    expect(payload.description).toBe('Weekly shop');
    expect(payload.category).toBe('groceries');
  });

  it('maps income to credit transactionType', () => {
    const draft: TxDraft = { id: 'b2', entryType: 'income', name: 'Salary', amountStr: '3000', date: '2026-06-01T00:00:00.000Z', category: 'income' };
    expect(txDraftToUpdatePayload(draft).transactionType).toBe('credit');
  });

  it('parses decimal amountStr to float', () => {
    const draft: TxDraft = { id: 'c', entryType: 'expense', name: 'Lunch', amountStr: '125.50', date: '2026-06-21T00:00:00.000Z', category: 'dining' };
    expect(txDraftToUpdatePayload(draft).amount).toBe(125.5);
  });

  it('defaults amount to 0 for empty amountStr', () => {
    const draft: TxDraft = { id: 'd', entryType: 'expense', name: 'Bad', amountStr: '', date: '2026-06-21T00:00:00.000Z', category: 'dining' };
    expect(txDraftToUpdatePayload(draft).amount).toBe(0);
  });
});
