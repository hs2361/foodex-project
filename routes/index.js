const express = require('express');
const router = express.Router();
const mySqlConnection = require("../db/database");

router.get('/', (req, res) => 
{
    res.sendFile( __dirname.replace("\\routes","") + "/frontend/landing.html",(err) => {
        if(err)
            res.send(err);
    }
)}); //home page

/*-----------------------------------------------------------------------------------*/
//restaurant dashboard backend:

//get request for dashboard, will ask for login if cookie is not found
router.get('/rdashboard', (req, res) => 
{
    try {
        mySqlConnection.query(
            `select * from orders where rid = ${req.session.user.rid} and delivered = 0`,
            [],
            (err, rows) => {
                if(err)
                    res.status(500).send(err);
                else if(!rows) 
                    res.send("No running orders ");
                else 
                    res.send(rows);
            }
        )
    }
    catch {
        res.status(401).send('login as restaurant for this');
    }
});

//get request for rest menu, will simply display menu to restaurant
router.get('/rdashboard/menu', (req, res) => {
    if(req.session.user.rid) {
        mySqlConnection.query(
            `select * from menu_${req.session.user.rid}`,
            [],
            (err, rows) => {
                if(err) {
                    res.status(500).send(err);
                }
                else if(!rows) {
                    res.status(400).send('no menu for this restaurant');
                }
                else {
                    res.send(rows);
                }
            }
        );
    }
    else {
        res.status(401).send('login as restaurant for this');
    }
});

//post request for rest menu, for adding new items to menu
router.post('/rdashboard/menu', (req, res) => {
    if(req.session.user.rid) {
        const { dname, price } = req.body;
        let errors = [];
        if(!dname || !price) {
            errors.push({ msg : 'Please enter all fields' });
        }
        
        mySqlConnection.query(
            `insert into menu_${req.session.user.rid} (dname, price, rating) values (?)`,
            [[dname, price, 0]], //setting initial rating to 0
            (err, rows) => {
                if(err)
                    res.status(500).send(err);
                if(errors.length)
                    res.status(400).send(errors);
                else
                    res.send('succesfully added to menu');
                    //redirect to menu /dashboard/menu
            }
        );
    }
    else {
        res.status(401).send('login as restaurant for this');
    }
});

router.get('/rdashboard/feedback/:rid', (req, res) => {
    if(req.session.user.rid) {
        mySqlConnection.query(
            `select * from orders where rid = ${rid} and delivered = 1`,
            [],
            (err, rows) => {
                if(err) {
                    res.status(500).send(err);
                }
                else if(!rows) {
                    res.send("No orders yet");
                }
                else {
                    res.send(rows);
                }
            }
        )
    }
    else {
        res.status(401).send('login as restaurant for this');
    }
})


/*-----------------------------------------------------------------------------------*/
//user dashboard backend:


module.exports = router