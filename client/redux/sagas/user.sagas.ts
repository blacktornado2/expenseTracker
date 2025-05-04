import { call, put, takeLatest } from "redux-saga/effects";
import { fetchUser } from "../../utils/api/requests";
import { fetchUserSuccess, fetchUserFailure } from "../actions/user.actions";

import { FETCH_USER_REQUEST } from "../actions/action.types";

// Worker saga: Handles the side effect
function* fetchUserSaga(action: any) {
  try {
    const user = yield call(fetchUser, action.payload);
    yield put(fetchUserSuccess(user));
  } catch (error) {
    yield put(fetchUserFailure(error as Error)); // Dispatch failure action
  }
}

// Watcher saga: Watches for actions dispatched to the store
export function* watchFetchUser() {
  yield takeLatest(FETCH_USER_REQUEST, fetchUserSaga);
}
