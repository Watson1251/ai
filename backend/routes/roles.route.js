const express = require("express");
const checkAuth = require("../middleware/check-auth");

const RolesController = require("../controllers/roles.controller");

const router = express.Router();

router.get("/", checkAuth, RolesController.getRoles);
router.post("/create", checkAuth, RolesController.createRole);
router.post("/update", checkAuth, RolesController.updateRole);
router.post("/delete", checkAuth, RolesController.deleteRole);

module.exports = router;
