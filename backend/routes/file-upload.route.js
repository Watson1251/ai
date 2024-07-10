const express = require("express");
const checkAuth = require("../middleware/check-auth");

const FileUploadController = require("../controllers/file-upload.controller");

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post("/create", checkAuth, FileUploadController.createFile);

module.exports = router;
