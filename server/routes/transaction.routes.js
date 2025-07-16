const router = require("express").Router;

const TransactionController = require("../controllers/transaction.controller");
const { protect } = require("../middlewares/auth.middleware");

const TransactionRouter = router();

// Protect all transaction routes with authentication middleware
TransactionRouter.use(protect);

TransactionRouter.get("/all", TransactionController.getAllTransactions);

TransactionRouter.get("/user", TransactionController.getTransactionByUser);
TransactionRouter.get(
  "/:id",
  TransactionController.getTransactionById
);
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
