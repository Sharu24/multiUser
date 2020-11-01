const jwt = require("jsonwebtoken");
const config = require("../config");
const Customer = require("../models/Customer");
const Admin = require("../models/Admin");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers["auth-token"];
    if (!token) {
      return res.status(403).json({ Error: "Unauthorized1" });
    }

    const decoded = await jwt.verify(token, config.SECRET_KEY);
    if (!decoded) {
      return res.status(403).json({ Error: "Unauthorized2" });
    }

    const customer = await Customer.findById(decoded.user.id);
    const admin = await Admin.findById(decoded.user.id);
    if (!(customer || admin)) {
      return res.status(403).json({ Error: "Unauthorized3" });
    } else if (!(customer.active || admin.active)) {
      return res.status(403).json({ Error: "Inactive Users" });
    } else {
      req.user = {
        is: customer ? "customer" : "admin",
        id: customer ? customer._id : admin._id
      };
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(200).json({ Error: "Unable to Authorize " });
  }
};
