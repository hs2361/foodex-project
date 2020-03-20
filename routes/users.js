const express = require('express');
const router = express.Router();
const mySqlConnection = require("../db/database"); //importing database connection
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer"); //importing modules

//get request handling /restaurants. redirects to profile if logged in, else to login page
router.get('/', (req, res) => {
    if(req.session.user) {
        if(req.session.user.uid) {
            res.redirect('/users/profile');
        }
        else {
            res.status(401).send('Login as user for this');
        }
    }
    else {
        res.redirect('/users/login');
    }
});

//get request for profile
router.get('/profile', (req, res) => {
    if(req.session.user) {
        if(req.session.user.uid) {
            mySqlConnection.query(
                `select * from users where uid = ${req.session.user.uid}`,
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
            res.status(401).send('Login as user for this');
        }
    }
    else {
        res.redirect('/users/login');
    }
});

router.get('/profile/edit', (req, res) => {
    if(req.session.user) {
        if(req.session.user.uid) {
            res.status(200).send('profile edit form');
        }
        else {
            res.status(401).send('Login as user for this');
        }
    }
    else {
        res.redirect('/users/login');
    }
});

router.post('/profile/edit', (req, res) => {
    if(req.session.user) {
        if(req.session.user.uid) {
            const { name, email, phone, address } = req.body;
            mySqlConnection.query(
                `UPDATE TABLE users SET name = ${name}, email = ${email}, phone = ${phone}, address = ${address} WHERE uid = ${req.session.user.uid}`,
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
            res.status(401).send('Login as user for this');
        }
    }
    else {
        res.redirect('/users/login');
    }
});

router.get('/signup', (req, res) => 
{
    if (req.session.user) {
        if (req.session.user.uid) {
            res.render('register_user', { alert : 'true', msg : 'already logged in' });
        }
        else {
            res.render('register_user', { alert : 'true', msg : 'not a user' });
        }
    }
    else {  
        res.render('register_user', { alert : 'false', msg : '' });
    }
});

router.get('/login', (req,res) => 
{
    if (req.session.user) {
        if(req.session.user.uid) {
            res.render('login_user', { alert : 'true', msg : 'already logged in' });
        }
        else {
            res.render('login_user', { alert : 'true', msg : 'not a user' });
        }
    }
    else {
        res.render('login_user', { alert : 'false', msg : '' });
    }
});

router.post('/signup', (req, res) => //POST request at /signup endpoint
{
    const { name, email, password, password2, phone, address } = req.body; //destructuring req.body object received from form
    let errors = []; //errors array
  

    mySqlConnection.query(
        "SELECT * FROM users WHERE email = ?", //check for existing users
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
                    "SELECT * FROM restaurants WHERE email = ?",
                    [email],
                    (err, rows) => {
                        if(err)
                            res.status(500).send(err);
                        else if (rows.length) {
                            errors.push({ msg : "Cannot register user with restaurant email id" });
                        }
                        if (errors.length) {
                            res.status(400).send(errors);                            
                        }
                        else {
                            pwdHash = bcrypt.hashSync(password, 10); //hashing the password
                            var sql = `INSERT INTO users (uname, email, phone, passHash, address, verified) VALUES ?`; //insertion query
                            const values = [[name, email, phone, pwdHash, address, 0]];

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
                                                    text: `localhost:5000/users/verify/${email}/${verificationCode}` //mail body
                                                };

                                                transporter.sendMail(mailOptions, function (error, info) { //send mail
                                                    if (error) {
                                                        res.status(500).send(error); //internal server error
                                                    } else {
                                                        console.log('Verification email sent: ' + info.response); //mail sent
                                                    }
                                                });
                                                res.redirect('/users/verify'); //redirect to verify page
                                            }
                                        });
                                }
                            });
                        }
                    }
                )
            }
        }
    );
});

router.post('/login', (req, res) => { //POST request at /login endpoint
    const { email, password } = req.body //destructuring req.body object received from form
    mySqlConnection.query(
        "SELECT * FROM users WHERE email = ?", //check whether user exists
        [email],
        (err, rows) => {
            if (err)
                res.status(500).send(err) //internal server error
            user = rows[0] //first row from response
            if (user) {
                const result = bcrypt.compareSync(password, user.passHash); //check password
                const isVerified = user.verified; //check whether email is verified

                if (result && isVerified) // if password is correct and user is verified
                {
                    req.session.user = user //assign a session using a cookie
                    res.status(200).send(user) //send user details
                }
                else if (!isVerified) //if not verified
                {
                    res.redirect('/users/verify'); //reditect to /verify endpoint
                }
                else {
                    res.status(400).send("pwd incorrect") //wrong password
                }
            }

            else {
                res.status(400).send("email doesnot exist") //bad request
            }
        },
    )
})

router.get('/logout', (req, res) => { //GET request at /logout endpoint
    if (req.session.user) {
        req.session.destroy((err) => { //destroy the cookie session
            if(err)
                res.status(500).send("logout failed"); //internal server error
            else
                res.status(200).send("logout success");
        });
    }

    else {
        res.status(400).send("Not logged in"); //bad request
    }
})

router.get('/verify', (req, res) => { //GET request at /verify endpoint without params
    res.render('verification');
})

// router.post('/verify', (req,res) => { //POST request at /verify endpoint with email and code
//     const {email,code} = req.body;
//     res.redirect(`/users/verify/${email}/${code}`); //redirects to /verify endpoint with params
// })

router.get('/verify/:email/:code', (req, res) => { //GET request at /verify endpoint with email and code params

    if (req.params) //non-empty params
    {
        mySqlConnection.query(
            'select *from verify where email = ?', //check whether user is in verify table
            [req.params.email],
            (err, rows) => {
                if (err)
                    res.status(500).send(err) //internal server error
                else if (!rows)
                    res.status(400).send('account does not exist') //bad request
                else {
                    if (rows[0].code == req.params.code) //check verification code
                    {
                        mySqlConnection.query(
                            'update users set verified = true where email = ?', //set user account as verified
                            [req.params.email],
                            (err) => {
                                if (err)
                                    res.status(500).send(err); //internal server error
                                else {
                                    mySqlConnection.query(
                                        'delete from verify where email = ?', //remove data from verify table
                                        [req.params.email],
                                        (err) => {
                                            if (err)
                                                res.status(500).send(err); //internal server error
                                            else
                                                res.status(200).send('email successfully verified');
                                        }
                                    )
                                }
                            }
                        )

                    }

                    else {
                        console.log(req.params.code);
                        console.log(rows[0].code);
                        res.status(400).send("couldn't verify your email") //wrong code
                    }
                }
            }
        )
    }

    else {
        res.render('verification');    //for empty params
    }
})

module.exports = router //export statement