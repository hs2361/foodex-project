const express = require('express');
const router = express.Router();
const mySqlConnection = require("../db/database");
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

//get request handling /restaurants. redirects to profile if logged in, else to login page
router.get('/', (req, res) => {
    if(req.session.user) {
        if(req.session.user.rid) {
            res.redirect('/restaurants/profile');
        }
        else {
            res.status(401).send('Login as restaurant for this');
        }
    }
    else {
        res.redirect('/restaurants/login');
    }
});

//get request for profile
router.get('/profile', (req, res) => {
    if(req.session.user) {
        if(req.session.user.rid) {
            mySqlConnection.query(
                `select * from restaurants where rid = ${req.session.user.rid}`,
                [],
                (err, rows) => {
                    if(err) {
                        res.status(500).send(err);
                    }
                    else if(!rows) {
                        res.status(500).send('login again');
                    }
                    else {
                        res.send(rows);
                    }
                }
            );
        }
        else {
            res.status(401).send('Login as restaurant for this');
        }
    }
    else {
        res.redirect('/restaurants/login');
    }
});

router.get('/profile/edit', (req, res) => {
    if(req.session.user) {
        if(req.session.user.rid) {
            res.status(200).send('profile edit form');
        }
        else {
            res.status(401).send('Login as restaurant for this');
        }
    }
    else {
        res.redirect('/restaurants/login');
    }
});

router.post('/profile/edit', (req, res) => {
    if(req.session.user) {
        if(req.session.user.rid) {
            const { name, email, phone, address } = req.body;
            mySqlConnection.query(
                `UPDATE TABLE restaurants SET name = ${name}, email = ${email}, phone = ${phone}, address = ${address} WHERE rid = ${req.session.user.rid}`,
                [],
                (err, rows) => {
                    if(err) {
                        res.status(500).send(err);
                    }
                    else {
                        res.status(200).send('Profile updated');
                    }
                }
            );
        }
        else {
            res.status(401).send('Login as restaurant for this');
        }
    }
    else {
        res.redirect('/restaurants/login');
    }
});

//get request for signup, will inform user 'already logged in' if cookie exists
router.get('/signup', (req, res) => 
{
    if (req.session.user) {
        if (req.session.user.rid) {
            res.status(400).send('already logged in');
        }
        else {
            res.status(401).send('not a restaurant');
        }
    }
    else {
        res.render('register_rest');
    }
});

//get request for login, will inform user 'already logged in' if cookie exists
router.get('/login', (req,res) => 
{
    if (req.session.user) {
        if(req.session.user.rid) {
            res.status(400).send('already logged in');
        }
        else {
            res.status(401).send('not a restaurant');
        }
    }
    else {
        res.render('login_rest');
    }
});

//post request for signup, also sends verification email
router.post('/signup', (req, res) => //POST request at /signup endpoint
{
    const { name, email, password, password2, phone, address, category } = req.body; //destructuring req.body object received from form
    let errors = []; //errors array
    if (!name || !email || !password || !password2 || !phone || !address || !category) //empty fields
    {
        errors.push({ msg: "Please enter all fields" });
    }

    if (password != password2) //confirm password
    {
        errors.push({ msg: "Passwords do not match" });
    }


    if (password.length < 8) //password length
    {
        errors.push({ msg: "Password must be at least 8 characters" });
    }

    mySqlConnection.query(
        "SELECT * FROM restaurants WHERE email = ?", //check for existing users
        [email],
        (err, rows) => {
            if (err)
                res.status(500).send(err); //internal server error
            else if (rows.length)
                errors.push({ msg: "Email already exists" });
            if (errors.length)
                res.status(400).send(errors); //send errors with 'bad request'
            else {
                mySqlConnection.query(
                    "SELECT * FROM users WHERE email = ?",
                    [email],
                    (err, rows) => {
                        if(err)
                            res.status(500).send(err);
                        else if (rows.length) {
                            errors.push({ msg : "Cannot register restaurant with user email id" });
                        }
                        if (errors.length) {
                            res.status(400).send(errors);                            
                        }
                        else {
                            pwdHash = bcrypt.hashSync(password, 10); //hashing the password
                            var sql = `INSERT INTO restaurants (rname, email, phone, passHash, address, verified, category) VALUES ?`; //insertion query
                            const values = [[name, email, phone, pwdHash, address, 0, category]];

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
                                                    } else {
                                                        console.log('Verification email sent: ' + info.response); //mail sent
                                                    }
                                                });
                                                res.redirect('/restaurants/verify'); //redirect to verify page
                                            }
                                        });
                                }
                            });
                        }
                    }
                );
            }
        }
    );
});

router.post('/login', (req,res) => {
    const { email, password } = req.body;
    mySqlConnection.query(
        "SELECT * FROM restaurants WHERE email = ?",
        [email],
        (err, rows) => {
            const user = rows[0];
            if (err) 
                res.status(500).send(err); 
            else if (user) 
            {
                const result = bcrypt.compareSync(password, user.passHash);
                const isVerified = user.verified;
                if (result && isVerified) 
                {
                    req.session.user = user;
                    mySqlConnection.query(
                        `CREATE TABLE IF NOT EXISTS menu_${user.rid} (
                            did INT PRIMARY KEY AUTO_INCREMENT,
                            dname VARCHAR(255),
                            price INT,
                            rating INT
                        );`,
                        [],
                        (err, rows) => {
                            if(err) {
                                res.status(500).send(err);
                            }
                            else {
                                res.send(user); 
                            }
                        }
                    )
                } 
                else if(!isVerified)
                {
                    res.redirect('/restaurants/verify');
                }
                else
                {
                    res.status(400).send("pwd incorrect");
                }
            } 

            else 
            {
                res.status(400).send("email does not exist");
            }
        }
    )
})

router.get('/logout', (req,res) => {
    if(req.session.user){
        req.session.destroy(() => {
            res.status(200).send("logout success");
        });
    }

    else{
        res.status(400).send("Not logged in");
    }
    //redirect to landing page
});

router.get('/verify', (req,res) => {
    res.status(200).sendFile(__dirname.replace('\\routes', '/frontend/verification.html'));
});

router.get('/verify/:email/:code', (req,res) => {

    if(req.params)
    {
        mySqlConnection.query(
            'select * from verify where email = ?',
            [req.params.email],
            (err,rows) => {
                if(err)
                    res.status(500).send(err)
                else if (!rows)
                    res.status(400).send('account does not exist')
                else{
                    if(rows[0].code == req.params.code)
                    {
                        mySqlConnection.query(
                            'update restaurants set verified = true where email = ?',
                            [req.params.email],
                            (err) => {
                                if(err)
                                    res.status(500).send(err);
                                else {
                                    res.status(200).send('email successfully verified');
                                }
                            }
                        )
                        
                    }
                    else{
                        res.status(400).send("couldn't verify your email")
                    }
                }
            }
        )
    }

    else{
        res.status(200).send('verification page');
    }
});

module.exports = router