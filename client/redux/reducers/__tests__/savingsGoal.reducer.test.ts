import savingsGoalReducer from '../savingsGoal.reducer';
import {
  GET_SAVINGS_GOAL_SUCCESS,
  SET_SAVINGS_GOAL_REQUEST,
  SET_SAVINGS_GOAL_SUCCESS,
  SET_SAVINGS_GOAL_FAILURE,
} from '../../actions/action.types';

const base = { amount: 0, error: null, pending: false };

describe('savingsGoalReducer', () => {
  it('sets amount on GET_SAVINGS_GOAL_SUCCESS', () => {
    const next = savingsGoalReducer(base, { type: GET_SAVINGS_GOAL_SUCCESS, payload: { amount: 20000 } });
    expect(next.amount).toBe(20000);
  });

  it('sets amount and clears error on SET_SAVINGS_GOAL_SUCCESS', () => {
    const state = { amount: 0, error: new Error('x'), pending: false };
    const next = savingsGoalReducer(state, { type: SET_SAVINGS_GOAL_SUCCESS, payload: { amount: 35000 } });
    expect(next.amount).toBe(35000);
    expect(next.error).toBeNull();
  });

  it('stores the error and keeps amount on SET_SAVINGS_GOAL_FAILURE', () => {
    const state = { amount: 20000, error: null, pending: false };
    const error = new Error('network');
    const next = savingsGoalReducer(state, { type: SET_SAVINGS_GOAL_FAILURE, payload: error });
    expect(next.amount).toBe(20000);
    expect(next.error).toBe(error);
  });

  it('sets pending true and clears error on SET_SAVINGS_GOAL_REQUEST', () => {
    const state = { amount: 20000, error: new Error('stale'), pending: false };
    const next = savingsGoalReducer(state, { type: SET_SAVINGS_GOAL_REQUEST, payload: { amount: 25000 } });
    expect(next.pending).toBe(true);
    expect(next.error).toBeNull();
  });

  it('sets pending false on SET_SAVINGS_GOAL_SUCCESS', () => {
    const state = { amount: 0, error: null, pending: true };
    const next = savingsGoalReducer(state, { type: SET_SAVINGS_GOAL_SUCCESS, payload: { amount: 35000 } });
    expect(next.pending).toBe(false);
  });

  it('sets pending false on SET_SAVINGS_GOAL_FAILURE', () => {
    const state = { amount: 20000, error: null, pending: true };
    const error = new Error('network');
    const next = savingsGoalReducer(state, { type: SET_SAVINGS_GOAL_FAILURE, payload: error });
    expect(next.pending).toBe(false);
    expect(next.error).toBe(error);
  });
});
