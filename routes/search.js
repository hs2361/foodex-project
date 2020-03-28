const express = require('express');
const router = express.Router();
const http = require("../app");
var io = require('socket.io')(http);
const mySqlConnection = require("../db/database"); //importing database connection

router.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.user.uid) {
            if (Object.getOwnPropertyNames(req.query).length) {
                let searchstring = req.query.q;
                let searchtype = req.query.type;
                let words = searchstring.split(' ');
                if (searchtype == 'rest') {
                    words.forEach(kw => {
                        mySqlConnection.query(
                            `select * from restaurants where rname like '%${kw}%' and verified`,
                            [],
                            (err, rows) => {
                                if (err) {
                                    res.send(err);
                                }
                                else if (!rows.length) {
                                    res.render('search', { profile: { name: req.session.user.uname, email: req.session.user.email, phone: req.session.user.phone }, check: 'true', searchresults: [], alert: 'false', msg: '' })
                                }
                                else {
                                    res.render('search', { profile: { name: req.session.user.uname, email: req.session.user.email, phone: req.session.user.phone }, check: 'false', searchresults: rows, alert: 'false', msg: '' })
                                }
                            }
                        )
                    });
                }
                else if (searchtype == 'dish') {
                    mySqlConnection.query(
                        `select * from restaurants where verified`,
                        [],
                        (err, rows) => { // all restaurants stored in rows
                            if (err) {
                                res.send(err)
                            }
                            else if (!rows.length) {
                                res.render('search', { profile: { name: req.session.user.uname, email: req.session.user.email, phone: req.session.user.phone }, check: 'true', searchresults: [], alert: 'false', msg: '' })
                            }
                            else {
                                var results = [];
                                rows.forEach((rest, i) => { // individual restaurant details stored in rest
                                    words.forEach(kw => { // keyword stored in kw
                                        mySqlConnection.query(
                                            `select * from menu_${rest.rid} where dname like '%${kw}%'`,
                                            [],
                                            (err, r) => { //dish details stored in r
                                                if (err) {
                                                    res.status(500).send(err);
                                                }
                                                else if (r.length) {
                                                    results.push(rest);
                                                    if (i == rows.length - 1) {
                                                        res.render('search', { profile: { name: req.session.user.uname, email: req.session.user.email, phone: req.session.user.phone }, check: 'false', searchresults: results, alert: 'false', msg: '' })
                                                    }
                                                }
                                            }
                                        )
                                    })
                                    if(i == rows.length - 1)
                                    {
                                        if(!results.length)
                                            res.render('search', { profile: { name: req.session.user.uname, email: req.session.user.email, phone: req.session.user.phone }, check: 'true', searchresults: [], alert: 'false', msg: '' })
                                    }
                                })
                            }
                        }
                    )
                }
                else if (searchtype == 'cat') {
                    words.forEach(kw => {
                        mySqlConnection.query(
                            `select * from restaurants where category like '%${kw}%' and verified`,
                            [],
                            (err, rows) => {
                                if (err) {
                                    res.send(err);
                                }
                                else if (!rows.length) {
                                    res.render('search', { profile: { name: req.session.user.uname, email: req.session.user.email, phone: req.session.user.phone }, check: 'true', searchresults: [], alert: 'false', msg: '' })
                                }
                                else {
                                    res.render('search', { profile: { name: req.session.user.uname, email: req.session.user.email, phone: req.session.user.phone }, check: 'false', searchresults: rows, alert: 'false', msg: '' })
                                }
                            }
                        )
                    });
                }
                else {
                    res.render('search', { profile: { name: req.session.user.uname, email: req.session.user.email, phone: req.session.user.phone }, check: 'true', searchresults: [], alert: 'true', msg: 'invalid search query' });
                }
            }
            else {
                res.render('search', { profile: { name: req.session.user.uname, email: req.session.user.email, phone: req.session.user.phone }, check: 'true', searchresults: [], alert: 'false', msg: '' });
            }
        }
        else {
            res.redirect('/users/login');
        }
    }
    else {
        res.redirect('/users/login');
    }
})

module.exports = router;