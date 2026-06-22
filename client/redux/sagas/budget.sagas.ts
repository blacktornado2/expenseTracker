import { call, put, takeLatest, select } from "redux-saga/effects";
import {
  getBudgetsService,
  createBudgetService,
  updateBudgetService,
  deleteBudgetService,
} from '../services/budget.service';
import { userSelector } from "../store/selectors";
import {
  GET_BUDGETS_REQUEST,
  CREATE_BUDGET_REQUEST,
  UPDATE_BUDGET_REQUEST,
  DELETE_BUDGET_REQUEST,
} from "../actions/action.types";
import {
  getBudgetsSuccess,
  createBudgetSuccess,
  createBudgetFailure,
  updateBudgetSuccess,
  updateBudgetFailure,
  deleteBudgetSuccess,
  deleteBudgetFailure,
} from '../actions/budget.actions';

export function* getBudgetsSaga() {
  try {
    const { token } = yield select(userSelector);
    const { data } = yield call(getBudgetsService, token);
    yield put(getBudgetsSuccess(data));
  } catch (err) {
    console.log('get budgets saga failed', err);
  }
}

export function* createBudgetSaga(action: any) {
  try {
    const { token } = yield select(userSelector);
    const { data } = yield call(createBudgetService, token, action.payload);
    yield put(createBudgetSuccess(data));
  } catch (err) {
    yield put(createBudgetFailure(err));
  }
}

export function* updateBudgetSaga(action: any) {
  try {
    const { token } = yield select(userSelector);
    const { id, limit } = action.payload;
    const { data } = yield call(updateBudgetService, token, id, { limit });
    yield put(updateBudgetSuccess(data));
  } catch (err) {
    yield put(updateBudgetFailure(err));
  }
}

export function* deleteBudgetSaga(action: any) {
  try {
    const { token } = yield select(userSelector);
    yield call(deleteBudgetService, token, action.payload.id);
    yield put(deleteBudgetSuccess(action.payload.id));
  } catch (err) {
    yield put(deleteBudgetFailure(err));
  }
}

export function* watchBudgetRequests() {
  yield takeLatest(GET_BUDGETS_REQUEST, getBudgetsSaga);
  yield takeLatest(CREATE_BUDGET_REQUEST, createBudgetSaga);
  yield takeLatest(UPDATE_BUDGET_REQUEST, updateBudgetSaga);
  yield takeLatest(DELETE_BUDGET_REQUEST, deleteBudgetSaga);
}
