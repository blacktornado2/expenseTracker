import { call, put, takeLatest } from "redux-saga/effects";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { loginUserService, registerUserService } from "../services/user.service";
import { fetchUser } from "../../utils/api/requests";
import { fetchUserSuccess, fetchUserFailure, loginUserSuccess, loginUserFailure, registerUserSuccess } from "../actions/user.actions";

import { FETCH_USER_REQUEST, LOGIN_USER_REQUEST, REGISTER_USER_REQUEST } from "../actions/action.types";

type LoginPayload = {
  email: string;
  password: string;
};

type LoginAction = {
  type: string;
  payload: LoginPayload;
};

type RegisterUserAction = {
  type: string;
  payload: RegisterUserPayload;
};

type RegisterUserPayload = {
  name: string;
  email: string;
  password: string;
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
  } catch (error: any) {
    yield put(loginUserFailure(error));
  }
}

function* registerUserSaga(action: RegisterUserAction) {
  try {
    const {email, password, name} = action.payload;
    const response = yield registerUserService({ name, email, password});
    if(response.status === 201) {
      return yield put(registerUserSuccess(response.data?.message));
    }
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
  yield takeLatest(REGISTER_USER_REQUEST, registerUserSaga);
}
