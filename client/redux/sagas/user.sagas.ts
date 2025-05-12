import { call, put, takeLatest } from "redux-saga/effects";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { loginUserService } from "../services/user.service";
import { fetchUser } from "../../utils/api/requests";
import { fetchUserSuccess, fetchUserFailure, loginUserSuccess, loginUserFailure } from "../actions/user.actions";

import { FETCH_USER_REQUEST, LOGIN_USER_REQUEST } from "../actions/action.types";

type LoginPayload = {
  email: string;
  password: string;
};

type LoginAction = {
  type: string;
  payload: LoginPayload;
};

const setLoginToken = async (token: string) => {
  await AsyncStorage.setItem('JWT_TOKEN', token);
}

function* loginUserSaga(action: LoginAction) {
  try {
    const { email, password } = action.payload;
    const { token, user } = yield loginUserService({ email, password });
    yield setLoginToken(token);
    yield put(loginUserSuccess(user));
  } catch (error: Error) {
    console.log("error: ", error);
    yield put(loginUserFailure(error));
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
