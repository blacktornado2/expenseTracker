import { GET_TRANSACTIONS_SUCCESS, CREATE_TRANSACTION_SUCCESS, CREATE_TRANSACTION_FAILURE } from '../actions/action.types'

const initialState = {
    transactions: [],
    createError: null,
};

const transactionReducer = (state = initialState, action: any) => {
    switch(action.type) {
        case GET_TRANSACTIONS_SUCCESS:
            return {...state, transactions: action.payload}
        case CREATE_TRANSACTION_SUCCESS:
            return {...state, transactions: [action.payload, ...state.transactions], createError: null}
        case CREATE_TRANSACTION_FAILURE:
            return {...state, createError: action.payload}
        default:
            return state;
    }
};

export default transactionReducer;
