import {
  GET_BUDGETS_REQUEST,
  GET_BUDGETS_SUCCESS,
  CREATE_BUDGET_REQUEST,
  CREATE_BUDGET_SUCCESS,
  CREATE_BUDGET_FAILURE,
  UPDATE_BUDGET_REQUEST,
  UPDATE_BUDGET_SUCCESS,
  UPDATE_BUDGET_FAILURE,
  DELETE_BUDGET_REQUEST,
  DELETE_BUDGET_SUCCESS,
  DELETE_BUDGET_FAILURE,
} from "./action.types";

export type CreateBudgetPayload = { category: string; limit: number };
export type UpdateBudgetPayload = { id: string; limit: number };

export const getBudgets = () => ({ type: GET_BUDGETS_REQUEST });
export const getBudgetsSuccess = (data: any) => ({ type: GET_BUDGETS_SUCCESS, payload: data });

export const createBudget = (payload: CreateBudgetPayload) => ({ type: CREATE_BUDGET_REQUEST, payload });
export const createBudgetSuccess = (data: any) => ({ type: CREATE_BUDGET_SUCCESS, payload: data });
export const createBudgetFailure = (error: any) => ({ type: CREATE_BUDGET_FAILURE, payload: error });

export const updateBudget = (payload: UpdateBudgetPayload) => ({ type: UPDATE_BUDGET_REQUEST, payload });
export const updateBudgetSuccess = (data: any) => ({ type: UPDATE_BUDGET_SUCCESS, payload: data });
export const updateBudgetFailure = (error: any) => ({ type: UPDATE_BUDGET_FAILURE, payload: error });

export const deleteBudget = (id: string) => ({ type: DELETE_BUDGET_REQUEST, payload: { id } });
export const deleteBudgetSuccess = (id: string) => ({ type: DELETE_BUDGET_SUCCESS, payload: { id } });
export const deleteBudgetFailure = (error: any) => ({ type: DELETE_BUDGET_FAILURE, payload: error });
