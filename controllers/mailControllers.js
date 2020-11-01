const nodemailer = require("nodemailer");
const config = require("../config");

module.exports = async (email, html) => {
  //create transport object
  const transporter = nodemailer.createTransport(config.accountDetails);

  //send email
  let info = await transporter.sendMail({
    from: config.emailAccount,
    to: email,
    subject: "Welcome to iSharu Tech Crunches Ltd - Email Verification",
    html: html
  });

  console.log("Message sent %s", info.messageId);
};
