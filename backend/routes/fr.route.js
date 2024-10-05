const express = require("express");
const checkAuth = require("../middleware/check-auth");

const FrController = require("../controllers/fr.controller");

const router = express.Router();

router.post("/predict", checkAuth, FrController.predictVideo);

module.exports = router;
