const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const roleSchema = mongoose.Schema({
  role: { type: String, required: true, unique: true },
  permissions: { type: [String], required: true, },
});

roleSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Role", roleSchema);
