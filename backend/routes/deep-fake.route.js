const express = require("express");
const checkAuth = require("../middleware/check-auth");

const DeepFakeController = require("../controllers/deep-fake.controller");

const router = express.Router();

router.post("/predict", checkAuth, DeepFakeController.predictVideo);

module.exports = router;
