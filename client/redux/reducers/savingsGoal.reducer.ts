import {
  GET_SAVINGS_GOAL_SUCCESS,
  SET_SAVINGS_GOAL_SUCCESS,
  SET_SAVINGS_GOAL_FAILURE,
} from '../actions/action.types';

const initialState = {
  amount: 0,
  error: null as any,
};

const savingsGoalReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case GET_SAVINGS_GOAL_SUCCESS:
      return { ...state, amount: action.payload.amount };
    case SET_SAVINGS_GOAL_SUCCESS:
      return { ...state, amount: action.payload.amount, error: null };
    case SET_SAVINGS_GOAL_FAILURE:
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export default savingsGoalReducer;
