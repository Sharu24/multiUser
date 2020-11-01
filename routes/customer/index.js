const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const randomstirng = require("randomstring");
const pug = require("pug");
const path = require("path");

const config = require("../../config");

const Customer = require("../models/Customer");
const Admin = require("../models/Admin");

router.get("/dashboard", (req, res) => {
  console.log("I am a get route");
  res.send("I am here");
});

router.post(
  "/register",
  [
    body("name", "Name is a required field")
      .notEmpty()
      .isString(),
    body("email", "Email is mandatory").isEmail(),
    body("password", "Password is required").isLength({ min: 6 }),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password does not match");
      }
      return true;
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let { name, email, role } = req.body;

      // Check if the email already exists
      let customer = await Customer.findOne({ email: email });
      let admin = await Admin.findOne({ email: email });
      if (customer || admin)
        return res.status(400).json({ Error: `Email ${email} already exists` });

      // Hash the Password
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const password = await bcrypt.hash(req.body.password, salt);

      // Email Token
      const emailToken = await randomstirng.generate();

      // Create a Customer Object
      customer = new Customer({
        name,
        email,
        password,
        role,
        emailToken
      });

      // Save User to DB
      await customer.save();

      // Send a email verification to Customer
      //   const html = `
      //   <h1>Please Click the Link Below</h1>
      //   <a href="http://localhost:3000/api/customer/verify/${emailToken}">Email Verification Link</a>
      //   `;

      const verifyUrl = `http://localhost:3000/api/customer/verify/${emailToken}`;

      console.log(verifyUrl);
      html = pug.renderFile(path.join(__dirname + "../../../views/email.pug"), {
        name: name,
        verifyUrl: verifyUrl,
        senderName: config.emailAccount
      });

      require("../../controllers/mailControllers")(email, html);

      //Respond back to caller
      res.status(200).json({ Success: customer });
    } catch (err) {
      console.error(err);
      res.status(500).json({ Error: "Error while registering the User" });
    }
  }
);

router.get("/verify/:token", async (req, res) => {
  try {
    const token = req.params.token;
    let customer = await Customer.findOne({ emailToken: token });
    if (!customer) {
      return res.status(403).json({ Error: "Authentication failed" });
    }
    await Customer.updateOne({ emailToken: token }, { $set: { active: true } });
    res.status(200).json({ Success: "Customer Verified Successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ Error: "Unable to Verify Customer" });
  }
});

module.exports = router;
