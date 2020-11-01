const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

require("./dbConnect");

const customer = require("./routes/customer");
const admin = require("./routes/admin");

app.use(express.json());
app.use("/api/customer", customer);
app.use("/api/admin", admin);

app.listen(PORT, () => {
  console.log("Server is listening on port ", PORT);
});
