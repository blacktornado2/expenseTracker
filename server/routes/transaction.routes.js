const TransactionController = require("../controllers/transaction.controller");
const router = require("express").Router;

const TransactionRouter = router();

TransactionRouter.get(
  "/:transactionId",
  TransactionController.getTransactionById
);
TransactionRouter.get("/all", TransactionController.getAllTransactions);
TransactionRouter.post("/", TransactionController.createTransaction);
TransactionRouter.put(
  "/:transactionId",
  TransactionController.updateTransaction
);
TransactionRouter.delete(
  "/:transactionId",
  TransactionController.deleteTransaction
);

module.exports = TransactionRouter;
