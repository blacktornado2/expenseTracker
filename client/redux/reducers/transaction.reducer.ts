import {GET_TRANSACTIONS_SUCCESS} from '../actions/action.types'

const initialState = {
    transactions: [],
};

const transactionReducer = (state = initialState, action: any) => {
    switch(action.type) {
        case GET_TRANSACTIONS_SUCCESS:
            return {...state, transactions: action.payload}
        default:
            return state;
    }
};

export default transactionReducer;
