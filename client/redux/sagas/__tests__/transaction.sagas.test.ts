import { call, put, select } from 'redux-saga/effects';
import { createTransactionSaga } from '../transaction.sagas';
import { userSelector } from '../../store/selectors';
import { createTransactionService } from '../../services/transaction.service';
import { createTransactionSuccess, createTransactionFailure } from '../../actions/transaction.actions';

describe('createTransactionSaga', () => {
  const action = {
    type: 'CREATE_TRANSACTION_REQUEST',
    payload: { transactionType: 'debit' as const, amount: 100, category: 'groceries', date: '2026-06-21' },
  };

  it('selects the token, calls the service, and puts success on the happy path', () => {
    const gen = createTransactionSaga(action as any);
    expect(gen.next().value).toEqual(select(userSelector));
    expect(gen.next({ token: 'abc' }).value).toEqual(call(createTransactionService, 'abc', action.payload));
    const data = { id: '1' };
    expect(gen.next({ data }).value).toEqual(put(createTransactionSuccess(data)));
    expect(gen.next().done).toBe(true);
  });

  it('puts a failure action when the service call throws', () => {
    const gen = createTransactionSaga(action as any);
    gen.next();
    gen.next({ token: 'abc' });
    const error = new Error('network error');
    expect(gen.throw(error).value).toEqual(put(createTransactionFailure(error)));
  });
});
