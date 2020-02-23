const mysql = require("mysql");

const mySqlConnection = mysql.createConnection({
    host: "localhost",
    user: "webkriti_server",
    password: "CPimfa!2306",
    database: "webkriti"
});

mySqlConnection.connect(err => {
    if (err) console.log(err);
    else console.log("Database Connected!");
});

module.exports = mySqlConnection;