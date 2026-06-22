import { call, put, select } from 'redux-saga/effects';
import { setSavingsGoalSaga } from '../savingsGoal.sagas';
import { userSelector } from '../../store/selectors';
import { setSavingsGoalService } from '../../services/savingsGoal.service';
import { setSavingsGoalSuccess, setSavingsGoalFailure } from '../../actions/savingsGoal.actions';

describe('setSavingsGoalSaga', () => {
  const action = { type: 'SET_SAVINGS_GOAL_REQUEST', payload: { amount: 35000 } };

  it('selects token, calls service, puts success on happy path', () => {
    const gen = setSavingsGoalSaga(action as any);
    expect(gen.next().value).toEqual(select(userSelector));
    expect(gen.next({ token: 'abc' }).value).toEqual(call(setSavingsGoalService, 'abc', 35000));
    const data = { amount: 35000 };
    expect(gen.next({ data }).value).toEqual(put(setSavingsGoalSuccess(data)));
    expect(gen.next().done).toBe(true);
  });

  it('puts a failure action when the service throws', () => {
    const gen = setSavingsGoalSaga(action as any);
    gen.next();
    gen.next({ token: 'abc' });
    const error = new Error('network');
    expect(gen.throw(error).value).toEqual(put(setSavingsGoalFailure(error)));
  });
});
