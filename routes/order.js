const express = require('express');
const router = express.Router();
const mySqlConnection = require("../db/database"); //importing database connection

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
                        did int,
                        rid int
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

router.get('/:rid/:did', () => {
    if(req.session.user)
    {
        if(req.session.user.rid) //check whether is restaurant
            {
                res.status(400).send('you must be a user to order'); //bad request
            }

        else
        {
            const uid = req.session.user.uid;
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
                            rows.forEach((e) => { //iterate over every item in the cart
                            mySqlConnection.query(
                                "insert into orders(rid,did,uid,delivered) values (?)", //insert into the orders table
                                [[e["rid"],e["did"],uid,0]],
                                (err) => {
                                    if(err)
                                        res.status(500).send(err); //internal server error
                                }
                            )
                            });

                            mySqlConnection.query(
                                `truncate table cart_${uid}`, //empty the cart
                                [],
                                (err) =>
                                {
                                    if(err)
                                        res.status(500).send(err); //internal server error
                                }
                            )
                    }
                }
            )
        }
    }      

    else
        res.status(400).send("login to checkout"); //bad request
});

module.exports = router;