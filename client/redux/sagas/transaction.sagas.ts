import { call, put, takeLatest, select } from "redux-saga/effects";
import {getAllTransactionsService} from '../services/transaction.service'
import { userSelector } from "../store/selectors";
import { GET_TRANSACTIONS_REQUEST } from "../actions/action.types";
import {getAllTransactionsSuccess} from '../actions/transaction.actions'

function* getAllTransactionsSaga() {
    try {
        const {token} = yield select(userSelector);
        const {data} = yield getAllTransactionsService(token)
        yield put(getAllTransactionsSuccess(data));
    } catch (err) {
        console.log('get all transactions saga failed', err);
    }
}

export function* watchTransactionsRequests() {
    yield takeLatest(GET_TRANSACTIONS_REQUEST, getAllTransactionsSaga);
}