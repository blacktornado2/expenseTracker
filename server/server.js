const express = require("express");

const UserRouter = require("./routes/user.routes");
const TransactionRouter = require("./routes/transaction.routes");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use("/user", UserRouter);
app.use("/transaction", TransactionRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
