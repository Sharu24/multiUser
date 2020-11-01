const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const adminSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  emailToken: { type: String, required: true },
  active: { type: String, default: true }
});

module.exports = mongoose.model("Admin", adminSchema, "admins");
