const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const customerSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  emailToken: { type: String, required: true },
  active: { type: String, default: false }
});

module.exports = mongoose.model("Customer", customerSchema, "customers");
