const path = require('path');
const multer = require("multer");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg"
};

const delimiter = '---';
const target_dir = path.join(__dirname, '../images/');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = new Error("Invalid mime type");
    if (isValid) {
      error = null;
    }
    cb(error, target_dir);
  },
  filename: (req, file, cb) => {
    const name = file.originalname
      .toLowerCase()
      .split(" ")
      .join("-");
    const ext = MIME_TYPE_MAP[file.mimetype];
    // const filename = name + "-" + Date.now() + "." + ext;
    const filename = Date.now() + "." + ext;

    var filepath = path.join(target_dir, filename);

    if (!req.body.filepaths) {
      req.body.filepaths = filepath;
    } else {
      req.body.filepaths += delimiter + filepath;
    }
    cb(null, filename);
  }
});

module.exports = multer({ storage: storage }).any('image');
