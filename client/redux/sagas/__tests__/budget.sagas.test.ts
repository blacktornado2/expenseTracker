import { call, put, select } from 'redux-saga/effects';
import { createBudgetSaga } from '../budget.sagas';
import { userSelector } from '../../store/selectors';
import { createBudgetService } from '../../services/budget.service';
import { createBudgetSuccess, createBudgetFailure } from '../../actions/budget.actions';

describe('createBudgetSaga', () => {
  const action = { type: 'CREATE_BUDGET_REQUEST', payload: { category: 'fuel', limit: 3000 } };

  it('selects token, calls service, puts success on happy path', () => {
    const gen = createBudgetSaga(action as any);
    expect(gen.next().value).toEqual(select(userSelector));
    expect(gen.next({ token: 'abc' }).value).toEqual(call(createBudgetService, 'abc', action.payload));
    const data = { _id: '1', category: 'fuel', limit: 3000 };
    expect(gen.next({ data }).value).toEqual(put(createBudgetSuccess(data)));
    expect(gen.next().done).toBe(true);
  });

  it('puts a failure action when the service throws', () => {
    const gen = createBudgetSaga(action as any);
    gen.next();
    gen.next({ token: 'abc' });
    const error = new Error('dup');
    expect(gen.throw(error).value).toEqual(put(createBudgetFailure(error)));
  });
});
