const express = require("express");
const checkAuth = require("../middleware/check-auth");

const PermissionsController = require("../controllers/permissions.controller");

const router = express.Router();

router.get("/", checkAuth, PermissionsController.getPermissions);
router.get("/:id", checkAuth, PermissionsController.getPermission);
router.post("/create", checkAuth, PermissionsController.createPermission);
router.post("/update", checkAuth, PermissionsController.updatePermission);
router.post("/delete", checkAuth, PermissionsController.deletePermission);

module.exports = router;
