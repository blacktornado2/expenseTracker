const router = require("express").Router;

const SavingsGoalController = require("../controllers/savingsGoal.controller");
const { protect } = require("../middlewares/auth.middleware");

const SavingsGoalRouter = router();

SavingsGoalRouter.use(protect);

SavingsGoalRouter.get("/", SavingsGoalController.getSavingsGoal);
SavingsGoalRouter.put("/", SavingsGoalController.upsertSavingsGoal);

module.exports = SavingsGoalRouter;
