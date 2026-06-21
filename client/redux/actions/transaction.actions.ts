import {
  GET_TRANSACTIONS_REQUEST,
  GET_TRANSACTIONS_SUCCESS,
  CREATE_TRANSACTION_REQUEST,
  CREATE_TRANSACTION_SUCCESS,
  CREATE_TRANSACTION_FAILURE,
} from "./action.types";

export const getAllTransactions = () => ({ type: GET_TRANSACTIONS_REQUEST });
export const getAllTransactionsSuccess = (data: any) => ({
  type: GET_TRANSACTIONS_SUCCESS,
  payload: data,
});

export type CreateTransactionPayload = {
  transactionType: 'credit' | 'debit';
  amount: number;
  category: string;
  date: string;
  description?: string;
};

export const createTransaction = (payload: CreateTransactionPayload) => ({
  type: CREATE_TRANSACTION_REQUEST,
  payload,
});

export const createTransactionSuccess = (data: any) => ({
  type: CREATE_TRANSACTION_SUCCESS,
  payload: data,
});

export const createTransactionFailure = (error: any) => ({
  type: CREATE_TRANSACTION_FAILURE,
  payload: error,
});
