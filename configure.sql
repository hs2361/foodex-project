CREATE DATABASE IF NOT EXISTS webkriti;
USE webkriti;

CREATE TABLE IF NOT EXISTS users (
    uid INT PRIMARY KEY AUTO_INCREMENT,
    uname VARCHAR(255),
    phone CHAR(10),
    address VARCHAR(255),
    email VARCHAR(255),
    passHash CHAR(60),
    verified BOOL
);

CREATE TABLE IF NOT EXISTS restaurants (
    rid INT PRIMARY KEY AUTO_INCREMENT,
    rname VARCHAR(255),
    phone CHAR(10),
    address VARCHAR(255),
    email VARCHAR(255),
    passHash CHAR(60),
    verified BOOL
);

CREATE TABLE IF NOT EXISTS verify (
    email VARCHAR(255),
    code INTEGER
);

-- CREATE TABLE IF NOT EXISTS orders (
--     oid INT
--     rid INT,
--     did INT,
--     uid INT,
--     delivered bool,
--     rating INT,
--     feedback VARCHAR(255)
-- );