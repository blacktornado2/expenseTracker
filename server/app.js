const express = require("express");

const UserRouter = require("./routes/user.routes");
const TransactionRouter = require("./routes/transaction.routes");

const app = express();

app.use(express.json());

app.use("/user", UserRouter);
app.use("/transaction", TransactionRouter);

module.exports = app;
