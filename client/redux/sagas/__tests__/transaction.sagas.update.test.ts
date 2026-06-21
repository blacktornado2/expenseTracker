import { call, put, select } from 'redux-saga/effects';
import { updateTransactionSaga, deleteTransactionSaga } from '../transaction.sagas';
import { userSelector } from '../../store/selectors';
import { updateTransactionService, deleteTransactionService } from '../../services/transaction.service';
import {
  updateTransactionSuccess,
  updateTransactionFailure,
  deleteTransactionSuccess,
  deleteTransactionFailure,
} from '../../actions/transaction.actions';

describe('updateTransactionSaga', () => {
  const action = {
    type: 'UPDATE_TRANSACTION_REQUEST',
    payload: { id: '123', transactionType: 'debit' as const, amount: 150, category: 'groceries', date: '2026-06-21', description: 'Updated' },
  };

  it('selects token, calls update service with id + rest of payload, puts success', () => {
    const gen = updateTransactionSaga(action);
    expect(gen.next().value).toEqual(select(userSelector));
    const { id, ...payload } = action.payload;
    expect(gen.next({ token: 'abc' }).value).toEqual(call(updateTransactionService, 'abc', id, payload));
    const body = { message: 'Transaction updated successfully', transaction: { _id: '123', amount: 150 } };
    expect(gen.next({ data: body }).value).toEqual(put(updateTransactionSuccess(body.transaction)));
    expect(gen.next().done).toBe(true);
  });

  it('puts failure when service throws', () => {
    const gen = updateTransactionSaga(action);
    gen.next();
    gen.next({ token: 'abc' });
    const error = new Error('network error');
    expect(gen.throw(error).value).toEqual(put(updateTransactionFailure(error)));
  });
});

describe('deleteTransactionSaga', () => {
  const action = { type: 'DELETE_TRANSACTION_REQUEST', payload: { id: '123' } };

  it('selects token, calls delete service with id, puts success with the id', () => {
    const gen = deleteTransactionSaga(action);
    expect(gen.next().value).toEqual(select(userSelector));
    expect(gen.next({ token: 'abc' }).value).toEqual(call(deleteTransactionService, 'abc', '123'));
    expect(gen.next({ data: {} }).value).toEqual(put(deleteTransactionSuccess('123')));
    expect(gen.next().done).toBe(true);
  });

  it('puts failure when service throws', () => {
    const gen = deleteTransactionSaga(action);
    gen.next();
    gen.next({ token: 'abc' });
    const error = new Error('network error');
    expect(gen.throw(error).value).toEqual(put(deleteTransactionFailure(error)));
  });
});
