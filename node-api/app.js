const express = require("express");
const app = express();
const port = 8080;
const routes = require("./routes/routes");
require("dotenv").config();

app.use(express.json());

app.use(routes);

app.listen(port, (req, res) => {
  console.log(`server started at port 8080`);
});
