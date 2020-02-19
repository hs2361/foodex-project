const express = require('express');
const router = express.Router();
const mySqlConnection = require("../db/database");
const bcrypt = require('bcrypt');

router.get('/dashboard', (req, res) => 
{
  if (req.session.user)
    res.status(200).send(req.session.user)
  else
    res.status(401).send('login for this');
});


router.get('/signup', (req,res) => 
{
    if (req.session.user)
        res.status(401).send('already logged in')
    else
        res.status(200).send('sign up form');
})

router.get('/login', (req,res) => 
{
    if (req.session.user)
        res.status(401).send('already logged in')
    else
        res.status(200).send('login form');
})

router.post('/signup', (req,res) => 
{
    const { name, email, password, password2, phone, address } = req.body;
    let errors = [];
    if (!name || !email || !password || !password2 || !phone || !address) 
    {
        errors.push({ msg: "Please enter all fields" });
    }
    
    if (password != password2) 
    {
        errors.push({ msg: "Passwords do not match" });
    }
    
     
    if (password.length < 8) 
    {
        errors.push({ msg: "Password must be at least 8 characters" });
    }
    
    mySqlConnection.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        (err, rows) => 
        {
            if (err)
                res.status(500).send(err);
            else if (rows.length) 
                errors.push({ msg: "Email already exists" });
            if (errors.length) 
                res.status(400).send(errors);
            else 
            {
                pwdHash = bcrypt.hashSync(password, 10);
                var sql = `INSERT INTO users (uname, email, phone, passHash, address) VALUES ?`;
                const values = [[name, email, phone, pwdHash, address]]; 
                
                mySqlConnection.query(sql, [values], function(err) 
                {
                    if (err) res.status(500).send(err);
                    else res.status(200).send("successfully registered");
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
                const result = bcrypt.compareSync(password, user.passHash)
                if (result) 
                {
                    req.session.user = user
                    res.status(200).send(user)
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

module.exports = router