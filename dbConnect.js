const mongoose = require("mongoose");
const config = require("./config");

const connectDb = async instance => {
  try {
    let dbInstance =
      instance === "local" ? config.mongoLocal : config.mongoCloud;
    await mongoose.connect(dbInstance, config.options);
    console.log("Connected to MongoDB " + instance + " instance Successfully");
  } catch (err) {
    console.error(err);
  }
};

connectDb("local");
