const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const permissionSchema = mongoose.Schema({
  permission: { type: String, required: true, unique: true },
});

permissionSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Permission", permissionSchema);
