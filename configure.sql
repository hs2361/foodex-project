create database if not exists webkriti;
use webkriti;

create table if not exists users(
	uid int primary key auto_increment,
    uname varchar(255),
    phone char(10),
    address varchar(255),
    email varchar(255),
    passHash char(60),
    verified bool
);

create table if not exists restaurants(
	rid int primary key auto_increment,
    rname varchar(255),
    phone char(10),
    address varchar(255),
    email varchar(255),
    passHash char(60),
    verified bool
);

create table if not exists verify(
	email varchar(255),
    code integer
);