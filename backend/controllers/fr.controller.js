const FileUpload = require("../models/file-upload.model");
const dotenv = require("dotenv");
const axios = require('axios');
const fs = require('fs');

dotenv.config();

const frURL = process.env.FR_URL;
const gfpganURL = process.env.GFPGAN_URL;

exports.extractFaces = (req, res, next) => {
  FileUpload.findById(req.body.fileId)
    .then(async file => {
      if (file) {
        const data = {
          path: file.filepath
        };
        try {
          const response = await axios.post(frURL + "extract-faces", data);
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

exports.searchFace = (req, res, next) => {
  FileUpload.findById(req.body.fileId)
    .then(async file => {
      if (file) {
        const data = {
          path: file.filepath
        };
        try {
          const response = await axios.post(frURL + "search-face", data);
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

exports.enhance = (req, res, next) => {
  FileUpload.findById(req.body.fileId)
    .then(async file => {
      if (file) {
        const data = {
          path: file.filepath
        };
        try {

          // Make request to GFPGAN with responseType set to 'arraybuffer'
          const response = await axios.post(gfpganURL + "enhance", data);
          
          // The image path returned by the GFPGAN service
          const enhancedImagePath = response.data.results.results;

          // Check if the image file exists before streaming
          if (fs.existsSync(enhancedImagePath)) {
            // Stream the image file to the client
            res.setHeader('Content-Type', 'image/jpeg');
            const timestamp = Date.now();
            const uniqueFilename = `enhanced_image_${timestamp}.jpg`;
            res.setHeader('Content-Disposition', `attachment; filename=${uniqueFilename}`);
            
            // Create a read stream and pipe the image directly to the response
            const readStream = fs.createReadStream(enhancedImagePath);
            readStream.pipe(res);
          } else {
            console.log("Enhanced image not found!");
            res.status(404).json({ message: "Enhanced image not found!" });
          }
        } catch(error) {
          console.error(error);
          res.status(500).json({
            message: 'Failed to enhance image.',
            error: error.message
          });
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