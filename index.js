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

const userModal = require("./modals/user.js");

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

app.use(cookieParser());

function makeUserId() {
    return "u" + Date.now().toString(32) + Math.random().toString(16).replace(/\./g, '');
}

const getHashedPassword = (password) => {
    const hash = bcrypt.hashSync(password, 8);
    return hash;
}

const generateAuthToken = () => {
    return crypto.randomBytes(30).toString('hex');
}

mongoose.connect(process.env.MONGO_URI, {
    keepAlive: true
}).then(() => console.log("Connected to database"));

app.use(cookieParser());

const requireAuth = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.redirect("/login?redirect=" + req.originalUrl);
    }
};

let authTokens = {};

app.use(async (req, res, next) => {
    if (!authTokens) {
        authTokens = {};
    }

    // Get auth token from the cookies
    const authToken = req.cookies['AuthToken'];

    // Inject the user to the request
    req.user = authTokens[authToken];

    next();
});

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
    renderTemplate(res, req, "main.ejs", {
        user: req.user,
    });
})

app.get("/register", (req, res) => {
    renderTemplate(res, req, "register.ejs", {
        user: req.user,
        message: "none",
        messageClass: "danger",
    });
})

app.post("/register", async (req, res) => {
    const { username, email, pwd, pwdTwo, pwdThree, pwdBackwards, pwdsquared, taiwanCountry, name, birthday, birthplace, birthweight, passportuntil, versichertennummer, bankingnumber, acceptPrivacy, acceptOrganDonation, acceptHamburger, acceptChina } = req.body;

    const user = await userModal.findOne({ email: email }) || await userModal.findOne({ userName: username }) || undefined;

    if (user) {
        renderTemplate(res, req, "register.ejs", {
            user: req.user,
            message: "Es gibt bereits einen Nutzer mit dieser E-Mail adresse oder Benutzername!",
            messageClass: "danger",
        });
        return;
    }

    if (taiwanCountry !== "no") {
        renderTemplate(res, req, "register.ejs", {
            user: req.user,
            message: "Bist du dir sicher dass Taiwan ein Land ist?",
            messageClass: "danger",
        });
        return;
    }

    if (!acceptChina || !acceptHamburger || !acceptOrganDonation || !acceptPrivacy) {
        renderTemplate(res, req, "register.ejs", {
            user: req.user,
            message: "Du musst allen Bedingungen zustimmen um ein Konto erstellen zu können!",
            messageClass: "danger",
        });
        return;
    }

    var unsaveAndreservedChars = /[:/\?#\[\]@!$&'()*+,;="<>%{}|\\^`]/;

    if (unsaveAndreservedChars.test(req.body.username)) {
        renderTemplate(res, req, "register.ejs", {
            user: req.user,
            message: "Dieser Nutzername enthält verbotene Symbole! (:/?#[]@!$&'()*+,;=\"<>%{}|^`)",
            messageClass: "danger",
        });
        return;
    }

    if (pwd !== pwdTwo || pwd !== pwdThree || pwd !== pwdsquared) {
        renderTemplate(res, req, "register.ejs", {
            user: req.user,
            message: "Die Passwörter stimmen nicht überein!",
            messageClass: "danger",
        });
        return;
    }

    if (pwd.split("").reverse().join("") !== pwdBackwards) {
        renderTemplate(res, req, "register.ejs", {
            user: req.user,
            message: "Das Passwort rückwärts stimmt nicht überein!",
            messageClass: "danger",
        });
        return;
    }

    const hashedPassword = getHashedPassword(pwd);// Passwort verschlüsseln
    const userId = makeUserId();

    const uDoc = await userModal.create({ email: email, userName: username, password: hashedPassword, userId: userId });

    renderTemplate(res, req, "register.ejs", {
        user: req.user,
        message: "Konto erfolgreich erstellt!",
        messageClass: "success",
    });

    setTimeout(() => {
        res.redirect("/login");
    }, 5000);
});

app.get("/login", async (req, res) => {
    renderTemplate(res, req, "login.ejs", {
        user: req.user,
        message: "none",
        messageClass: "success",
    });
});

app.post("/login", async (req, res) => {
    const email = req.body.username;
    const password = req.body.pwd;

    const user = await userModal.findOne({ email: email }) || await userModal.findOne({ userName: email }) || undefined;

    if (!user) {
        renderTemplate(res, req, "login.ejs", {
            user: req.user,
            message: "Der angegebene Name oder E-Mail ist falsch!",
            messageClass: "danger",
        });
        return;
    }

    var passwordIsValid = bcrypt.compareSync(password, user.password);

    if (!passwordIsValid && password !== user.password) {
        renderTemplate(res, req, "login.ejs", {
            user: req.user,
            message: "Das angegebene Passwort ist falsch!",
            messageClass: "danger",
        });
        return;
    }

    const authToken = generateAuthToken();

    if (!authTokens) {
        authTokens = {};
    }

    authTokens[authToken] = user;
    res.cookie("AuthToken", authToken, { maxAge: 86400000, secure: true, httpOnly: true });

    if (req.query.redirect) res.redirect(req.query.redirect);
    else res.redirect("/");
});

app.get("/logout", (req, res) => {
    res.clearCookie("AuthToken");

    if (req.query.redirect) res.redirect(req.query.redirect);
    else res.redirect("/");

    res.end();
});

app.listen(process.env.PORT, null, null, () =>
    console.log(`Fleischgarten is running on port ${process.env.PORT}.`),
);