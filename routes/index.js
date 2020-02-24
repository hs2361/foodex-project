const express = require('express');
const router = express.Router();
const mySqlConnection = require("../db/database");

router.get('/', (req, res) => res.status(200).send('home-page')); //home page

//get request for dashboard, will ask for login if cookie is not found
// router.get('/rdashboard', (req, res) => 
// {
//     if (req.session.user) {
//         res.status(200).send(req.session.user);
//         mySqlConnection.query(
//             'select * from menu'
//         )
//     }
//     else
//         res.status(401).send('login for this');
// });

//get request for rest menu, will simply display menu to restaurant
router.get('/rdashboard/menu/:rid', (req, res) => {
    if(req.session.user.rid) {
        mySqlConnection.query(
            `select * from menu_${rid}`,
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
        res.status(400).send('not a restaurant');
    }
});

//post request for rest menu, for adding new items to menu
router.post('/rdashboard/menu/:rid', (req, res) => {
    if(req.session.user.rid) {
        const { dname, price } = req.body;
        let errors = [];
        if(!dname || !price) {
            errors.push({ msg : 'Please enter all fields' });
        }
        
        mySqlConnection.query(
            `insert into menu_${rid} (dname, price, rating) values (?)`,
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
        res.status(400).send('not a restaurant');
    }
});

module.exports = router