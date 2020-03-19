const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const expressLayouts = require("express-ejs-layouts");
const session = require('express-session');  //imported modules

app.use(express.static(__dirname));
app.use(session({
  secret: 'seCReT',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 }
})); //initialised session cookie

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(expressLayouts);
app.set("view engine", "ejs");

app.use("/", require("./routes/index")); //routing for home page
app.use("/users", require("./routes/users")); //routing for /users endpoint of API
app.use("/order", require("./routes/order")); //routing for /order endpoint of API
app.use("/restaurants", require("./routes/restaurants")); //routing for /restaurants endpoint of API
app.use("/feedback", require("./routes/feedback")) //routing for /feedback endpoint of API
app.use("/browse", require("./routes/browse"));

app.get("*", (req, res) => {
  res.status(404).sendFile(__dirname + '/frontend/404.html');
}); //default 404 response

const PORT = 5000;
app.listen(PORT, console.log(`Server started on port ${PORT}`)); //starting server