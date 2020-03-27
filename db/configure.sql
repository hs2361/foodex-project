CREATE DATABASE IF NOT EXISTS webkriti;
USE webkriti;

CREATE TABLE IF NOT EXISTS users
(
    uid      INT PRIMARY KEY AUTO_INCREMENT,
    uname    VARCHAR(255),
    phone    CHAR(10),
    address  VARCHAR(255),
    email    VARCHAR(255),
    passHash CHAR(60),
    verified BOOL
);

CREATE TABLE IF NOT EXISTS restaurants
(
    rid      INT PRIMARY KEY AUTO_INCREMENT,
    rname    VARCHAR(255),
    phone    CHAR(10),
    address  VARCHAR(255),
    email    VARCHAR(255),
    passHash CHAR(60),
    verified BOOL,
    rating   FLOAT DEFAULT 0,
    category VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS verify
(
    email VARCHAR(255),
    code  INTEGER
);

CREATE TABLE IF NOT EXISTS orders
(
    oid       INT,
    rid       INT,
    did       INT,
    uid       INT,
    delivered BOOL,
    rating    INT,
    feedback  TEXT,
    otime     DATETIME DEFAULT NOW()
);

INSERT INTO restaurants(oid, rname, verified)
VALUES (1, "Ghost <3", false);