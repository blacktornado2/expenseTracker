import { fork } from "redux-saga/effects";
import { watchFetchUser } from "./user.sagas"; // Import your user saga
import {watchTransactionsRequests} from './transaction.sagas';
import { watchBudgetRequests } from './budget.sagas';
import { watchSavingsGoalRequests } from './savingsGoal.sagas';

export function* rootSaga() {
  yield fork(watchFetchUser);
  yield fork(watchTransactionsRequests);
  yield fork(watchBudgetRequests);
  yield fork(watchSavingsGoalRequests);
}
