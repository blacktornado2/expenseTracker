import { call, put, takeLatest, select } from "redux-saga/effects";
import { getAllTransactionsService, createTransactionService, updateTransactionService, deleteTransactionService } from '../services/transaction.service'
import { userSelector } from "../store/selectors";
import { GET_TRANSACTIONS_REQUEST, CREATE_TRANSACTION_REQUEST, UPDATE_TRANSACTION_REQUEST, DELETE_TRANSACTION_REQUEST } from "../actions/action.types";
import { getAllTransactionsSuccess, createTransactionSuccess, createTransactionFailure, updateTransactionSuccess, updateTransactionFailure, deleteTransactionSuccess, deleteTransactionFailure } from '../actions/transaction.actions'

function* getAllTransactionsSaga() {
    try {
        const {token} = yield select(userSelector);
        const {data} = yield getAllTransactionsService(token)
        yield put(getAllTransactionsSuccess(data));
    } catch (err) {
        console.log('get all transactions saga failed', err);
    }
}

export function* createTransactionSaga(action: any) {
    try {
        const { token } = yield select(userSelector);
        const { data } = yield call(createTransactionService, token, action.payload);
        yield put(createTransactionSuccess(data));
    } catch (err) {
        yield put(createTransactionFailure(err));
    }
}

export function* updateTransactionSaga(action: any) {
  try {
    const { token } = yield select(userSelector);
    const { id, ...payload } = action.payload;
    const { data } = yield call(updateTransactionService, token, id, payload);
    yield put(updateTransactionSuccess(data));
  } catch (err) {
    yield put(updateTransactionFailure(err));
  }
}

export function* deleteTransactionSaga(action: any) {
  try {
    const { token } = yield select(userSelector);
    yield call(deleteTransactionService, token, action.payload.id);
    yield put(deleteTransactionSuccess(action.payload.id));
  } catch (err) {
    yield put(deleteTransactionFailure(err));
  }
}

export function* watchTransactionsRequests() {
    yield takeLatest(GET_TRANSACTIONS_REQUEST, getAllTransactionsSaga);
    yield takeLatest(CREATE_TRANSACTION_REQUEST, createTransactionSaga);
    yield takeLatest(UPDATE_TRANSACTION_REQUEST, updateTransactionSaga);
    yield takeLatest(DELETE_TRANSACTION_REQUEST, deleteTransactionSaga);
}
