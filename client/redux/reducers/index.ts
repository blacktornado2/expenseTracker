import { combineReducers } from "redux";

import userReducer from "./user.reducer";
import transactionReducer from "./transaction.reducer";
import budgetReducer from "./budget.reducer";
import savingsGoalReducer from "./savingsGoal.reducer";

export const rootReducer = combineReducers({
  user: userReducer,
  transaction: transactionReducer,
  budget: budgetReducer,
  savingsGoal: savingsGoalReducer,
});
