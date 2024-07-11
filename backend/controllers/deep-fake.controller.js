const FileUpload = require("../models/file-upload.model");
const dotenv = require("dotenv");
const axios = require('axios');

dotenv.config();

const pythonUrl = process.env.DF_URL || "http://localhost:5000/process";

exports.predictVideo = (req, res, next) => {
  FileUpload.findById(req.body.fileId)
    .then(async file => {
      if (file) {
        const data = {
          path: file.filepath
        };

        try {
          const response = await axios.post(pythonUrl, data); // Adjust based on your Python engine URL
          console.log("Received response from Python:", response.data);
          res.json(response.data);
        } catch(error) {
          throw error.message;
        }

      } else {
        res.status(404).json({ message: "File not found!" });
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({
        message: error.message
      });
    });
  
};