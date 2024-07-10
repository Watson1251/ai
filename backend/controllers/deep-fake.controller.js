const FileUpload = require("../models/file-upload.model");
const pathLib = require('path');
var XMLHttpRequest = require('xhr2');

const pythonIP = "http://python-app:8000/";

exports.predictVideo = (req, res, next) => {
  FileUpload.findById(req.body.fileId)
    .then(file => {
      if (file) {

        try {
          var xhr = new XMLHttpRequest();
          const path = file.filepath;
          
          var result = [];
      
          xhr.open("POST", pythonIP + "predict/");
          xhr.setRequestHeader("Accept", "application/json");
          xhr.setRequestHeader("Content-Type", "application/json");
      
          xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
      
              const statusCode = xhr.status;
              const json = JSON.parse(xhr.responseText);
      
              if ((statusCode == 200 || statusCode == 201) && json['code'] == 0) {
      
                res.status(201).json({
                  message: `Engine predicted successfuly.`,
                  result: json.result
                });
      
              } else {

                throw "Failed to predict!";
                
              }
            }
          };
      
          let data = {
            'path': path
          };
          const stringifiedData = JSON.stringify(data);
          xhr.send(stringifiedData);
      
        } catch(e) {
          console.log(e);
          res.status(500).json({
            message: "Failed to predict!",
            result: result
          });
      
        }

      } else {
        res.status(404).json({ message: "File not found!" });
      }
    })
    .catch(error => {
      console.error(error.message);
      res.status(500).json({
        message: error.message
      });
    });
  
};