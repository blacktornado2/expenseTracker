const router = require("express").Router;

const BudgetController = require("../controllers/budget.controller");
const { protect } = require("../middlewares/auth.middleware");

const BudgetRouter = router();

BudgetRouter.use(protect);

BudgetRouter.get("/", BudgetController.getBudgetsByUser);
BudgetRouter.post("/", BudgetController.createBudget);
BudgetRouter.put("/:id", BudgetController.updateBudget);
BudgetRouter.delete("/:id", BudgetController.deleteBudget);

module.exports = BudgetRouter;
