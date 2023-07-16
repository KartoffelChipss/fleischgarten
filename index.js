const express = require("express");
const ejs = require("ejs");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
var bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();

const dataDir = path.resolve(`${process.cwd()}${path.sep}`);
const templateDir = path.resolve(`${dataDir}${path.sep}templates`);

app.engine("ejs", ejs.renderFile);
app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    }),
);

mongoose.connect(process.env.MONGO_URI, {
    keepAlive: true
}).then(() => console.log("Connected to database"));

app.use(cookieParser());

app.use("/assets", express.static(path.resolve(`${dataDir}${path.sep}assets`)));

const renderTemplate = (res, req, template, data = {}) => {
    // Default base data which passed to the ejs template by default.
    const baseData = {
        path: req.path,
    };
    // We render template using the absolute path of the template and the merged default data with the additional data provided.
    res.render(
        path.resolve(`${templateDir}${path.sep}${template}`),
        Object.assign(baseData, data),
    );
};

app.get("/", (req, res) => {
    renderTemplate(res, req, "main.ejs");
})

app.listen(process.env.PORT, null, null, () =>
    console.log(`Fleischgarten is running on port ${process.env.PORT}.`),
);