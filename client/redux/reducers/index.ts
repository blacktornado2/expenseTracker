import { combineReducers } from "redux";

import userReducer from "./user.reducer";
import transactionReducer from "./transaction.reducer";

export const rootReducer = combineReducers({
  user: userReducer,
  transaction: transactionReducer,
});
