const express = require("express");
const checkAuth = require("../middleware/check-auth");

const UsersController = require("../controllers/users.controller");

const router = express.Router();

router.get("/", checkAuth, UsersController.getUsers);
router.get("/:id", checkAuth, UsersController.getUser);
router.post("/create", checkAuth, UsersController.createUser);
router.post("/update", checkAuth, UsersController.updateUser);
router.post("/delete", checkAuth, UsersController.deleteUser);

module.exports = router;
