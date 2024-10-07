const express = require("express");
const checkAuth = require("../middleware/check-auth");

const FrController = require("../controllers/fr.controller");

const router = express.Router();

router.post("/extract-faces", checkAuth, FrController.extractFaces);
router.post("/search-face", checkAuth, FrController.searchFace);
router.post("/enhance", checkAuth, FrController.enhance);

module.exports = router;
