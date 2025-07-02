const router = require("express").Router;

const { protect } = require("../middlewares/auth.middleware");
const UserController = require("../controllers/user.controller");

const UserRouter = router();

UserRouter.post("/register", UserController.register);
UserRouter.post("/login", UserController.login);
UserRouter.get("/:email", protect, UserController.getProfile);
UserRouter.put("/:email", protect, UserController.updateProfile);
UserRouter.delete("/:email", protect, UserController.deleteProfile);

module.exports = UserRouter;
