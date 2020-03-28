const express = require('express');
const router = express.Router();
const mySqlConnection = require("../db/database");
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const passData = require("../passwords.json");
var r = 0;

const imgUploader = multer({
    dest: __dirname.replace("\\routes", "\\temp") + "\\images"
});

//get request handling /restaurants. redirects to profile if logged in, else to login page
router.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.user.rid) {
            res.redirect('/rdashboard');
        }
        else {
            res.status(401).render('landing', { alert: true, msg: "Login as a restaurant for this" });
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
            res.render("landing", { alert: true, msg: "You are already logged in!" });
        }
        else {
            res.render("landing", { alert: true, msg: "You are already logged in as a user!" });
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
            res.render("landing", { alert: true, msg: "You are already logged in!" });
        }
        else {
            res.render("landing", { alert: true, msg: "You are already logged in as a user!" });
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
        res.render('register_rest', { alert: 'true', msg: 'Name cannot have any of the following characters: \n" \' ; - / or greater/lesser than symbols' });
    }
    else if (password.includes('"') || password.includes("'") || password.includes(';') || password.includes('-') || password.includes('<') || password.includes('>') || password.includes('/')) {
        res.render('register_rest', { alert: 'true', msg: 'Password cannot have any of the following characters: \n" \' ; - / or greater/lesser than symbols' });
    }
    else if (password2.includes('"') || password2.includes("'") || password2.includes(';') || password2.includes('-') || password2.includes('<') || password2.includes('>') || password2.includes('/')) {
        res.render('register_rest', { alert: 'true', msg: 'Password cannot have any of the following characters: \n" \' ; - / or greater/lesser than symbols' });
    }
    else if (address.includes('"') || address.includes("'") || address.includes(';') || address.includes('-') || address.includes('<') || address.includes('>') || address.includes('/')) {
        res.render('register_rest', { alert: 'true', msg: 'Address cannot have any of the following characters: \n" \' ; - / or greater/lesser than symbols' });
    }
    else if (email.includes('"') || email.includes("'") || email.includes(';') || email.includes('-') || email.includes('<') || email.includes('>') || email.includes('/')) {
        res.render('register_rest', { alert: 'true', msg: 'Email ID cannot have any of the following characters: \n" \' ; - / or greater/lesser than symbols' });
    }
    else if (phone.includes('"') || phone.includes("'") || phone.includes(';') || phone.includes('-') || phone.includes('<') || phone.includes('>') || phone.includes('/')) {
        res.render('register_rest', { alert: 'true', msg: 'Phone number cannot have any of the following characters: \n" \' ; - / or greater/lesser than symbols' });
    }
    else {
        var flag = false;
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
                            if (err) res.status(500).send(err);
                            else {
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
                                                                                                                        pass: passData.emailPass
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

                                                                                                    var mailOptions = {
                                                                                                        from: 'foodex_server@outlook.com',
                                                                                                        to: email,
                                                                                                        subject: 'Verify your email',
                                                                                                        html: `
                                                                                                        <!DOCTYPE html>
                                                                                                        <html lang="en">
                                                                                                        <head>
                                                                                                            <meta charset="UTF-8">
                                                                                                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                                                                                            <title>Document</title>
                                                                                                            <style>
                                                                                                                *{
                                                                                                                    font-family: Arial, Helvetica, sans-serif;
                                                                                                                }
                                                                                                                .container{
                                                                                                                    /* border: solid; */
                                                                                                                    width: 500px;
                                                                                                                    display: flex;
                                                                                                                    flex-direction: column;
                                                                                                                    align-items: center;
                                                                                                                    margin: 0 auto;
                                                                                                                }
                                                                                                                .brand{
                                                                                                                    display: flex;
                                                                                                                    flex-direction: column;
                                                                                                                    align-items: center;
                                                                                                                    /* border: solid; */
                                                                                                                    /* height: 200px; */
                                                                                                                    justify-content: space-between;
                                                                                                                }
                                                                                                                .orange{
                                                                                                                    color: orange;
                                                                                                                    /* border: solid; */
                                                                                                                    margin-left: -25px;
                                                                                                                }
                                                                                                                .brand h1{
                                                                                                                    color: green;
                                                                                                                    /* border: saddlebrown solid ; */
                                                                                                                    font-size: 4em;
                                                                                                                }
                                                                                                                button{
                                                                                                                    border: orange 2px solid;
                                                                                                                    padding: 10px;
                                                                                                                    border-radius: 30px;
                                                                                                                    background-color: orange;
                                                                                                                    color: white;

                                                                                                                }
                                                                                                                button:hover{
                                                                                                                    cursor: pointer;
                                                                                                                transform: scale(1.05);
                                                                                                                }
                                                                                                                button a{
                                                                                                                    color: white;
                                                                                                                    text-decoration: none;
                                                                                                                    font-weight: 700;
                                                                                                                    font-size: 1.5em;
                                                                                                                }
                                                                                                                @media (max-width:500px) {
                                                                                                                    .container{
                                                                                                                        width: 400px;
                                                                                                                    }
                                                                                                                    h1{
                                                                                                                        font-size: 1.4em;
                                                                                                                    }
                                                                                                                    
                                                                                                                }
                                                                                                            </style>
                                                                                                        </head>
                                                                                                        <body>
                                                                                                            <div class="container">
                                                                                                                <div class="brand">
                                                                                                                    <svg width="180" height="180" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                                                        <g clip-path="url(#clip0)">
                                                                                                                            <path
                                                                                                                                d="M40.6731 31.5515C40.6731 31.5515 44.304 17.6177 57.1358 19.2319C57.1358 19.2319 60.2309 19.4196 60.7016 22.1075C61.1634 24.751 58.3949 26.8764 55.5336 26.4606C52.9526 26.0859 48.4275 26.8665 40.6731 31.5515Z"
                                                                                                                                fill="#88C057" />
                                                                                                                            <path
                                                                                                                                d="M40.6731 31.5515C40.6731 31.5515 37.4697 17.6995 25.5886 19.6097C25.5886 19.6097 21.3137 19.8885 19.985 22.6573C18.7487 25.2321 21.3202 27.8871 24.0611 27.1116C27.0653 26.2624 32.4066 26.3171 40.6731 31.5515Z"
                                                                                                                                fill="#88C057" />
                                                                                                                            <path
                                                                                                                                d="M57.3986 19.8612C57.3986 19.8612 57.5066 19.8733 57.6527 19.8935C57.6738 19.5491 57.6765 19.1979 57.6334 18.8338C57.2385 15.4794 54.6002 15.2312 54.6002 15.2312C43.6661 13.1575 40.5391 30.5144 40.5391 30.5144C41.0653 30.0524 41.5694 29.6322 42.0613 29.23C43.9318 25.2372 48.4021 18.7296 57.3986 19.8612Z"
                                                                                                                                fill="#88C057" />
                                                                                                                            <path
                                                                                                                                d="M25.5893 19.609C34.754 18.1348 38.7532 26.0376 40.1035 29.729C40.1625 29.7834 40.218 29.83 40.2771 29.8844C40.2771 29.8844 37.5773 12.5973 27.4461 14.9232C27.4461 14.9232 23.8012 15.2509 22.663 18.6965C22.4674 19.2882 22.3842 19.8834 22.3901 20.455C23.9523 19.7177 25.5893 19.609 25.5893 19.609Z"
                                                                                                                                fill="#A4E869" />
                                                                                                                            <path
                                                                                                                                d="M40.1663 8.62773C35.9144 9.58593 35.1315 15.3873 35.1315 15.3873C35.2321 16.5788 35.4323 17.7685 35.6899 18.9383C38.5027 22.6404 39.8805 28.3149 40.398 30.9697C40.5554 31.2526 40.6953 31.4983 40.7975 31.6737C41.2141 29.6075 42.5986 23.7587 45.5722 19.6128C45.8759 18.1522 46.0815 16.6764 46.1242 15.2564C46.3543 7.64636 40.1663 8.62773 40.1663 8.62773Z"
                                                                                                                                fill="#659C35" />
                                                                                                                            <path
                                                                                                                                d="M40.6731 31.5515C40.6731 31.5515 44.304 17.6177 57.1358 19.2319C57.1358 19.2319 60.2309 19.4196 60.7016 22.1075C61.1634 24.751 58.3949 26.8764 55.5336 26.4606C52.9526 26.0859 48.4275 26.8665 40.6731 31.5515Z"
                                                                                                                                fill="#A4E869" />
                                                                                                                            <path
                                                                                                                                d="M40.3864 30.2845C40.571 30.8673 40.6531 31.2204 40.6531 31.2204C40.6531 31.2204 40.7918 30.693 41.1053 29.8618C40.8692 29.9982 40.6324 30.1367 40.3864 30.2845Z"
                                                                                                                                fill="#F2681C" />
                                                                                                                            <path
                                                                                                                                d="M49.5781 30.2755C49.0539 29.1561 48.219 28.3634 47.2628 27.787C45.3732 28.5798 43.1885 29.6878 40.6531 31.2204C37.93 29.4964 35.5315 28.3423 33.4225 27.5895C32.1782 28.2051 31.0524 29.1117 30.3916 30.5045C28.3182 34.8756 34.2914 69.0933 38.66 78.7235C39.071 79.6293 40.1119 79.6162 40.5325 78.701C45.012 68.9649 51.601 34.5968 49.5781 30.2755Z"
                                                                                                                                fill="#ED8F20" />
                                                                                                                            <path
                                                                                                                                d="M38.773 67.2561C38.0678 67.5133 37.3262 67.7073 36.5688 67.8329C36.0214 67.9229 35.6461 68.4382 35.727 68.9821C35.808 69.5259 36.316 69.8943 36.8613 69.8037C37.7418 69.6582 38.6058 69.4323 39.4278 69.1321C39.573 69.0787 39.6999 68.996 39.803 68.8923C40.0681 68.6255 40.1749 68.2229 40.0449 67.8493C39.8635 67.3321 39.2934 67.0655 38.773 67.2561Z"
                                                                                                                                fill="#DD7017" />
                                                                                                                            <path
                                                                                                                                d="M47.3781 31.8528C45.3761 32.7713 43.0415 33.1504 40.441 32.9781C39.8908 32.9416 39.4079 33.3586 39.3617 33.9096C39.3154 34.4606 39.7239 34.9362 40.2741 34.9727C43.2116 35.1672 45.8736 34.7283 48.1859 33.6675C48.2999 33.6146 48.4007 33.5441 48.4852 33.459C48.7716 33.1708 48.8681 32.7281 48.6965 32.3401C48.4733 31.8396 47.8832 31.6213 47.3781 31.8528Z"
                                                                                                                                fill="#DD7017" />
                                                                                                                            <path
                                                                                                                                d="M30.1622 38.1096C30.5096 37.9019 30.9611 37.9071 31.2938 38.1709C32.5676 39.1823 34.6526 40.0562 36.4407 39.7253C36.9846 39.6248 37.4997 39.9832 37.5906 40.5269C37.6466 40.8583 37.5296 41.1827 37.3065 41.4072C37.165 41.5495 36.9807 41.6521 36.7685 41.6913C34.3552 42.1371 31.8664 41.0781 30.3269 39.9575"
                                                                                                                                fill="#DD7017" />
                                                                                                                            <path
                                                                                                                                d="M36.7685 41.6913C36.98 41.6528 37.1643 41.5502 37.3065 41.4072C37.5296 41.1827 37.6466 40.8583 37.5906 40.5269C37.499 39.9839 36.9853 39.6255 36.4407 39.7253C34.6526 40.0548 32.5669 39.1817 31.2938 38.1709C30.9618 37.9078 30.5096 37.9019 30.1622 38.1096C30.2097 38.704 30.2627 39.3166 30.3262 39.9568C31.8664 41.0781 34.3552 42.1371 36.7685 41.6913Z"
                                                                                                                                fill="#DD7017" />
                                                                                                                            <path
                                                                                                                                d="M48.6704 45.6633C47.1123 46.8012 44.6509 47.8786 42.2804 47.4972C41.7376 47.4097 41.3759 46.8968 41.4723 46.3515C41.5687 45.8077 42.0887 45.4362 42.6323 45.5229C44.4154 45.8097 46.5121 44.8872 47.7976 43.8451C48.1426 43.5654 48.6055 43.5591 48.9554 43.7789"
                                                                                                                                fill="#DD7017" />
                                                                                                                            <path
                                                                                                                                d="M47.7984 43.8444C46.5121 44.8872 44.4161 45.8104 42.633 45.5222C42.0901 45.4347 41.5687 45.8063 41.473 46.3508C41.3752 46.8961 41.7369 47.409 42.2811 47.4964C44.6516 47.8779 47.113 46.8005 48.6712 45.6626C48.7709 45.0241 48.8671 44.3961 48.9568 43.7789C48.6062 43.5584 48.1426 43.5654 47.7984 43.8444Z"
                                                                                                                                fill="#DD7017" />
                                                                                                                            <path
                                                                                                                                d="M31.8514 51.1105C32.201 50.8908 32.661 50.8917 32.9986 51.159C33.7983 51.7945 35.1002 52.3449 36.2036 52.1424C36.7475 52.0419 37.2626 52.4003 37.3535 52.944C37.4088 53.2761 37.2925 53.5997 37.0694 53.8243C36.9279 53.9666 36.7436 54.0691 36.5315 54.1084C34.9294 54.4039 33.2832 53.7799 32.1823 53.054"
                                                                                                                                fill="#DD7017" />
                                                                                                                            <path
                                                                                                                                d="M36.5322 54.1077C36.7436 54.0692 36.9279 53.9666 37.0701 53.8236C37.2932 53.599 37.4095 53.2754 37.3542 52.9433C37.2633 52.401 36.7489 52.0419 36.2043 52.1417C35.1002 52.3449 33.7997 51.7945 32.9993 51.1583C32.6617 50.8896 32.2017 50.8887 31.8521 51.1098C31.9586 51.7544 32.0694 52.4017 32.183 53.0533C33.2839 53.7792 34.9301 54.4032 36.5322 54.1077Z"
                                                                                                                                fill="#DD7017" />
                                                                                                                            <path
                                                                                                                                d="M45.8624 60.3893C44.7737 61.2361 42.9331 62.0891 41.1557 61.8023C40.6121 61.7141 40.2505 61.2027 40.3468 60.6574C40.4432 60.1108 40.964 59.7413 41.5061 59.8281C42.608 60.005 43.915 59.4234 44.7221 58.7686C45.1544 58.4179 45.7829 58.4796 46.1259 58.9058C46.1456 58.9296 46.1518 58.9599 46.1686 58.9851"
                                                                                                                                fill="#DD7017" />
                                                                                                                            <path
                                                                                                                                d="M44.7228 58.7693C43.9157 59.4241 42.6073 60.0057 41.5068 59.8288C40.964 59.7413 40.4447 60.1108 40.3476 60.6581C40.2505 61.2027 40.6121 61.7156 41.1564 61.803C42.9346 62.0891 44.7744 61.2368 45.8631 60.39C45.9668 59.9245 46.0684 59.4555 46.17 58.9865C46.1532 58.9613 46.147 58.931 46.1273 58.9072C45.785 58.4803 45.1551 58.4186 44.7228 58.7693Z"
                                                                                                                                fill="#DD7017" />
                                                                                                                        </g>
                                                                                                                        <defs>
                                                                                                                            <clipPath id="clip0">
                                                                                                                                <rect y="40.4309" width="57" height="56" transform="rotate(-45.1791 0 40.4309)" fill="white" />
                                                                                                                            </clipPath>
                                                                                                                        </defs>
                                                                                                                    </svg>
                                                                                                                    <h1>Food <span class="orange">Ex</span> </h1>
                                                                                                                </div>
                                                                                                                
                                                                                                                <h1>Thanks for choosing FoodEx</h1>
                                                                                                                <button><a href="localhost:5000/restaurants/verify/${email}/${verificationCode}">Verify Your Email</a></button>
                                                                                                            </div>
                                                                                                        </body>
                                                                                                        </html>
                                                                                                        ` //mail body
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
                        });
                    } else {
                        fs.unlink(tempPath, err => {
                            if (err) res.send(err)
                            else {
                                res.render('register_rest', { alert: 'true', msg: "Only .jpg files are allowed!" });
                            }
                        });
                    }
                }
            }
        )
    }
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (email.includes('"') || email.includes("'") || email.includes(';') || email.includes('-') || email.includes('<') || email.includes('>') || email.includes('/')) {
        res.render('login_rest', { alert: 'true', msg: 'Email ID cannot have any of the following characters: \n" \' ; - / or greater/lesser than symbols' });
    }
    else if (password.includes('"') || password.includes("'") || password.includes(';') || password.includes('-') || password.includes('<') || password.includes('>') || password.includes('/')) {
        res.render('login_rest', { alert: 'true', msg: 'Password cannot have any of the following characters: \n" \' ; - / or greater/lesser than symbols' });
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
                                        service: 'hotmail',
                                        auth: {
                                            user: 'foodex_server@outlook.com', //replace with your own credentials
                                            pass: 'xedooF_ghost<3'
                                        }
                                    });

                                    var mailOptions = {
                                        from: 'foodex_server@outlook.com',
                                        to: email,
                                        subject: 'Verify your email',
                                        html:
                                        `
                                        <!DOCTYPE html>
                                        <html lang="en">
                                        <head>
                                            <meta charset="UTF-8">
                                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                            <title>Document</title>
                                            <style>
                                                *{
                                                    font-family: Arial, Helvetica, sans-serif;
                                                }
                                                .container{
                                                    /* border: solid; */
                                                    width: 500px;
                                                    display: flex;
                                                    flex-direction: column;
                                                    align-items: center;
                                                    margin: 0 auto;
                                                }
                                                .brand{
                                                    display: flex;
                                                    flex-direction: column;
                                                    align-items: center;
                                                    /* border: solid; */
                                                    /* height: 200px; */
                                                    justify-content: space-between;
                                                }
                                                .orange{
                                                    color: orange;
                                                    /* border: solid; */
                                                    margin-left: -25px;
                                                }
                                                .brand h1{
                                                    color: green;
                                                    /* border: saddlebrown solid ; */
                                                    font-size: 4em;
                                                }
                                                button{
                                                    border: orange 2px solid;
                                                    padding: 10px;
                                                    border-radius: 30px;
                                                    background-color: orange;
                                                    color: white;

                                                }
                                                button:hover{
                                                    cursor: pointer;
                                                transform: scale(1.05);
                                                }
                                                button a{
                                                    color: white;
                                                    text-decoration: none;
                                                    font-weight: 700;
                                                    font-size: 1.5em;
                                                }
                                                @media (max-width:500px) {
                                                    .container{
                                                        width: 400px;
                                                    }
                                                    h1{
                                                        font-size: 1.4em;
                                                    }
                                                    
                                                }
                                            </style>
                                        </head>
                                        <body>
                                            <div class="container">
                                                <div class="brand">
                                                    <svg width="180" height="180" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <g clip-path="url(#clip0)">
                                                            <path
                                                                d="M40.6731 31.5515C40.6731 31.5515 44.304 17.6177 57.1358 19.2319C57.1358 19.2319 60.2309 19.4196 60.7016 22.1075C61.1634 24.751 58.3949 26.8764 55.5336 26.4606C52.9526 26.0859 48.4275 26.8665 40.6731 31.5515Z"
                                                                fill="#88C057" />
                                                            <path
                                                                d="M40.6731 31.5515C40.6731 31.5515 37.4697 17.6995 25.5886 19.6097C25.5886 19.6097 21.3137 19.8885 19.985 22.6573C18.7487 25.2321 21.3202 27.8871 24.0611 27.1116C27.0653 26.2624 32.4066 26.3171 40.6731 31.5515Z"
                                                                fill="#88C057" />
                                                            <path
                                                                d="M57.3986 19.8612C57.3986 19.8612 57.5066 19.8733 57.6527 19.8935C57.6738 19.5491 57.6765 19.1979 57.6334 18.8338C57.2385 15.4794 54.6002 15.2312 54.6002 15.2312C43.6661 13.1575 40.5391 30.5144 40.5391 30.5144C41.0653 30.0524 41.5694 29.6322 42.0613 29.23C43.9318 25.2372 48.4021 18.7296 57.3986 19.8612Z"
                                                                fill="#88C057" />
                                                            <path
                                                                d="M25.5893 19.609C34.754 18.1348 38.7532 26.0376 40.1035 29.729C40.1625 29.7834 40.218 29.83 40.2771 29.8844C40.2771 29.8844 37.5773 12.5973 27.4461 14.9232C27.4461 14.9232 23.8012 15.2509 22.663 18.6965C22.4674 19.2882 22.3842 19.8834 22.3901 20.455C23.9523 19.7177 25.5893 19.609 25.5893 19.609Z"
                                                                fill="#A4E869" />
                                                            <path
                                                                d="M40.1663 8.62773C35.9144 9.58593 35.1315 15.3873 35.1315 15.3873C35.2321 16.5788 35.4323 17.7685 35.6899 18.9383C38.5027 22.6404 39.8805 28.3149 40.398 30.9697C40.5554 31.2526 40.6953 31.4983 40.7975 31.6737C41.2141 29.6075 42.5986 23.7587 45.5722 19.6128C45.8759 18.1522 46.0815 16.6764 46.1242 15.2564C46.3543 7.64636 40.1663 8.62773 40.1663 8.62773Z"
                                                                fill="#659C35" />
                                                            <path
                                                                d="M40.6731 31.5515C40.6731 31.5515 44.304 17.6177 57.1358 19.2319C57.1358 19.2319 60.2309 19.4196 60.7016 22.1075C61.1634 24.751 58.3949 26.8764 55.5336 26.4606C52.9526 26.0859 48.4275 26.8665 40.6731 31.5515Z"
                                                                fill="#A4E869" />
                                                            <path
                                                                d="M40.3864 30.2845C40.571 30.8673 40.6531 31.2204 40.6531 31.2204C40.6531 31.2204 40.7918 30.693 41.1053 29.8618C40.8692 29.9982 40.6324 30.1367 40.3864 30.2845Z"
                                                                fill="#F2681C" />
                                                            <path
                                                                d="M49.5781 30.2755C49.0539 29.1561 48.219 28.3634 47.2628 27.787C45.3732 28.5798 43.1885 29.6878 40.6531 31.2204C37.93 29.4964 35.5315 28.3423 33.4225 27.5895C32.1782 28.2051 31.0524 29.1117 30.3916 30.5045C28.3182 34.8756 34.2914 69.0933 38.66 78.7235C39.071 79.6293 40.1119 79.6162 40.5325 78.701C45.012 68.9649 51.601 34.5968 49.5781 30.2755Z"
                                                                fill="#ED8F20" />
                                                            <path
                                                                d="M38.773 67.2561C38.0678 67.5133 37.3262 67.7073 36.5688 67.8329C36.0214 67.9229 35.6461 68.4382 35.727 68.9821C35.808 69.5259 36.316 69.8943 36.8613 69.8037C37.7418 69.6582 38.6058 69.4323 39.4278 69.1321C39.573 69.0787 39.6999 68.996 39.803 68.8923C40.0681 68.6255 40.1749 68.2229 40.0449 67.8493C39.8635 67.3321 39.2934 67.0655 38.773 67.2561Z"
                                                                fill="#DD7017" />
                                                            <path
                                                                d="M47.3781 31.8528C45.3761 32.7713 43.0415 33.1504 40.441 32.9781C39.8908 32.9416 39.4079 33.3586 39.3617 33.9096C39.3154 34.4606 39.7239 34.9362 40.2741 34.9727C43.2116 35.1672 45.8736 34.7283 48.1859 33.6675C48.2999 33.6146 48.4007 33.5441 48.4852 33.459C48.7716 33.1708 48.8681 32.7281 48.6965 32.3401C48.4733 31.8396 47.8832 31.6213 47.3781 31.8528Z"
                                                                fill="#DD7017" />
                                                            <path
                                                                d="M30.1622 38.1096C30.5096 37.9019 30.9611 37.9071 31.2938 38.1709C32.5676 39.1823 34.6526 40.0562 36.4407 39.7253C36.9846 39.6248 37.4997 39.9832 37.5906 40.5269C37.6466 40.8583 37.5296 41.1827 37.3065 41.4072C37.165 41.5495 36.9807 41.6521 36.7685 41.6913C34.3552 42.1371 31.8664 41.0781 30.3269 39.9575"
                                                                fill="#DD7017" />
                                                            <path
                                                                d="M36.7685 41.6913C36.98 41.6528 37.1643 41.5502 37.3065 41.4072C37.5296 41.1827 37.6466 40.8583 37.5906 40.5269C37.499 39.9839 36.9853 39.6255 36.4407 39.7253C34.6526 40.0548 32.5669 39.1817 31.2938 38.1709C30.9618 37.9078 30.5096 37.9019 30.1622 38.1096C30.2097 38.704 30.2627 39.3166 30.3262 39.9568C31.8664 41.0781 34.3552 42.1371 36.7685 41.6913Z"
                                                                fill="#DD7017" />
                                                            <path
                                                                d="M48.6704 45.6633C47.1123 46.8012 44.6509 47.8786 42.2804 47.4972C41.7376 47.4097 41.3759 46.8968 41.4723 46.3515C41.5687 45.8077 42.0887 45.4362 42.6323 45.5229C44.4154 45.8097 46.5121 44.8872 47.7976 43.8451C48.1426 43.5654 48.6055 43.5591 48.9554 43.7789"
                                                                fill="#DD7017" />
                                                            <path
                                                                d="M47.7984 43.8444C46.5121 44.8872 44.4161 45.8104 42.633 45.5222C42.0901 45.4347 41.5687 45.8063 41.473 46.3508C41.3752 46.8961 41.7369 47.409 42.2811 47.4964C44.6516 47.8779 47.113 46.8005 48.6712 45.6626C48.7709 45.0241 48.8671 44.3961 48.9568 43.7789C48.6062 43.5584 48.1426 43.5654 47.7984 43.8444Z"
                                                                fill="#DD7017" />
                                                            <path
                                                                d="M31.8514 51.1105C32.201 50.8908 32.661 50.8917 32.9986 51.159C33.7983 51.7945 35.1002 52.3449 36.2036 52.1424C36.7475 52.0419 37.2626 52.4003 37.3535 52.944C37.4088 53.2761 37.2925 53.5997 37.0694 53.8243C36.9279 53.9666 36.7436 54.0691 36.5315 54.1084C34.9294 54.4039 33.2832 53.7799 32.1823 53.054"
                                                                fill="#DD7017" />
                                                            <path
                                                                d="M36.5322 54.1077C36.7436 54.0692 36.9279 53.9666 37.0701 53.8236C37.2932 53.599 37.4095 53.2754 37.3542 52.9433C37.2633 52.401 36.7489 52.0419 36.2043 52.1417C35.1002 52.3449 33.7997 51.7945 32.9993 51.1583C32.6617 50.8896 32.2017 50.8887 31.8521 51.1098C31.9586 51.7544 32.0694 52.4017 32.183 53.0533C33.2839 53.7792 34.9301 54.4032 36.5322 54.1077Z"
                                                                fill="#DD7017" />
                                                            <path
                                                                d="M45.8624 60.3893C44.7737 61.2361 42.9331 62.0891 41.1557 61.8023C40.6121 61.7141 40.2505 61.2027 40.3468 60.6574C40.4432 60.1108 40.964 59.7413 41.5061 59.8281C42.608 60.005 43.915 59.4234 44.7221 58.7686C45.1544 58.4179 45.7829 58.4796 46.1259 58.9058C46.1456 58.9296 46.1518 58.9599 46.1686 58.9851"
                                                                fill="#DD7017" />
                                                            <path
                                                                d="M44.7228 58.7693C43.9157 59.4241 42.6073 60.0057 41.5068 59.8288C40.964 59.7413 40.4447 60.1108 40.3476 60.6581C40.2505 61.2027 40.6121 61.7156 41.1564 61.803C42.9346 62.0891 44.7744 61.2368 45.8631 60.39C45.9668 59.9245 46.0684 59.4555 46.17 58.9865C46.1532 58.9613 46.147 58.931 46.1273 58.9072C45.785 58.4803 45.1551 58.4186 44.7228 58.7693Z"
                                                                fill="#DD7017" />
                                                        </g>
                                                        <defs>
                                                            <clipPath id="clip0">
                                                                <rect y="40.4309" width="57" height="56" transform="rotate(-45.1791 0 40.4309)" fill="white" />
                                                            </clipPath>
                                                        </defs>
                                                    </svg>
                                                    <h1>Food <span class="orange">Ex</span> </h1>
                                                </div>
                                                
                                                <h1>Thanks for choosing FoodEx</h1>
                                                <button><a href="localhost:5000/restaurants/verify/${email}/${verificationCode}">Verify Your Email</a></button>
                                            </div>
                                        </body>
                                        </html>                                                                                                      
                                        ` //mail body
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
    res.render('verification', { alert: 'false', msg: '' });
});

router.get('/verify/:email/:code', (req, res) => {
    mySqlConnection.query(
        'select * from verify where email = ?',
        [req.params.email],
        (err, rows) => {
            if (err)
                res.status(500).send(err)
            else if (!rows)
                res.render('register_rest', { alert: 'true', msg: 'Could not verify as there is no such account. Please register and try again' })
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
                    res.render('verification', { alert: 'true', msg: 'Incorrect verification code. Try again' })
                }
            }
        }
    )
});

module.exports = router