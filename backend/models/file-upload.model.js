const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const fileUploadSchema = mongoose.Schema({
  filename: { type: String, required: true },
  filepath: { type: String, required: true },
  type: { type: String, required: true },
  uploadTime: { type: Number, required: true },
  uploadedBy: { type: String, required: true }
});

fileUploadSchema.plugin(uniqueValidator);

module.exports = mongoose.model("FileUpload", fileUploadSchema);
