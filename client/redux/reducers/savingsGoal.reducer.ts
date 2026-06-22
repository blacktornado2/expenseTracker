import {
  GET_SAVINGS_GOAL_SUCCESS,
  SET_SAVINGS_GOAL_REQUEST,
  SET_SAVINGS_GOAL_SUCCESS,
  SET_SAVINGS_GOAL_FAILURE,
} from '../actions/action.types';

const initialState = {
  amount: 0,
  error: null as any,
  pending: false,
};

const savingsGoalReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case GET_SAVINGS_GOAL_SUCCESS:
      return { ...state, amount: action.payload.amount };
    case SET_SAVINGS_GOAL_REQUEST:
      return { ...state, pending: true, error: null };
    case SET_SAVINGS_GOAL_SUCCESS:
      return { ...state, amount: action.payload.amount, error: null, pending: false };
    case SET_SAVINGS_GOAL_FAILURE:
      return { ...state, error: action.payload, pending: false };
    default:
      return state;
  }
};

export default savingsGoalReducer;
