import { call, put, takeLatest, select } from "redux-saga/effects";
import { getSavingsGoalService, setSavingsGoalService } from '../services/savingsGoal.service';
import { userSelector } from "../store/selectors";
import { GET_SAVINGS_GOAL_REQUEST, SET_SAVINGS_GOAL_REQUEST } from "../actions/action.types";
import {
  getSavingsGoalSuccess,
  setSavingsGoalSuccess,
  setSavingsGoalFailure,
} from '../actions/savingsGoal.actions';

export function* getSavingsGoalSaga() {
  try {
    const { token } = yield select(userSelector);
    const { data } = yield call(getSavingsGoalService, token);
    yield put(getSavingsGoalSuccess(data));
  } catch (err) {
    console.log('get savings goal saga failed', err);
  }
}

export function* setSavingsGoalSaga(action: any) {
  try {
    const { token } = yield select(userSelector);
    const { data } = yield call(setSavingsGoalService, token, action.payload.amount);
    yield put(setSavingsGoalSuccess(data));
  } catch (err) {
    yield put(setSavingsGoalFailure(err));
  }
}

export function* watchSavingsGoalRequests() {
  yield takeLatest(GET_SAVINGS_GOAL_REQUEST, getSavingsGoalSaga);
  yield takeLatest(SET_SAVINGS_GOAL_REQUEST, setSavingsGoalSaga);
}
