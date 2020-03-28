const passData = require("../passwords.json");
const mysql = require("mysql"); //import module

const mySqlConnection = mysql.createConnection({ //database credentials
    host: "sql12.freemysqlhosting.net",
    user: "sql12329822",
    password: passData.dbPass,
    database: "sql12329822"
});

mySqlConnection.connect(err => { //connect to database
    if (err) console.log(err);
    else console.log("Database Connected!");
});

module.exports = mySqlConnection; //export connection