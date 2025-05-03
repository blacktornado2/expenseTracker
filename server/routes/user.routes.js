const UserController = require("../controllers/user.controller");
const router = require("express").Router;

const UserRouter = router();

UserRouter.post("/register", UserController.register);
UserRouter.post("/login", UserController.login);
UserRouter.get("/profile", UserController.getProfile);
UserRouter.put("/profile", UserController.updateProfile);
UserRouter.delete("/profile", UserController.deleteProfile);

module.exports = UserRouter;
