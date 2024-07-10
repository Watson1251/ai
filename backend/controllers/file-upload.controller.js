const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FileUpload = require("../models/file-upload.model");

const router = express.Router();

const ensureDirectoryExistence = (filePath) => {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath, { recursive: true });
  }
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = file.mimetype.split('/')[0];  // Extract file type (e.g., 'image', 'video')
    const userId = req.body.uploadedBy;            // Assume userId is sent in the body
    const uploadPath = path.join(__dirname, '..', 'uploads', fileType, userId);
    ensureDirectoryExistence(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// File filter to accept only specific types if needed
const fileFilter = (req, file, cb) => {
  // Accept file
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter
}).single('file');

exports.createFile = (req, res, next) => {
  upload(req, res, function (err) {
    if (err) {
      return res.status(500).json({
        message: 'File upload failed',
        error: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded'
      });
    }

    const fileType = req.file.mimetype.split('/')[0];
    const filepath = req.file.path;

    const file = new FileUpload({
      filename: req.file.originalname,
      filepath: filepath,
      type: fileType,
      uploadTime: Date.now(),
      uploadedBy: req.body.uploadedBy,
    });

    file
      .save()
      .then(createdFile => {
        res.status(201).json({
          message: "File added successfully",
          file: {
            id: createdFile._id
          }
        });
      })
      .catch(error => {
        console.error(error.message);
        res.status(500).json({
          message: error.message
        });
      });
  });
};
