const express = require("express");
const checkAuth = require("../middleware/check-auth");

const AuthController = require("../controllers/auth.controller");

const router = express.Router();

router.post("/login", AuthController.userLogin);

module.exports = router;
