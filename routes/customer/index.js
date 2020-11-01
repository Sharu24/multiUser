const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const randomstirng = require("randomstring");
const pug = require("pug");
const jwt = require("jsonwebtoken");
const path = require("path");

const config = require("../../config");

const Customer = require("../../models/Customer");
const Admin = require("../../models/Admin");
const auth = require("../../controllers/auth");

router.get("/dashboard", auth, async (req, res) => {
  try {
    let userData = {};
    if (req.user.is === "customer") {
      userData = await Customer.findById(
        req.user.id,
        "-_id -active -password -emailToken"
      );
    } else {
      userData = await Admin.findById(
        req.user.id,
        "-_id -active -password -emailToken"
      );
    }

    res.status(200).json({ Success: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ Error: "Unable to Pull User Details" });
  }
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

      // Send and Email to the Customer to Verify his/her email
      const verifyUrl = `http://localhost:3000/api/customer/verify/${emailToken}`;
      html = pug.renderFile(path.join(__dirname + "../../../views/email.pug"), {
        name: name,
        verifyUrl: verifyUrl,
        senderName: config.emailAccount
      });
      require("../../controllers/mailControllers")(email, html);

      //Respond back to caller
      res
        .status(200)
        .json({ Success: `User ${name} Registered Successfully ` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ Error: "Error while registering the User" });
    }
  }
);

router.get("/verify/:token", async (req, res) => {
  try {
    const token = req.params.token;

    // Check if the token is valid
    let customer = await Customer.findOne({ emailToken: token });
    if (!customer) {
      return res.status(403).json({ Error: "Authentication failed" });
    }

    // Activate Customer
    await Customer.updateOne({ emailToken: token }, { $set: { active: true } });

    // Return Success Back to Caller
    res.status(200).json({ Success: "Customer Verified Successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ Error: "Unable to Verify Customer" });
  }
});

router.post(
  "/login",
  [
    body("email", "Enter a Valid Email Address").isEmail(),
    body("password", "Enter a valid Password")
      .notEmpty()
      .isString()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new Error({ Error: errors.array() });
    }
    try {
      const { email, password } = req.body;

      // Validate User Credentails
      const customer = await Customer.findOne({ email: email });
      const admin = await Admin.findOne({ email: email });
      if (customer ^ admin) {
        return res.status(403).json({ Error: "Invalid Login Credentials1" });
      }
      let validUser = false;
      if (customer) {
        validUser = await bcrypt.compare(password, customer.password);
      } else {
        validUser = await bcrypt.compare(password, admin.password);
      }
      if (!validUser) {
        return res.status(403).json({ Error: "Invalid Login Credentials2" });
      }

      // Generate a token
      const SECRET_KEY = "thehackingschool";
      const payload = {
        user: {
          id: customer ? customer._id : admin_id
        }
      };

      const token = await jwt.sign(payload, SECRET_KEY);

      res.status(200).json({ Success: token });
    } catch (err) {
      console.error(err);
      res.status(err).json({ Error: "Unable to login. Contact Admin" });
    }
  }
);

module.exports = router;
