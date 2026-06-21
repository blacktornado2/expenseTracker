import transactionReducer from '../transaction.reducer';
import { GET_TRANSACTIONS_SUCCESS, CREATE_TRANSACTION_SUCCESS, CREATE_TRANSACTION_FAILURE } from '../../actions/action.types';

describe('transactionReducer', () => {
  it('replaces transactions on GET_TRANSACTIONS_SUCCESS', () => {
    const state = { transactions: [], createError: null };
    const next = transactionReducer(state, { type: GET_TRANSACTIONS_SUCCESS, payload: [{ id: 'a' }] });
    expect(next.transactions).toEqual([{ id: 'a' }]);
  });

  it('prepends the new transaction and clears createError on CREATE_TRANSACTION_SUCCESS', () => {
    const state = { transactions: [{ id: 'old' }], createError: new Error('previous failure') };
    const next = transactionReducer(state, { type: CREATE_TRANSACTION_SUCCESS, payload: { id: 'new' } });
    expect(next.transactions).toEqual([{ id: 'new' }, { id: 'old' }]);
    expect(next.createError).toBeNull();
  });

  it('stores the error on CREATE_TRANSACTION_FAILURE without touching transactions', () => {
    const state = { transactions: [{ id: 'old' }], createError: null };
    const error = new Error('failed');
    const next = transactionReducer(state, { type: CREATE_TRANSACTION_FAILURE, payload: error });
    expect(next.transactions).toEqual([{ id: 'old' }]);
    expect(next.createError).toBe(error);
  });
});
