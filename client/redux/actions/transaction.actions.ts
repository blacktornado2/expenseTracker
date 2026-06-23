import {
  GET_TRANSACTIONS_REQUEST,
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
} from "./action.types";

export const getAllTransactions = () => ({ type: GET_TRANSACTIONS_REQUEST });
export const getAllTransactionsSuccess = (data: any) => ({
  type: GET_TRANSACTIONS_SUCCESS,
  payload: data,
});

export const getAllTransactionsFailure = (error: any) => ({
  type: GET_TRANSACTIONS_FAILURE,
  payload: error,
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

export type UpdateTransactionPayload = {
  id: string;
  transactionType: 'credit' | 'debit';
  amount: number;
  category: string;
  date: string;
  description: string;
};

export const updateTransaction = (payload: UpdateTransactionPayload) => ({
  type: UPDATE_TRANSACTION_REQUEST,
  payload,
});

export const updateTransactionSuccess = (data: any) => ({
  type: UPDATE_TRANSACTION_SUCCESS,
  payload: data,
});

export const updateTransactionFailure = (error: any) => ({
  type: UPDATE_TRANSACTION_FAILURE,
  payload: error,
});

export const deleteTransaction = (id: string) => ({
  type: DELETE_TRANSACTION_REQUEST,
  payload: { id },
});

export const deleteTransactionSuccess = (id: string) => ({
  type: DELETE_TRANSACTION_SUCCESS,
  payload: { id },
});

export const deleteTransactionFailure = (error: any) => ({
  type: DELETE_TRANSACTION_FAILURE,
  payload: error,
});
