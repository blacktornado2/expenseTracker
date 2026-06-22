const express = require("express");

const UserRouter = require("./routes/user.routes");
const TransactionRouter = require("./routes/transaction.routes");
const BudgetRouter = require("./routes/budget.routes");
const SavingsGoalRouter = require("./routes/savingsGoal.routes");

const app = express();

app.use(express.json());

app.use("/api/user", UserRouter);
app.use("/api/transaction", TransactionRouter);
app.use("/api/budget", BudgetRouter);
app.use("/api/savings-goal", SavingsGoalRouter);

app.use((err, req, res, next) => {
  console.error(err.message);
  console.log(req.url);
  return res.status(404).send("Route not found!!!");
});

module.exports = app;
