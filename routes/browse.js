const express = require('express');
const router = express.Router();
const mySqlConnection = require("../db/database"); //importing database connection

router.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.user.rid) //check whether is restaurant
        {
            res.status(400).send('you must be a user to order'); //bad request
        }
        else {
            const uid = req.session.user.uid;
            mySqlConnection.query( //create cart for user
                `create table if not exists cart_${uid} (
                    rid int,
                    did int
                );`,
                [],
                (err) => {
                    if (err)
                        res.status(500).send(err); //internal server error
                    else {
                        mySqlConnection.query( //shows user a list of restaurants ordered by name
                            `select rid, rname, phone, address,rating from restaurants where verified = true order by rname`,
                            [],
                            (err, rows) => {
                                if (err)
                                    res.status(500).send(err); // internal server error
                                else if (!rows)
                                    res.send('no restaurants to browse'); // no restaurants in catalogue
                                else
                                    res.status(200).render("browse", {
                                        profile: {
                                            name: req.session.user.uname,
                                            phone: req.session.user.phone,
                                            email: req.session.user.email
                                        },
                                        data: { rows }
                                    }); // dynamically renders list of restaurants for user to browse
                            }
                        );
                    }
                }
            )
        }
    }
    else
        res.status(400).send("login to order"); //bad request
});

router.get('/:rid', (req, res) => {
    if (req.session.user) {
        if (req.session.user.uid) {
            mySqlConnection.query(
                `SELECT * FROM restaurants WHERE rid = ${req.params.rid} AND verified = TRUE`,
                [],
                (err, rows) => {
                    if (err) {
                        res.status(500).send(err);
                    }
                    else if (!rows) {
                        res.status(400).send('Restaurant not found');
                    }
                    else {
                        mySqlConnection.query(
                            `SELECT * FROM menu_${req.params.rid}`,
                            [],
                            (e, r) => {
                                if (e) {
                                    res.status(500).send(e);
                                }
                                else {
                                    mySqlConnection.query(
                                        `select did,count(did) as qty from cart_${req.session.user.uid} group by did`,
                                        [],
                                        (e2, r2) => {
                                            if (e2)
                                                res.status(500).send(e2);
                                            else {
                                                var dishes = {};
                                                var totalPrice = 0;

                                                if (r2.length) {
                                                    r2.forEach((el, i) => {
                                                        mySqlConnection.query(
                                                            `select *from menu_${req.params.rid} where did = ${el.did}`,
                                                            [],
                                                            (e3, r3) => {
                                                                if (e3)
                                                                    res.status(500).send(e3);
                                                                else {
                                                                    dishes[r3[0].dname] = [el.qty, r3[0].price * el.qty, el.did];
                                                                    totalPrice += r3[0].price * el.qty;
                                                                    if (i == r2.length - 1) {
                                                                        res.status(200).render("restaurant", {
                                                                            profile: {
                                                                                name: req.session.user.uname,
                                                                                phone: req.session.user.phone,
                                                                                email: req.session.user.email
                                                                            },
                                                                            data: { rows, r, cart: true, dishes, totalPrice }
                                                                        })
                                                                    }
                                                                }
                                                            }
                                                        );
                                                    })
                                                }

                                                else {
                                                    res.status(200).render("restaurant", {
                                                        profile: {
                                                            name: req.session.user.uname,
                                                            phone: req.session.user.phone,
                                                            email: req.session.user.email
                                                        },
                                                        data: { rows, r, cart: false, dishes, totalPrice }
                                                    })
                                                }
                                            }
                                        }
                                    )
                                }
                            }
                        );
                    }
                }
            );
        }

        else {
            res.status(401).send("not a user");
        }
    }

    else {
        res.redirect('/users/login');
    }
});

module.exports = router;