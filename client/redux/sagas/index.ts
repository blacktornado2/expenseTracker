import { fork } from "redux-saga/effects";
import { watchFetchUser } from "./user.sagas"; // Import your user saga

export function* rootSaga() {
  yield fork(watchFetchUser);
}
