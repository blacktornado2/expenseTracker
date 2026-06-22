import {
  GET_SAVINGS_GOAL_REQUEST,
  GET_SAVINGS_GOAL_SUCCESS,
  SET_SAVINGS_GOAL_REQUEST,
  SET_SAVINGS_GOAL_SUCCESS,
  SET_SAVINGS_GOAL_FAILURE,
} from "./action.types";

export const getSavingsGoal = () => ({ type: GET_SAVINGS_GOAL_REQUEST });
export const getSavingsGoalSuccess = (data: { amount: number }) => ({
  type: GET_SAVINGS_GOAL_SUCCESS,
  payload: data,
});

export const setSavingsGoal = (amount: number) => ({ type: SET_SAVINGS_GOAL_REQUEST, payload: { amount } });
export const setSavingsGoalSuccess = (data: { amount: number }) => ({
  type: SET_SAVINGS_GOAL_SUCCESS,
  payload: data,
});
export const setSavingsGoalFailure = (error: any) => ({ type: SET_SAVINGS_GOAL_FAILURE, payload: error });
