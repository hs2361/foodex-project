const express = require('express');
const router = express.Router();
const mySqlConnection = require("../db/database"); //importing database connection

router.get("/", (req, res) => { //GET request to get details of all past and current orders
    if (req.session.user) { //if is logged in
        if (req.session.user.uid) { //if is a user, not restaurant
            var orders = []; //orders array to be sent to user

            mySqlConnection.query(//temp removed rating
                `select oid,orders.rid,rname,did,delivered,feedback,otime,count(did) as qty
                 from orders, restaurants where uid = ${req.session.user.uid} and orders.rid = restaurants.rid
                  group by oid,did`, // query to get dishes and quantity of dishes for each order ID made by user
                [],
                (err, rows) => {
                    if (err)
                        res.status(500).send(err); //internal server error
                    else if (!rows.length)
                        res.render('past_order', { check: 'false', o:{}, profile: req.session.user });
                    else {
                        var o = {}; //temp orders object for every order ID
                        o.items = {};
                        o.amount = 0;
                        let amount = 0;
                        var map = {}; //temp map object

                        rows.forEach((e, i) => { //iterate over all the orders
                            if (i == 0) //first row
                            {
                                o = {}; //make new object for new order
                                o.oid = e.oid;
                                o.rid = e.rid;
                                o.otime = e.otime;
                                o.rname = e.rname;
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
                                            if (rows.length == 1)
                                                res.render('past_order', { check: 'true', o: orders, profile: req.session.user });
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
                                                    res.render('past_order', { check: 'true', o: orders, profile: req.session.user });
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
                                                    res.render('past_order', { check: 'true', o: orders, profile: req.session.user }); //send orders array to user
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
        else {
            res.render('landing', { alert: 'true', msg: "Login as user to view feedback", user: req.session.user }); //unauthorised user
        }
    }
    else {
        res.redirect('/users/login');
    }
});

router.get("/:oid", (req, res) => {
    if (req.session.user) {
        if (req.session.user.uid) {
            mySqlConnection.query(
                `select * from orders where oid = ${req.params.oid} and uid = ${req.session.user.uid} and delivered = 1`,
                [],
                (err, rows) => {
                    if (err) {
                        res.status(500).send(err);
                    }
                    else if (!rows) {
                        res.render("404");
                    }
                    else {
                        if (rows[0].feedback || rows[0].rating) {
                            res.render("feedback", { alert: false, msg: "", oid: req.params.oid, rated: true, feedback: rows[0].feedback, rating: rows[0].rating });
                        }
                        else {
                            res.render("feedback", { alert: false, msg: "", oid: req.params.oid, rated: false, feedback: "", rating: 0 });
                        }
                    }
                }
            )
        }
        else {
            res.render('landing', { alert: 'true', msg: "Login as user to submit feedback", user: req.session.user }); //unauthorised user
        }
    }
    else {
        res.redirect("/users/login");
    }
});

router.post("/:oid", (req, res) => { //POST request to submit feedback and rating for order ID oid
    if (req.session.user) //if is logged in
    {
        if (req.session.user.uid) //if is a user, not a restaurant
        {
            const { rating, feedback } = req.body; //destructuring rating and feedback from req.body
            mySqlConnection.query(
                "select *from orders where oid = ?", //get all rows of given order ID
                [req.params.oid],
                (err, rows) => {
                    if (err)
                        res.status(500).send(err); //internal server error
                    else if (!rows)
                        res.render("404"); //bad request, tried to submit feedback on non-exisitent order
                    else {
                        if (rows[0].rating || rows[0].feedback) {
                            res.render("feedback", { alert: false, msg: "", oid: req.params.oid, rated: true, feedback: rows[0].feedback, rating: rows[0].rating });
                        }
                        else {
                            mySqlConnection.query(
                                `update orders set rating = ${Number(rating)}, feedback = "??" where oid = ${Number(req.params.oid)}`, //insert feedback into database
                                [feedback],
                                (e) => {
                                    if (e)
                                        res.status(500).send(e);
                                    else {
                                        mySqlConnection.query(
                                            `select rid from orders where oid = ${Number(req.params.oid)}`,
                                            [],
                                            (e1, r1) => {
                                                if (e1)
                                                    res.status(500).send(e1);
                                                else {
                                                    mySqlConnection.query(
                                                        `select avg(rating) as rating from orders where rid = ${r1[0].rid}`,
                                                        [],
                                                        (err, r) => {
                                                            var rating = 0;
                                                            if (err)
                                                                res.status(500).send(err);
                                                            else {
                                                                if (!r)
                                                                    rating = 0;
                                                                else {
                                                                    rating = r[0].rating;
                                                                    mySqlConnection.query(
                                                                        `update restaurants set rating = ${rating} where rid = ${r1[0].rid}`,
                                                                        [],
                                                                        (err) => {
                                                                            if (err)
                                                                                res.status(500).send(err)
                                                                            else
                                                                                res.status(200).redirect("/feedback");
                                                                        }
                                                                    );
                                                                }
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
                }
            );
        }
        else {
            res.render('landing', { alert: 'true', msg: "Login as user to submit feedback", user: req.session.user }); //unauthorised user
        }
    }
    else {
        res.redirect('/users/login');
    }
})

module.exports = router