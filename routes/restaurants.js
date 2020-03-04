const express = require('express');
const router = express.Router();
const mySqlConnection = require("../db/database");
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

router.get('/', (req, res) => {
    try {
        if(req.session.user.rid) {
            res.status(200).redirect(`/restaurants/${rid}`);
        }
    }
    catch {
        res.status(400).send('Login as restaurant for this');
    }
});

router.get('/:rid', (req, res) => {
    try {
        if(req.session.user.rid) {
            if(req.session.user.rid == req.params.rid) {
                res.send('profile page');
            }
            else {
                res.status(401).send('Login again');
            }
        }
    }
    catch {
        res.status(400).send('Login as restaurant for this');
    }
});

//get request for signup, will inform user 'already logged in' if cookie exists
router.get('/signup', (req, res) => 
{
    try {
        if (req.session.user)
            res.status(401).send('already logged in')
    }
    catch {
        res.status(200).sendFile(__dirname.replace('\\routes', '/frontend/register_rest.html'), (err) => {
            if(err) {
                res.status(400).send(err);
            }
        });
    }
});

//get request for login, will inform user 'already logged in' if cookie exists
router.get('/login', (req,res) => 
{
    try {
        if (req.session.user)
            res.status(400).send('already logged in');
    }
    catch {
        res.status(200).sendFile(__dirname.replace('\\routes', '/frontend/login_rest.html'), (err) => {
            if(err) {
                res.status(400).send(err);
            }
        });
    }
});

//post request for signup, also sends verification email
router.post('/signup', (req, res) => //POST request at /signup endpoint
{
    const { name, email, password, password2, phone, address } = req.body; //destructuring req.body object received from form
    let errors = []; //errors array
    if (!name || !email || !password || !password2 || !phone || !address) //empty fields
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
                            var sql = `INSERT INTO restaurants (rname, email, phone, passHash, address, verified) VALUES ?`; //insertion query
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
                                        })
                                }
                            });
                        }
                    }
                )
                
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
            if (err) 
                res.status(500).send(err); 
            const user = rows[0]
            if (user) 
            {
                const result = bcrypt.compareSync(password, user.passHash);
                const isVerified = user.verified;
                // console.log(isVerified);
                if (result && isVerified) 
                {
                    req.session.user = user;
                    res.status(200).send(user);
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

router.get('/logout', (req, res) => { //GET request at /logout endpoint
    try {
        if (req.session.user) {
            req.session.destroy((err) => { //destroy the cookie session
                if(err)
                    res.status(500).send("logout failed"); //internal server error
                else
                    res.redirect('/');
            });
        }
    }
    catch {
        res.status(400).send("Not logged in"); //bad request
    }
});

router.get('/verify', (req,res) => {
    res.status(200).sendFile(__dirname.replace("\\routes","/frontend/verification.html"));
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
                                else
                                    res.status(200).send('email successfully verified');
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