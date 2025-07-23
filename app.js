const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const orderRoute = require("./no-auth/orderRoute");
const folderRoute = require("./basic-auth/folderRoute");
const contactRoute = require("./jwt-auth/contactRoute");
const loginRoute = require("./jwt-auth/loginRoute");

const app = express();

mongoose
    .connect(
        "mongodb+srv://cagatayMongo:1122cTcT@cluster0.gqtj7xa.mongodb.net/pdApiConnection?retryWrites=true&w=majority"
    )
    .then(() => {
        console.log("Connected to database!");
    })
    .catch(() => {
        console.log("Connection failed!");
    });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, PUT, DELETE, OPTIONS"
    );
    next();
});

app.use("/api/order", orderRoute);
app.use("/api/folder", folderRoute);
app.use("/api/contact", contactRoute);
app.use("/login", loginRoute);

module.exports = app;
