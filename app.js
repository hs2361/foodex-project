const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const session = require('express-session');

app.use(session({
  secret: 'seCReT',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/", require("./routes/index"));
app.use("/users", require("./routes/users"));
app.get("*",(req,res) => {
    res.status(404).send("Page 404'd");
});
 
const PORT = 5000;
app.listen(PORT, console.log(`Server started on port ${PORT}`));