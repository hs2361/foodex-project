const express = require('express');
const router = express.Router();
const http = require('http').createServer(router);
const io = require('socket.io').listen(http);
const mySqlConnection = require("../db/database"); //importing database connection

// io.on('connection', function(socket) {
//     console.log('A user connected');
//     //Whenever someone disconnects this piece of code executed
//     socket.on('disconnect', function () {
//        console.log('A user disconnected');
//     });
//  });

var order_id;
mySqlConnection.query(
    `select max(oid) as maximum from orders`,
    [],
    (err, rows) => {
        if (err) {
            console.log(err);
        }
        else if (!rows) {
            order_id = 1;
        }
        else {
            order_id = rows[0].maximum + 1;
        }
    }
)

router.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.user.rid) //check whether is restaurant
        {
            res.status(401).send('you must be a user to order'); //unauthorised user
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
                        res.redirect('/browse');
                    }
                }
            )
        }
    }
    else {
        res.redirect('/users/login');
    }
});

router.get('/:rid/:did', (req, res) => {
    if (req.session.user) {
        if (req.session.user.rid) //check whether is restaurant
        {
            res.status(400).send('you must be a user to order'); //bad request
        }
        else {
            const uid = req.session.user.uid;
            if (req.query.action === 'add') {
                mySqlConnection.query(
                    `select * from orders where uid = ${req.session.user.uid} and not delivered`,
                    [],
                    (e, r) => {
                        if (e)
                            res.status(500).send(e);
                        else {
                            if (r.length) {
                                res.status(400).send("You cannot order until your existing order has been delivered");
                            }
                            else {
                                var mul = false;
                                mySqlConnection.query(
                                    `select *from cart_${uid}`,
                                    [],
                                    (err, rows) => {
                                        if (err)
                                            res.status(500).send(err); //internal server error
                                        else {
                                            rows.some((e) => { //iterate over items in cart
                                                if (e["rid"] != req.params.rid) {
                                                    res.status(400).send("cannot order simultaneously from multiple restaurants") //bad request
                                                    mul = true;
                                                }
                                                return mul;
                                            })
                                        }

                                        if (!mul) //not trying to order from multiple restaurants
                                        {
                                            mySqlConnection.query( //add dish to cart
                                                `insert into cart_${uid} values (?)`,
                                                [[req.params.rid, req.params.did]],
                                                (err) => {
                                                    if (err)
                                                        res.status(500).send(err); //internal server error
                                                    else
                                                        res.redirect(`/browse/${req.params.rid}`);
                                                }
                                            )
                                        }
                                    }
                                );
                            }
                        }
                    }
                )
            }
            else if (req.query.action === 'remove') {
                mySqlConnection.query(
                    `select * from cart_${uid} where rid = ${req.params.rid} and did = ${req.params.did}`,
                    [],
                    (err, rows) => {
                        if (err) {
                            res.status(500).send(err);
                        }
                        else if (rows[0]) {
                            mySqlConnection.query(
                                `delete from cart_${uid} where did = ${req.params.did} limit 1`,
                                [],
                                (err) => {
                                    if (err) {
                                        res.status(500).send(err);
                                    }
                                    else {
                                        res.redirect(`/browse/${req.params.rid}`);
                                    }
                                }
                            )
                        }
                    }
                )
            }
        }
    }

    else {
        res.redirect('/users/login');
    }
});

// router.get("/confirm", (req, res) => {
//     if(req.session.user) {
//         if(req.session.user.uid) {
//             mySqlConnection.query(
//                 `select * from cart_${req.session.user.uid}`,
//                 [],
//                 (err, rows) => {
//                     if(err) {
//                         res.status(500).send(err);
//                     }
//                     else if(!rows) {
//                         res.status(400).send("no itms in cart");
//                     }
//                     else {
//                         res.status(200).render('');
//                     }
//                 }
//             )
//         }
//     }
// });

router.get("/checkout", (req, res) => {
    if (req.session.user) {
        if (req.session.user.rid) //check whether is restaurant
        {
            res.status(400).send('you must be a user to order'); //bad request
        }

        else {
            const uid = req.session.user.uid;
            mySqlConnection.query( //get dishes from cart
                `select *from cart_${uid}`,
                [],
                (err, rows) => {
                    if (err)
                        res.status(500).send(err); //internal server error
                    else {
                        if (!rows.length)
                            res.status(400).send("empty cart") //bad request

                        else {
                            var rid;
                            rows.forEach((e) => { //iterate over every item in the cart
                                mySqlConnection.query(
                                    "insert into orders (oid,rid,did,uid,delivered) values (?)", //insert into the orders table
                                    [[order_id, e["rid"], e["did"], uid, 0]],
                                    (err) => {
                                        if (err)
                                            res.status(500).send(err); //internal server error
                                    }
                                )
                                rid = e.rid;
                            });

                            mySqlConnection.query(
                                `delete from cart_${uid}`, //empty the cart
                                [],
                                (err) => {
                                    if (err)
                                        res.status(500).send(err); //internal server error
                                }
                            );
                            res.redirect('/order/status');
                            order_id++;
                            io.on('connection', function (socket) {
                                socket.emit(`new-order`, rid);
                            });
                            res.status(200).send("checked out");
                        }
                    }
                }
            )

        }
    }

    else {
        res.redirect('/users/login');
    }
});

router.get('/status', (req, res) => {
    if (req.session.user) {
        if (req.session.user.uid) {
            res.render('checkout', { details: { oid: (order_id - 1) }, alert: 'false', msg: '' });
        }
        else {
            res.redirect('/users/login');
        }
    }
    else {
        res.redirect('/users/login');
    }
});

module.exports = router;