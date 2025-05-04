const UserController = require("../controllers/user.controller");
const router = require("express").Router;

const UserRouter = router();

UserRouter.post("/register", UserController.register);
UserRouter.post("/login", UserController.login);
UserRouter.get("/:email", UserController.getProfile);
UserRouter.put("/:email", UserController.updateProfile);
UserRouter.delete("/:email", UserController.deleteProfile);

module.exports = UserRouter;
