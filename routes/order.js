const express = require('express');
const router = express.Router();
const mySqlConnection = require("../db/database"); //importing database connection
var order_id = 1;

router.get('/', (req,res) => {
    if(req.session.user)
        {
            if(req.session.user.rid) //check whether is restaurant
            {
                res.status(400).send('you must be a user to order'); //bad request
            }

            else
            {
                const uid = req.session.user.uid;
                mySqlConnection.query( //create cart for user
                    `create table if not exists cart_${uid} (
                        rid int,
                        did int
                    );`,
                    [],
                    (err) => 
                    {
                        if(err)
                            res.status(500).send(err); //internal server error
                        else
                            res.status(200).send('browse restaurants');
                    }
                )
            }
        }
    else
        res.status(400).send("login to order"); //bad request
});

router.get('/:rid/:did', (req,res) => {
    if(req.session.user)
    {
        if(req.session.user.rid) //check whether is restaurant
            {
                res.status(400).send('you must be a user to order'); //bad request
            }

        else
        {
            const uid = req.session.user.uid;
            var mul = false;
            mySqlConnection.query(
                `select *from cart_${uid}`,
                [],
                (err,rows) => {
                    if(err)
                        res.status(500).send(err); //internal server error
                    else
                    {
                        rows.some((e) => { //iterate over items in cart
                            if(e["rid"] != req.params.rid)
                            {
                                res.status(400).send("cannot order simultaneously from multiple restaurants") //bad request
                                mul = true;
                            }

                            return mul;
                        })
                    }

                    if(!mul) //not trying to order from multiple restaurants
                    {
                        mySqlConnection.query( //add dish to cart
                            `insert into cart_${uid} values (?)`,
                            [[req.params.rid, req.params.did]],
                            (err) => 
                            {
                                if(err)
                                    res.status(500).send(err); //internal server error
                                else
                                    res.status(200).send('added to cart');
                            }
                        )
                    }
                }
            )
        }
    }

    else
        res.status(400).send("login to order"); //bad request
});

router.get("/checkout", (req,res) => {
    if(req.session.user)
    {
        if(req.session.user.rid) //check whether is restaurant
        {
            res.status(400).send('you must be a user to order'); //bad request
        }

        else
        {
            const uid = req.session.user.uid;
            mySqlConnection.query( //get dishes from cart
                `select *from cart_${uid}`,
                [],
                (err,rows) => {
                    if(err)
                        res.status(500).send(err); //internal server error
                    else
                        {
                            if(!rows.length)
                                res.status(400).send("empty cart") //bad request

                            else
                            {
                                rows.forEach((e) => { //iterate over every item in the cart
                                    mySqlConnection.query(
                                        "insert into orders(oid,rid,did,uid,delivered) values (?)", //insert into the orders table
                                        [[order_id,e["rid"],e["did"],uid,0]],
                                        (err) => {
                                            if(err)
                                                res.status(500).send(err); //internal server error
                                        }
                                    )
                                });

                                mySqlConnection.query(
                                    `delete from cart_${uid}`, //empty the cart
                                    [],
                                    (err) =>
                                    {
                                        if(err)
                                            res.status(500).send(err); //internal server error
                                    }
                                );
                                order_id++;
                                res.status(200).send("checked out");
                            }
                        }
                }
            )
        }
    }      

    else
        res.status(400).send("login to checkout"); //bad request
});

module.exports = router;