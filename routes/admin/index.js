const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  console.log("I am an admin");
  res.send("hello Admin");
});

module.exports = router;
