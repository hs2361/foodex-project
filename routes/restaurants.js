const express = require('express');
const router = express.Router();
const mySqlConnection = require("../db/database");
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const multer = require("multer");
const fs = require("fs");
const path = require("path");
var r = 0;

const imgUploader = multer({
    dest: __dirname.replace("\\routes", "\\temp") + "\\images"
});

//get request handling /restaurants. redirects to profile if logged in, else to login page
router.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.user.rid) {
            res.redirect('/restaurants/profile');
        }
        else {
            res.status(401).render('login_rest', { alert: true, msg: "You must be logged in as a restaurant!" });
        }
    }
    else {
        res.redirect('/restaurants/login');
    }
});

//get request for profile
router.get('/profile', (req, res) => {
    if (req.session.user) {
        if (req.session.user.rid) {
            mySqlConnection.query(
                `select * from restaurants where rid = ${req.session.user.rid}`,
                [],
                (err, rows) => {
                    if (err) {
                        res.status(500).send(err);
                    }
                    else if (!rows) {
                        res.status(500).render('login_rest', { alert: true, msg: "Try logging in again" });
                    }
                    else {
                        res.send(rows);
                    }
                }
            );
        }
        else {
            res.status(401).render('login_rest', { alert: true, msg: "You must be logged in as a restaurant!" });
        }
    }
    else {
        res.redirect('/restaurants/login');
    }
});

router.get('/profile/edit', (req, res) => {
    if (req.session.user) {
        if (req.session.user.rid) {
            res.status(200).send('profile edit form');
        }
        else {
            res.status(401).render('login_rest', { alert: true, msg: "You must be logged in as a restaurant!" });
        }
    }
    else {
        res.redirect('/restaurants/login');
    }
});

router.post('/profile/edit', (req, res) => {
    if (req.session.user) {
        if (req.session.user.rid) {
            const { name, email, phone, address } = req.body;
            mySqlConnection.query(
                `UPDATE TABLE restaurants SET name = ${name}, phone = ${phone}, address = ${address} WHERE rid = ${req.session.user.rid}`,
                [],
                (err, rows) => {
                    if (err) {
                        res.status(500).send(err);
                    }
                    else {
                        res.status(200).send('Profile updated');
                    }
                }
            );
        }
        else {
            res.status(401).render('login_rest', { alert: true, msg: "You must be logged in as a restaurant!" });
        }
    }
    else {
        res.redirect('/restaurants/login');
    }
});

//get request for signup, will inform user 'already logged in' if cookie exists
router.get('/signup', (req, res) => {
    if (req.session.user) {
        if (req.session.user.rid) {
            res.status(400).redirect("landing", { alert: true, msg: "You are already logged in!" });
        }
        else {
            res.status(400).redirect("landing", { alert: true, msg: "You are already logged in as a user!" });
        }
    }
    else {
        res.render('register_rest', { alert: false, msg: "" })
    }
});

//get request for login, will inform user 'already logged in' if cookie exists
router.get('/login', (req, res) => {
    if (req.session.user) {
        if (req.session.user.rid) {
            res.status(400).send('Already logged in');
        }
        else {
            res.status(401).send('Not a restaurant');
        }
    }
    else {
        res.render('login_rest', { alert: false, msg: "" });
    }
});

//post request for signup, also sends verification email
router.post('/signup', imgUploader.single(`rest_image`), (req, res) => //POST request at /signup endpoint
{
    const { name, email, password, phone, password2, address, category } = req.body; //destructuring req.body object received from form
    //if else statements checking for invalid charecters in input fields to prevent sql injections and cross-site scripting.
    if (name.includes('"') || name.includes("'") || name.includes(';') || name.includes('-') || name.includes('<') || name.includes('>') || name.includes('/')) {
        res.render('register_rest', { alert: 'true', msg: 'Name cannot have any of the following characters: \n" \' ; - < > /' });
    }
    else if (password.includes('"') || password.includes("'") || password.includes(';') || password.includes('-') || password.includes('<') || password.includes('>') || password.includes('/')) {
        res.render('register_rest', { alert: 'true', msg: 'Password cannot have any of the following characters: \n" \' ; - < > /' });
    }
    else if (password2.includes('"') || password2.includes("'") || password2.includes(';') || password2.includes('-') || password2.includes('<') || password2.includes('>') || password2.includes('/')) {
        res.render('register_rest', { alert: 'true', msg: 'Password cannot have any of the following characters: \n" \' ; - < > /' });
    }
    else if (address.includes('"') || address.includes("'") || address.includes(';') || address.includes('-') || address.includes('<') || address.includes('>') || address.includes('/')) {
        res.render('register_rest', { alert: 'true', msg: 'Address cannot have any of the following characters: \n" \' ; - < > /' });
    }
    else if (email.includes('"') || email.includes("'") || email.includes(';') || email.includes('-') || email.includes('<') || email.includes('>') || email.includes('/')) {
        res.render('register_rest', { alert: 'true', msg: 'Email ID cannot have any of the following characters: \n" \' ; - < > /' });
    }
    else if (phone.includes('"') || phone.includes("'") || phone.includes(';') || phone.includes('-') || phone.includes('<') || phone.includes('>') || phone.includes('/')) {
        res.render('register_rest', { alert: 'true', msg: 'Phone number cannot have any of the following characters: \n" \' ; - < > /' });
    }
    else {
        let errors = []; //errors array
        mySqlConnection.query(
            "select max(rid) as rid from restaurants",
            [],
            (err, rows) => {
                r = rows[0].rid;
                if (err)
                    res.status(500).send(err);
                else {
                    const tempPath = req.file.path;
                    const targetPath = __dirname.replace("\\routes", "") + `\\frontend\\images\\rest_img_${r}.jpg`;

                    if (path.extname(req.file.originalname).toLowerCase() === ".jpg") {
                        fs.rename(tempPath, targetPath, err => {
                            if (err) console.log(err);
                        });
                    } else {
                        fs.unlink(tempPath, err => {
                            if (err) res.status(500).send(err);
                            res.render('register_rest', { alert: 'true', msg: "Only .jpg files are allowed!" })
                        });
                    }

                    mySqlConnection.query(
                        "SELECT * FROM restaurants WHERE email = ?", //check for existing users
                        [email],
                        (err, rows) => {
                            if (err)
                                res.status(500).send(err); //internal server error
                            else if (rows.length)
                                res.render('register_rest', { alert: 'true', msg: "Email already exists" });
                            else {
                                mySqlConnection.query(
                                    "SELECT * FROM users WHERE email = ?",
                                    [email],
                                    (err, rows) => {
                                        if (err)
                                            res.status(500).send(err);
                                        else if (rows.length) {
                                            res.render('register_rest', { alert: 'true', msg: "Cannot register restaurant with user email id" });
                                        }
                                        else {
                                            mySqlConnection.query(
                                                "select (max(rid) +1) as ghostRid from restaurants",
                                                [],
                                                (e1, r1) => {
                                                    if (e1)
                                                        res.status(500).send(e1);
                                                    else {
                                                        mySqlConnection.query(
                                                            `update restaurants set rid = ${r1[0].ghostRid} where rname = "Ghost <3"`,
                                                            (e2, r2) => {
                                                                if (e2)
                                                                    res.status(500).send(e2);
                                                                else {
                                                                    mySqlConnection.query(
                                                                        `ALTER TABLE menu_${r1[0].ghostRid - 1} RENAME menu_${r1[0].ghostRid};`,
                                                                        [],
                                                                        (e3) => {
                                                                            if (e3)
                                                                                res.status(500).send(e3);
                                                                            else {
                                                                                pwdHash = bcrypt.hashSync(password, 10); //hashing the password
                                                                                var sql = `INSERT INTO restaurants (rid, rname, email, phone, passHash, address, verified, category) VALUES ?`; //insertion query
                                                                                const values = [[r ,name, email, phone, pwdHash, address, 0, category]];

                                                                                mySqlConnection.query(sql, [values], function (err) //insert into database
                                                                                {
                                                                                    if (err)
                                                                                        res.status(500).send(err); //internal server error

                                                                                    else {
                                                                                        const verificationCode = Math.floor(Math.random() * 1000000); //generate random verification code
                                                                                        mySqlConnection.query( //insert code into verify table
                                                                                            'insert into verify values (?)',
                                                                                            [[email, verificationCode]],
                                                                                            (err) => {
                                                                                                if (err)
                                                                                                    res.status(500).send(err); //internal server error
                                                                                                else {
                                                                                                    var transporter = nodemailer.createTransport({ //mail authentication
                                                                                                        service: 'hotmail',
                                                                                                        port: 465,
                                                                                                        auth: {
                                                                                                            user: 'foodex_server@outlook.com', //replace with your own credentials
                                                                                                            pass: 'xedooF_ghost<3'
                                                                                                        }
                                                                                                    });

                                                                                                    var mailOptions = {
                                                                                                        from: 'foodex_server@outlook.com',
                                                                                                        to: email,
                                                                                                        subject: 'Verify your email',
                                                                                                        text: `localhost:5000/restaurants/verify/${email}/${verificationCode}` //mail body
                                                                                                    };

                                                                                                    transporter.sendMail(mailOptions, function (error, info) { //send mail
                                                                                                        console.log('sending email');
                                                                                                        if (error) {
                                                                                                            console.log(error);
                                                                                                            res.status(500).send(error); //internal server error
                                                                                                        }
                                                                                                    });
                                                                                                    res.redirect('/restaurants/verify'); //redirect to verify page
                                                                                                }
                                                                                            }
                                                                                        );
                                                                                    }
                                                                                });
                                                                            }
                                                                        }
                                                                    );
                                                                }
                                                            }
                                                        );
                                                    }
                                                }
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            }
        )
    }
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (email.includes('"') || email.includes("'") || email.includes(';') || email.includes('-') || email.includes('<') || email.includes('>') || email.includes('/')) {
        res.render('login_rest', { alert: 'true', msg: 'Email ID cannot have any of the following characters: \n" \' ; - < > /' });
    }
    else if (password.includes('"') || password.includes("'") || password.includes(';') || password.includes('-') || password.includes('<') || password.includes('>') || password.includes('/')) {
        res.render('login_rest', { alert: 'true', msg: 'Password cannot have any of the following characters: \n" \' ; - < > /' });
    }
    else {
        mySqlConnection.query(
            "SELECT * FROM restaurants WHERE email = ?",
            [email],
            (err, rows) => {
                const user = rows[0];
                if (err)
                    res.status(500).send(err);
                else if (user) {
                    const result = bcrypt.compareSync(password, user.passHash);
                    const isVerified = user.verified;
                    if (result && isVerified) {
                        req.session.user = user;
                        mySqlConnection.query(
                            `CREATE TABLE IF NOT EXISTS menu_${user.rid} (
                                did INT PRIMARY KEY AUTO_INCREMENT,
                                dname VARCHAR(255),
                                price INT
                            );`,
                            [],
                            (err) => {
                                if (err) {
                                    res.status(500).send(err);
                                }
                                else {
                                    res.redirect("/rdashboard");
                                }
                            }
                        )
                    }
                    else if (!isVerified) {
                        const verificationCode = Math.floor(Math.random() * 1000000); //generate random verification code
                        mySqlConnection.query( //insert code into verify table
                            'insert into verify values (?)',
                            [[email, verificationCode]],
                            (err) => {
                                if (err)
                                    res.status(500).send(err); //internal server error
                                else {
                                    var transporter = nodemailer.createTransport({ //mail authentication
                                        service: 'gmail',
                                        auth: {
                                            user: 'sweetharsh236@gmail.com', //replace with your own credentials
                                            pass: 'BBitbs!2306'
                                        }
                                    });

                                    var mailOptions = {
                                        from: 'sweetharsh236@gmail.com',
                                        to: email,
                                        subject: 'Verify your email',
                                        text: `localhost:5000/restaurants/verify/${email}/${verificationCode}` //mail body
                                    };

                                    transporter.sendMail(mailOptions, function (error, info) { //send mail
                                        if (error) {
                                            res.status(500).send(error); //internal server error
                                        }
                                    });
                                    res.redirect('/restaurants/verify'); //redirect to verify page
                                }
                            });
                    }
                    else {
                        res.render("login_rest", { alert: true, msg: "Incorrect Password!" });
                    }
                }

                else {
                    res.render("login_rest", { alert: true, msg: "Account does not exist!" });
                }
            }
        )
    }
})

router.get('/logout', (req, res) => {
    if (req.session.user) {
        req.session.destroy(() => {
            res.redirect('/');
        });
    }

    else {
        res.render("landing", { alert: true, msg: "Not logged in!" });
    }
    //redirect to landing page
});

router.get('/verify', (req, res) => {
    res.render('verification');
});

router.get('/verify/:email/:code', (req, res) => {

    if (req.params) {
        mySqlConnection.query(
            'select * from verify where email = ?',
            [req.params.email],
            (err, rows) => {
                if (err)
                    res.status(500).send(err)
                else if (!rows)
                    res.status(400).send('account does not exist')
                else {
                    if (rows[0].code == req.params.code) {
                        mySqlConnection.query(
                            'update restaurants set verified = true where email = ?',
                            [req.params.email],
                            (err) => {
                                if (err)
                                    res.status(500).send(err);
                                else {
                                    mySqlConnection.query(
                                        'delete from verify where email = ?', //remove data from verify table
                                        [req.params.email],
                                        (err) => {
                                            if (err)
                                                res.status(500).send(err); //internal server error
                                            else
                                                res.redirect('/restaurants/login');
                                        }
                                    )
                                }
                            }
                        )

                    }
                    else {
                        res.render("register_rest", { alert: true, msg: "Couldn't verify your email!" });
                    }
                }
            }
        )
    }

    else {
        res.render('verification');
    }
});

module.exports = router