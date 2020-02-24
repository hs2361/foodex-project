const express = require('express');
const router = express.Router();
const mySqlConnection = require("../db/database");
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

//get request for dashboard, will ask for login if cookie is not found
router.get('/dashboard', (req, res) => 
{
    if (req.session.user)
        res.status(200).send(req.session.user)
    else
        res.status(401).send('login for this');

    
});

//get request for signup, will inform user 'already logged in' if cookie exists
router.get('/signup', (req,res) => 
{
    if (req.session.user)
        res.status(401).send('already logged in')
    else
        res.status(200).send('sign up form');
});

//get request for login, will inform user 'already logged in' if cookie exists
router.get('/login', (req,res) => 
{
    if (req.session.user)
        res.status(401).send('already logged in')
    else
        res.status(200).send('login form');
});

//post request for signup
router.post('/signup', (req,res) => 
{
    const { name, email, password, password2, phone, address } = req.body; //assigns request body to data fields
    let errors = []; //list of errors
    if (!name || !email || !password || !password2 || !phone || !address) //checks if any field in body is missing
    {
        errors.push({ msg: "Please enter all fields" });
    }
    
    if (password != password2) //checks if password and confirmation password match
    {
        errors.push({ msg: "Passwords do not match" });
    }
     
    if (password.length < 8) //checks if password is too short
    {
        errors.push({ msg: "Password must be at least 8 characters" });
    }
    
    mySqlConnection.query(
        "SELECT * FROM users WHERE email = ?", //sql query to search restaurant data
        [email], //email from request body
        (err, rows) => 
        {
            if (err)
                res.status(500).send(err); //sets status to internal server error
            else if (rows.length) //checks if sql query returned any rows or not
                errors.push({ msg: "Email already exists" });
            if (errors.length) //checks if any errors have been logged
                res.status(400).send(errors);
            else  
            {
                let pwdHash = bcrypt.hashSync(password, 10);
                var sql = `INSERT INTO restaurants (rname, email, phone, passHash, address, verified) VALUES ?`; //sql query to insert data into table
                const values = [[name, email, phone, pwdHash, address, 0]]; 
                
                mySqlConnection.query(sql, [values], function(err) 
                {
                    if (err) res.status(500).send(err); //if there is an error it is sent to client
                    else{
                        const verificationCode = Math.floor(Math.random()*1000000);
                        console.log(verificationCode);
                        mySqlConnection.query(
                            'select * from verify where (?)',
                            [[email, verificationCode]],
                            (err) => {
                                if (err) 
                                    res.status(500).send(err);
                                else 
                                {
                                    var transporter = nodemailer.createTransport({
                                        service: 'gmail',
                                        auth: {
                                            user: 'sweetharsh236@gmail.com',
                                            pass: 'BBitbs!2306'
                                        }
                                    });
                                    
                                    // console.log('made transport');
                                    
                                    var mailOptions = {
                                        from: 'sweetharsh236@gmail.com',
                                        to: email,
                                        subject: 'Verify your email',
                                        text: `localhost:5000/users/verify/${email}/${verificationCode}`
                                    };
                                    
                                    // console.log('made mail body');
                                    transporter.sendMail(mailOptions, function(error, info){
                                        if (error) {
                                            res.status(500).send(error);
                                        } else {
                                            console.log('Verification email sent: ' + info.response);
                                        }
                                    });
                                    res.status(200).send("successfully registered");
                                    // res.redirect('/verify');
                                }
                            })
                        }
                });
            }
        }
    );
});

router.post('/login', (req,res) => {
    const { email, password } = req.body
    mySqlConnection.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        (err, rows) => {
            if (err) 
                res.status(500).send(err)
            user = rows[0]
            if (user) 
            {
                const result = bcrypt.compareSync(password, user.passHash);
                const isVerified = user.verified;
                // console.log(isVerified);
                if (result && isVerified) 
                {
                    req.session.user = user
                    res.status(200).send(user)
                } 
                else if(!isVerified)
                {
                    console.log(req.headers.host);
                    res.redirect('/users/verify');
                }
                else
                {
                    res.status(400).send("pwd incorrect")
                }
            } 

            else 
            {
                res.status(400).send("email doesnot exist")
            }
        },
    )
})

router.get('/logout', (req,res) => {
    if(req.session.user){
        req.session.destroy(() => {
            res.status(200).send("logout success")
        });
    }

    else{
        res.status(400).send("Not logged in");
    }
})

router.get('/verify', (req,res) => {
    res.status(200).send('verification page');
})

router.get('/verify/:email/:code', (req,res) => {

    if(req.params)
    {
        mySqlConnection.query(
            'select *from verify where email = ?',
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
                            'update users set verified = true where email = ?',
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
})



module.exports = router