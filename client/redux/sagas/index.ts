import { fork } from "redux-saga/effects";
import { watchFetchUser } from "./user.sagas"; // Import your user saga

export default function* rootSaga() {
  yield fork(watchFetchUser);
}
