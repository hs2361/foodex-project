const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const session = require('express-session');  //imported modules

app.use(session({
  secret: 'seCReT',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 }
})); //initialised session cookie

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/", require("./routes/index")); //routing for home page
app.use("/users", require("./routes/users")); //routing for /users endpoint of API
app.use("/order", require("./routes/order")); //routing for /order endpoint of API

app.get("*", (req, res) => {
  res.status(404).send("Page 404'd");
}); //default 404 response

const PORT = 5000;
app.listen(PORT, console.log(`Server started on port ${PORT}`)); //starting server