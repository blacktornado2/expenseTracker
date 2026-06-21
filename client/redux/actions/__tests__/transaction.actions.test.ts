import { createTransaction, createTransactionSuccess, createTransactionFailure } from '../transaction.actions';
import { CREATE_TRANSACTION_REQUEST, CREATE_TRANSACTION_SUCCESS, CREATE_TRANSACTION_FAILURE } from '../action.types';

describe('transaction action creators', () => {
  it('createTransaction wraps the payload in a CREATE_TRANSACTION_REQUEST action', () => {
    const payload = { transactionType: 'debit' as const, amount: 100, category: 'groceries', date: '2026-06-21' };
    expect(createTransaction(payload)).toEqual({ type: CREATE_TRANSACTION_REQUEST, payload });
  });

  it('createTransactionSuccess wraps data in a CREATE_TRANSACTION_SUCCESS action', () => {
    const data = { id: '1' };
    expect(createTransactionSuccess(data)).toEqual({ type: CREATE_TRANSACTION_SUCCESS, payload: data });
  });

  it('createTransactionFailure wraps the error in a CREATE_TRANSACTION_FAILURE action', () => {
    const error = new Error('failed');
    expect(createTransactionFailure(error)).toEqual({ type: CREATE_TRANSACTION_FAILURE, payload: error });
  });
});
