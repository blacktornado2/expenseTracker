import transactionReducer from '../transaction.reducer';
import { GET_TRANSACTIONS_SUCCESS, CREATE_TRANSACTION_SUCCESS, CREATE_TRANSACTION_FAILURE, UPDATE_TRANSACTION_SUCCESS, UPDATE_TRANSACTION_FAILURE, DELETE_TRANSACTION_SUCCESS, DELETE_TRANSACTION_FAILURE, UPDATE_TRANSACTION_REQUEST, DELETE_TRANSACTION_REQUEST } from '../../actions/action.types';

const emptyBase = { transactions: [] as any[], createError: null, updateError: null, deleteError: null, updatePending: false, deletePending: false };

describe('transactionReducer', () => {
  it('replaces transactions on GET_TRANSACTIONS_SUCCESS', () => {
    const state = { ...emptyBase };
    const next = transactionReducer(state, { type: GET_TRANSACTIONS_SUCCESS, payload: [{ id: 'a' }] });
    expect(next.transactions).toEqual([{ id: 'a' }]);
  });

  it('prepends the new transaction and clears createError on CREATE_TRANSACTION_SUCCESS', () => {
    const state = { ...emptyBase, transactions: [{ id: 'old' }], createError: new Error('previous failure') };
    const next = transactionReducer(state, { type: CREATE_TRANSACTION_SUCCESS, payload: { id: 'new' } });
    expect(next.transactions).toEqual([{ id: 'new' }, { id: 'old' }]);
    expect(next.createError).toBeNull();
  });

  it('stores the error on CREATE_TRANSACTION_FAILURE without touching transactions', () => {
    const state = { ...emptyBase, transactions: [{ id: 'old' }] };
    const error = new Error('failed');
    const next = transactionReducer(state, { type: CREATE_TRANSACTION_FAILURE, payload: error });
    expect(next.transactions).toEqual([{ id: 'old' }]);
    expect(next.createError).toBe(error);
  });
});

describe('transactionReducer — update/delete', () => {
  const base = { transactions: [{ _id: '1', amount: 100 }, { _id: '2', amount: 200 }], createError: null, updateError: null, deleteError: null, updatePending: false, deletePending: false };

  it('sets updatePending=true on UPDATE_TRANSACTION_REQUEST', () => {
    const next = transactionReducer(base, { type: UPDATE_TRANSACTION_REQUEST, payload: {} });
    expect(next.updatePending).toBe(true);
    expect(next.updateError).toBeNull();
  });

  it('updates a transaction in-place and clears updatePending on UPDATE_TRANSACTION_SUCCESS', () => {
    const state = { ...base, updatePending: true };
    const next = transactionReducer(state, { type: UPDATE_TRANSACTION_SUCCESS, payload: { _id: '1', amount: 150 } });
    expect(next.transactions).toEqual([{ _id: '1', amount: 150 }, { _id: '2', amount: 200 }]);
    expect(next.updateError).toBeNull();
    expect(next.updatePending).toBe(false);
  });

  it('stores the error and clears updatePending on UPDATE_TRANSACTION_FAILURE', () => {
    const state = { ...base, updatePending: true };
    const error = new Error('update failed');
    const next = transactionReducer(state, { type: UPDATE_TRANSACTION_FAILURE, payload: error });
    expect(next.transactions).toEqual(base.transactions);
    expect(next.updateError).toBe(error);
    expect(next.updatePending).toBe(false);
  });

  it('sets deletePending=true on DELETE_TRANSACTION_REQUEST', () => {
    const next = transactionReducer(base, { type: DELETE_TRANSACTION_REQUEST, payload: { id: '1' } });
    expect(next.deletePending).toBe(true);
    expect(next.deleteError).toBeNull();
  });

  it('removes the transaction and clears deletePending on DELETE_TRANSACTION_SUCCESS', () => {
    const state = { ...base, deletePending: true };
    const next = transactionReducer(state, { type: DELETE_TRANSACTION_SUCCESS, payload: { id: '1' } });
    expect(next.transactions).toEqual([{ _id: '2', amount: 200 }]);
    expect(next.deleteError).toBeNull();
    expect(next.deletePending).toBe(false);
  });

  it('stores the error and clears deletePending on DELETE_TRANSACTION_FAILURE', () => {
    const state = { ...base, deletePending: true };
    const error = new Error('delete failed');
    const next = transactionReducer(state, { type: DELETE_TRANSACTION_FAILURE, payload: error });
    expect(next.transactions).toEqual(base.transactions);
    expect(next.deleteError).toBe(error);
    expect(next.deletePending).toBe(false);
  });
});
