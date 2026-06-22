import {
  GET_BUDGETS_SUCCESS,
  CREATE_BUDGET_SUCCESS,
  CREATE_BUDGET_FAILURE,
  UPDATE_BUDGET_SUCCESS,
  UPDATE_BUDGET_FAILURE,
  DELETE_BUDGET_SUCCESS,
  DELETE_BUDGET_FAILURE,
} from '../actions/action.types';

const initialState = {
  budgets: [] as any[],
  createError: null as any,
  updateError: null as any,
  deleteError: null as any,
};

const budgetReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case GET_BUDGETS_SUCCESS:
      return { ...state, budgets: action.payload };
    case CREATE_BUDGET_SUCCESS:
      return { ...state, budgets: [...state.budgets, action.payload], createError: null };
    case CREATE_BUDGET_FAILURE:
      return { ...state, createError: action.payload };
    case UPDATE_BUDGET_SUCCESS:
      return {
        ...state,
        updateError: null,
        budgets: state.budgets.map((b) => (b._id === action.payload._id ? action.payload : b)),
      };
    case UPDATE_BUDGET_FAILURE:
      return { ...state, updateError: action.payload };
    case DELETE_BUDGET_SUCCESS:
      return { ...state, deleteError: null, budgets: state.budgets.filter((b) => b._id !== action.payload.id) };
    case DELETE_BUDGET_FAILURE:
      return { ...state, deleteError: action.payload };
    default:
      return state;
  }
};

export default budgetReducer;
