import { call, put, select, takeLatest } from "redux-saga/effects";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { loginUserService, registerUserService, updateUserService, getUserProfileService } from "../services/user.service";
import {
  fetchUserSuccess,
  fetchUserFailure,
  loginUserSuccess,
  loginUserFailure,
  registerUserSuccess,
  updateUserSuccess,
  updateUserFailure,
  logoutUserSuccess,
} from "../actions/user.actions";
import { userSelector } from "../store/selectors";
import { normalizeServerUser } from "../../utils/profileMappings";

import {
  FETCH_USER_REQUEST,
  LOGIN_USER_REQUEST,
  REGISTER_USER_REQUEST,
  UPDATE_USER_REQUEST,
  LOGOUT_USER_REQUEST,
} from "../actions/action.types";

type LoginPayload = { email: string; password: string };
type LoginAction = { type: string; payload: LoginPayload };
type RegisterUserPayload = { name: string; email: string; password: string };
type RegisterUserAction = { type: string; payload: RegisterUserPayload };

const persistSession = async (token: string, user: unknown) => {
  await AsyncStorage.multiSet([
    ['JWT_TOKEN', token],
    ['USER', JSON.stringify(user ?? null)],
  ]);
};

function* loginUserSaga(action: LoginAction) {
  try {
    const { email, password } = action.payload;
    const { token, user } = yield loginUserService({ email, password });
    yield persistSession(token, user);
    yield put(loginUserSuccess(user, token));
  } catch (error: any) {
    yield put(loginUserFailure(error));
  }
}

function* registerUserSaga(action: RegisterUserAction) {
  try {
    const { email, password, name } = action.payload;
    const response = yield registerUserService({ name, email, password });
    if (response.status === 201) {
      return yield put(registerUserSuccess(response.data?.message));
    }
  } catch (error) {
    console.log("error: ", error);
  }
}

export function* fetchUserSaga(action: any) {
  try {
    const { token } = yield select(userSelector);
    const { data } = yield call(getUserProfileService, token, action.payload);
    yield put(fetchUserSuccess(normalizeServerUser(data)));
  } catch (error) {
    yield put(fetchUserFailure(error as Error));
  }
}

export function* updateUserSaga(action: any) {
  try {
    const { token } = yield select(userSelector);
    const { email, ...payload } = action.payload;
    const { data } = yield call(updateUserService, token, email, payload);
    yield put(updateUserSuccess(normalizeServerUser(data.user)));
  } catch (error) {
    yield put(updateUserFailure(error as Error));
  }
}

export function* logoutUserSaga() {
  try {
    yield call([AsyncStorage, 'multiRemove'], ['JWT_TOKEN', 'USER']);
  } catch (error) {
    console.log("logout cleanup failed", error);
  }
  yield put(logoutUserSuccess());
}

export function* watchFetchUser() {
  yield takeLatest(LOGIN_USER_REQUEST, loginUserSaga);
  yield takeLatest(FETCH_USER_REQUEST, fetchUserSaga);
  yield takeLatest(REGISTER_USER_REQUEST, registerUserSaga);
  yield takeLatest(UPDATE_USER_REQUEST, updateUserSaga);
  yield takeLatest(LOGOUT_USER_REQUEST, logoutUserSaga);
}
