import { GET_TRANSACTIONS_REQUEST, GET_TRANSACTIONS_FAILURE, GET_TRANSACTIONS_SUCCESS } from "./action.types";

export const getAllTransactions = () => ({type: GET_TRANSACTIONS_REQUEST});
export const getAllTransactionsSuccess = (data: any) => ({
    type: GET_TRANSACTIONS_SUCCESS,
    payload: data,
})