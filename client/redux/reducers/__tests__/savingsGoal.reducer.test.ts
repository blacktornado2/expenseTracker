import savingsGoalReducer from '../savingsGoal.reducer';
import {
  GET_SAVINGS_GOAL_SUCCESS,
  SET_SAVINGS_GOAL_SUCCESS,
  SET_SAVINGS_GOAL_FAILURE,
} from '../../actions/action.types';

const base = { amount: 0, error: null };

describe('savingsGoalReducer', () => {
  it('sets amount on GET_SAVINGS_GOAL_SUCCESS', () => {
    const next = savingsGoalReducer(base, { type: GET_SAVINGS_GOAL_SUCCESS, payload: { amount: 20000 } });
    expect(next.amount).toBe(20000);
  });

  it('sets amount and clears error on SET_SAVINGS_GOAL_SUCCESS', () => {
    const state = { amount: 0, error: new Error('x') };
    const next = savingsGoalReducer(state, { type: SET_SAVINGS_GOAL_SUCCESS, payload: { amount: 35000 } });
    expect(next.amount).toBe(35000);
    expect(next.error).toBeNull();
  });

  it('stores the error and keeps amount on SET_SAVINGS_GOAL_FAILURE', () => {
    const state = { amount: 20000, error: null };
    const error = new Error('network');
    const next = savingsGoalReducer(state, { type: SET_SAVINGS_GOAL_FAILURE, payload: error });
    expect(next.amount).toBe(20000);
    expect(next.error).toBe(error);
  });
});
