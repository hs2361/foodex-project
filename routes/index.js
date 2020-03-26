const express = require('express');
const router = express.Router();
const http = require('http').createServer(router);
const io = require('socket.io').listen(http);
const mySqlConnection = require("../db/database");

router.get('/', (req, res) => {
    res.render("landing", { alert: 'false', msg: '', user: req.session.user });
}); //home page

/*-----------------------------------------------------------------------------------*/
//restaurant dashboard backend:

//get request for dashboard, will ask for login if cookie is not found

router.get('/rdashboard', (req, res) => {
    if (req.session.user) {
        if (req.session.user.rid) {
            // io.on('connection', function(socket) {

            // })
            let orders = [];
            mySqlConnection.query(
                `select oid, orders.rid, rname, category, did, delivered, otime, count(did) as qty
                 from orders, restaurants where orders.rid = ${req.session.user.rid} and orders.rid = restaurants.rid and delivered = 0
                 group by oid,did`,
                [],
                (err, rows) => {
                    if (err)
                        res.status(500).send(err);
                    else if(!rows.length) {
                        res.render('rest_dashboard', {check: 'false', o: {}, profile: {name: req.session.user.rname, phone: req.session.user.phone, email:req.session.user.email, rid: req.session.user.rid}});
                    }
                    else if(rows.length == 1) {
                        console.log('1 row only');
                        let row = rows[0];
                        let o = {};
                        o.rid = row.rid;
                        o.oid = row.oid;
                        o.otime = row.otime;
                        o.rname = row.rname;
                        o.category = row.category;
                        o.items = {};
                        amount = 0;
                        mySqlConnection.query(
                            `select *from menu_${row.rid} where did = ${row.did}`, //get details of dishes
                            [],
                            (error,r) => {
                                if(error)
                                    res.status(500).send(error)
                                else
                                {
                                    o.oid = row.oid;
                                    o.items[r[0]["dname"]] = row.qty; //set dish name in o.items object
                                    amount += r[0]["price"] * row.qty; //calculate amount as price * quantity
                                    o.amount = amount;
                                    res.render('rest_dashboard', {check: 'true', o: [o], profile: {name: req.session.user.rname, phone: req.session.user.phone, email:req.session.user.email, rid: req.session.user.rid}});
                                }
                            }
                        );
                    }
                    else {
                        var avg = 0;
                        mySqlConnection.query(
                            `select avg(rating) as rating from orders where rid = ${req.session.user.rid}`,
                            [],
                            (err, rows) => {
                                var rating = 0;
                                if (err)
                                    res.status(500).send(err);
                                else {
                                    if (!rows)
                                        rating = 0;
                                    else {
                                        rating = rows[0].rating;
                                        mySqlConnection.query(
                                            `update table restaurants set rating = ${rating} where rid = ${req.session.user.rid}`,
                                            [],
                                            (err) => {
                                                if (err)
                                                    res.status(500).send(err)
                                                else {
                                                    let o = {};
                                                    o.items = {};
                                                    o.amount = 0;
                                                    let amount = 0;
                                                    let map = {};
                                                    rows.forEach((e, i) => { //iterate over all the orders
                                                        if (i == 0) //first row
                                                        {
                                                            o = {}; //make new object for new order
                                                            o.oid = e.oid;
                                                            o.rid = e.rid;
                                                            o.otime = e.otime;
                                                            o.rname = e.rname;
                                                            o.category = e.category;
                                                            o.items = {};
                                                            amount = 0;
                                                            map[e.oid] = orders.length; //to ensure that orders go into the right object
                                                            orders.push(o); //put temp o object into orders array
                                                            mySqlConnection.query(
                                                                `select *from menu_${e.rid} where did = ${e.did}`, //get details of dishes
                                                                [],
                                                                (error, r) => {
                                                                    if (error)
                                                                        res.status(500).send(error)
                                                                    else {
                                                                        orders[0].oid = e.oid;
                                                                        orders[0].items[r[0]["dname"]] = e.qty; //set dish name in o.items object
                                                                        amount += r[0]["price"] * e.qty; //calculate amount as price * quantity
                                                                        orders[0].amount = amount;
                                                                    }
                                                                }
                                                            );
                                                        }

                                                        else {
                                                            if (e.oid == rows[i - 1].oid) //for consequent rows of the same order ID
                                                            {
                                                                mySqlConnection.query(
                                                                    `select *from menu_${e.rid} where did = ${e.did}`, //get details of dishes
                                                                    [],
                                                                    (error, r) => {
                                                                        if (error)
                                                                            res.status(500).send(error);
                                                                        else {
                                                                            orders[map[e.oid]].oid = e.oid;
                                                                            orders[map[e.oid]].items[r[0]["dname"]] = e.qty;  //set dish name in o.items object
                                                                            amount += r[0]["price"] * e.qty; //calculate amount as price * quantity
                                                                            orders[map[e.oid]].amount = amount;

                                                                            if (i == rows.length - 1) //last row of orders
                                                                            {
                                                                                // res.send(orders); //send orders array to user
                                                                                res.render('rest_dashboard', { check: 'true', o: orders, profile: { name: req.session.user.rname, phone: req.session.user.phone, email: req.session.user.email, rid: req.session.user.rid } });
                                                                            }
                                                                            return;
                                                                        }
                                                                    }
                                                                );
                                                            }

                                                            else {
                                                                o = {}; //make new object for new order
                                                                o.oid = e.oid;
                                                                o.rid = e.rid;
                                                                o.otime = e.otime;
                                                                o.rname = e.rname;
                                                                o.category = e.category;
                                                                o.items = {};
                                                                o.amount = 0;
                                                                amount = 0;
                                                                map[e.oid] = orders.length; //to ensure that orders go into the right object
                                                                orders.push(o); //put temp o object into orders array

                                                                mySqlConnection.query(
                                                                    `select *from menu_${e.rid} where did = ${e.did}`, //get details of dishes
                                                                    [],
                                                                    (error, r) => {
                                                                        if (error)
                                                                            res.status(500).send(error)
                                                                        else {
                                                                            orders[map[e.oid]].oid = e.oid;
                                                                            orders[map[e.oid]].items[r[0]["dname"]] = e.qty; //set dish name in o.items object
                                                                            amount = r[0]["price"] * e.qty; //calculate amount as price * quantity
                                                                            orders[map[e.oid]].amount = amount;

                                                                            if (i == rows.length - 1) //last row of orders
                                                                            {
                                                                                // res.send(orders); //send orders array to user
                                                                                res.render('rest_dashboard', { check: 'true', o: orders, profile: { name: req.session.user.rname, phone: req.session.user.phone, email: req.session.user.email, rid: req.session.user.rid } }); //send orders array to user
                                                                            }
                                                                            return;
                                                                        }
                                                                    }
                                                                );
                                                            }
                                                        }
                                                    })
                                                }
                                            }
                                        )
                                    }
                                }
                            }
                        )
                    }
                }
            );
        }
        else {
            res.status(401).send('login as restaurant for this');
        }
    }
    else {
        res.redirect('/restaurants/login');
    }
});

//get request for rest menu, will simply display menu to restaurant
router.get('/rdashboard/menu', (req, res) => {
    if (req.session.user.rid) {
        mySqlConnection.query(
            `select * from menu_${req.session.user.rid}`,
            [],
            (err, rows) => {
                if (err) {
                    res.status(500).send(err);
                }
                else if (!rows) {
                    res.status(400).send('no menu for this restaurant');
                }
                else {
                    res.send(rows);
                }
            }
        );
    }
    else {
        res.status(401).render("landing", { alert: 'true', msg: 'login as restaurant for this', user: req.session.user });
    }
});

//post request for rest menu, for adding new items to menu
router.post('/rdashboard/menu', (req, res) => {
    if (req.session.user.rid) {
        const { dname, price } = req.body;
        let errors = [];
        if (!dname || !price) {
            errors.push({ msg: 'Please enter all fields' });
        }

        mySqlConnection.query(
            `insert into menu_${req.session.user.rid} (dname, price, rating) values (?)`,
            [[dname, price, 0]], //setting initial rating to 0
            (err, rows) => {
                if (err)
                    res.status(500).send(err);
                else if (errors.length)
                    res.status(400).send(errors);
                else
                    res.status(200).send('succesfully added to menu');
                //redirect to menu /dashboard/menu
            }
        );
    }
    else {
        res.status(401).render("landing", { alert: 'true', msg: 'login as restaurant for this', user: req.session.user });
    }
});

router.get('/rdashboard/feedback/', (req, res) => {
    if (req.user.user) {
        if (req.session.user.rid) {
            mySqlConnection.query(
                `select * from orders where rid = ${req.session.user.rid} and delivered = 1`,
                [],
                (err, rows) => {
                    if (err) {
                        res.status(500).send(err);
                    }
                    else if (!rows) {
                        res.send("No orders yet");
                    }
                    else {
                        res.send(rows);
                    }
                }
            )
        }
        else {
            res.status(401).render("landing", { alert: 'true', msg: 'Login as a restaurant for this', user: req.session.user });
        }
    }
})

router.get('/rdashboard/accept/:oid', (req, res) => {
    if (req.session.user) {
        if (req.session.user.rid) {
            mySqlConnection.query(
                `update orders set delivered = 1 where oid = ${req.params.oid}`,
                [],
                (err) => {
                    if (err) {
                        res.status(500).send(err);
                    }
                    else {
                        res.redirect('/rdashboard');
                    }
                }
            )
        }
        else {
            res.status(401).send('Login as a restaurant for this');
        }
    }
    else {
        res.redirect('/restaurants/login');
    }
})


module.exports = router