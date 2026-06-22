import budgetReducer from '../budget.reducer';
import {
  GET_BUDGETS_SUCCESS,
  CREATE_BUDGET_SUCCESS,
  CREATE_BUDGET_FAILURE,
  UPDATE_BUDGET_SUCCESS,
  DELETE_BUDGET_SUCCESS,
} from '../../actions/action.types';

const base = { budgets: [] as any[], createError: null, updateError: null, deleteError: null };

describe('budgetReducer', () => {
  it('replaces budgets on GET_BUDGETS_SUCCESS', () => {
    const next = budgetReducer(base, { type: GET_BUDGETS_SUCCESS, payload: [{ _id: 'a', category: 'fuel', limit: 100 }] });
    expect(next.budgets).toEqual([{ _id: 'a', category: 'fuel', limit: 100 }]);
  });

  it('appends a budget and clears createError on CREATE_BUDGET_SUCCESS', () => {
    const state = { ...base, budgets: [{ _id: 'a', category: 'fuel', limit: 100 }], createError: new Error('x') };
    const next = budgetReducer(state, { type: CREATE_BUDGET_SUCCESS, payload: { _id: 'b', category: 'food', limit: 200 } });
    expect(next.budgets).toHaveLength(2);
    expect(next.budgets[1]).toEqual({ _id: 'b', category: 'food', limit: 200 });
    expect(next.createError).toBeNull();
  });

  it('stores the error on CREATE_BUDGET_FAILURE without touching budgets', () => {
    const state = { ...base, budgets: [{ _id: 'a', category: 'fuel', limit: 100 }] };
    const error = new Error('dup');
    const next = budgetReducer(state, { type: CREATE_BUDGET_FAILURE, payload: error });
    expect(next.budgets).toHaveLength(1);
    expect(next.createError).toBe(error);
  });

  it('replaces a budget in place on UPDATE_BUDGET_SUCCESS', () => {
    const state = { ...base, budgets: [{ _id: 'a', category: 'fuel', limit: 100 }] };
    const next = budgetReducer(state, { type: UPDATE_BUDGET_SUCCESS, payload: { _id: 'a', category: 'fuel', limit: 250 } });
    expect(next.budgets).toEqual([{ _id: 'a', category: 'fuel', limit: 250 }]);
  });

  it('removes a budget on DELETE_BUDGET_SUCCESS', () => {
    const state = { ...base, budgets: [{ _id: 'a', category: 'fuel', limit: 100 }, { _id: 'b', category: 'food', limit: 200 }] };
    const next = budgetReducer(state, { type: DELETE_BUDGET_SUCCESS, payload: { id: 'a' } });
    expect(next.budgets).toEqual([{ _id: 'b', category: 'food', limit: 200 }]);
  });
});
