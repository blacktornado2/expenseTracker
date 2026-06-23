import {
  GET_TRANSACTIONS_SUCCESS,
  GET_TRANSACTIONS_FAILURE,
  CREATE_TRANSACTION_REQUEST,
  CREATE_TRANSACTION_SUCCESS,
  CREATE_TRANSACTION_FAILURE,
  UPDATE_TRANSACTION_REQUEST,
  UPDATE_TRANSACTION_SUCCESS,
  UPDATE_TRANSACTION_FAILURE,
  DELETE_TRANSACTION_REQUEST,
  DELETE_TRANSACTION_SUCCESS,
  DELETE_TRANSACTION_FAILURE,
} from '../actions/action.types';

const initialState = {
  transactions: [] as any[],
  getTransactionsError: null as any,
  createError: null as any,
  updateError: null as any,
  deleteError: null as any,
  createPending: false,
  updatePending: false,
  deletePending: false,
};

const transactionReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case GET_TRANSACTIONS_SUCCESS:
      return { ...state, transactions: action.payload, getTransactionsError: null };
    case GET_TRANSACTIONS_FAILURE:
      return { ...state, getTransactionsError: action.payload };
    case CREATE_TRANSACTION_REQUEST:
      return { ...state, createPending: true, createError: null };
    case CREATE_TRANSACTION_SUCCESS:
      return { ...state, transactions: [action.payload, ...state.transactions], createError: null, createPending: false };
    case CREATE_TRANSACTION_FAILURE:
      return { ...state, createError: action.payload, createPending: false };
    case UPDATE_TRANSACTION_REQUEST:
      return { ...state, updatePending: true, updateError: null };
    case UPDATE_TRANSACTION_SUCCESS:
      return {
        ...state,
        updatePending: false,
        updateError: null,
        transactions: state.transactions.map((txn) =>
          txn._id === action.payload._id ? action.payload : txn
        ),
      };
    case UPDATE_TRANSACTION_FAILURE:
      return { ...state, updatePending: false, updateError: action.payload };
    case DELETE_TRANSACTION_REQUEST:
      return { ...state, deletePending: true, deleteError: null };
    case DELETE_TRANSACTION_SUCCESS:
      return {
        ...state,
        deletePending: false,
        deleteError: null,
        transactions: state.transactions.filter((txn) => txn._id !== action.payload.id),
      };
    case DELETE_TRANSACTION_FAILURE:
      return { ...state, deletePending: false, deleteError: action.payload };
    default:
      return state;
  }
};

export default transactionReducer;
