import { call, put, takeLatest } from "redux-saga/effects";

import { loginUserService } from "../services/user.service";
import { fetchUser } from "../../utils/api/requests";
import { fetchUserSuccess, fetchUserFailure, loginUserSuccess } from "../actions/user.actions";

import { FETCH_USER_REQUEST, LOGIN_USER_REQUEST } from "../actions/action.types";

type LoginPayload = {
  email: string;
  password: string;
};

type LoginAction = {
  type: string;
  payload: LoginPayload;
};


function* loginUserSaga(action: LoginAction) {
  try {
    const { email, password } = action.payload;
    const { token, user } = yield loginUserService({ email, password });
    // TODO: Save token to localStorage
    yield put(loginUserSuccess(user));
  } catch (error) {
    console.log("error: ", error);
  }
}

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
  yield takeLatest(LOGIN_USER_REQUEST, loginUserSaga);
  yield takeLatest(FETCH_USER_REQUEST, fetchUserSaga);
}
