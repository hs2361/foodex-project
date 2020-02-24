const mysql = require("mysql"); //import module

const mySqlConnection = mysql.createConnection({ //database credentials
    host: "localhost",
    user: "webkriti_server",
    password: "CPimfa!2306",
    database: "webkriti"
});

mySqlConnection.connect(err => { //connect to database
    if (err) console.log(err);
    else console.log("Database Connected!");
});

module.exports = mySqlConnection; //export connection