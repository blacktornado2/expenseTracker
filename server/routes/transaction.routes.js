const TransactionController = require("../controllers/transaction.controller");
const router = require("express").Router;

const TransactionRouter = router();
TransactionRouter.get("/all", TransactionController.getAllTransactions);
TransactionRouter.get(
  "/:id",
  TransactionController.getTransactionById
);
TransactionRouter.get("/user/:userId", TransactionController.getTransactionByUser);
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
