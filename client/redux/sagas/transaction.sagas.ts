import { call, put, takeLatest, select } from "redux-saga/effects";
import { getAllTransactionsService, createTransactionService } from '../services/transaction.service'
import { userSelector } from "../store/selectors";
import { GET_TRANSACTIONS_REQUEST, CREATE_TRANSACTION_REQUEST } from "../actions/action.types";
import { getAllTransactionsSuccess, createTransactionSuccess, createTransactionFailure } from '../actions/transaction.actions'

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

export function* watchTransactionsRequests() {
    yield takeLatest(GET_TRANSACTIONS_REQUEST, getAllTransactionsSaga);
    yield takeLatest(CREATE_TRANSACTION_REQUEST, createTransactionSaga);
}
