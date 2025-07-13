import { fork } from "redux-saga/effects";
import { watchFetchUser } from "./user.sagas"; // Import your user saga
import {watchTransactionsRequests} from './transaction.sagas';

export function* rootSaga() {
  yield fork(watchFetchUser);
  yield fork(watchTransactionsRequests);
}
