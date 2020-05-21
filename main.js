const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const mongoose = require("mongoose");
const express = require("express");
// const  morgan = require("morgan");
const chalk = require("chalk");
const ejs = require("ejs");

// Auth External Modules
const expressSession = require("express-session");
const passport = require("passport");
const Auth0Strategy = require("passport-auth0");

//Environment variable package
require("dotenv").config();

/***********************
Helper Function Imports
***********************/
const siteInfo = require("./helpers/siteInfo");
const dateStandardiser = require("./helpers/dateStandardiser");

/*************
Route Imports
**************/
const homeRouter = require("./routes/home");
const filterRouter = require("./routes/filter");
const searchRouter = require("./routes/search");
const favoritesRouter = require("./routes/favorites");
const subscribeRouter = require("./routes/subscribe");
const authRouter = require("./routes/auth");
const accountRouter = require("./routes/account");

/************ 
App variables
*************/
const app = express();
const TWO_HOURS = 1000 * 60 * 60 * 2;

/********************************************************************
Environment Variables Imports:
Using ES6 object destructuring - default values:- 
https://codeburst.io/es6-destructuring-the-complete-guide-7f842d08b98f
**********************************************************************/
const {
  PORT = 3000,
  IP = "",
  NODE_ENV = "development",
  DATABASE_URL = "mongodb://localhost:27017/scrapedData",
  SESS_NAME = "sid",
  SESS_SECRET = "thisIsJustAthing",
  AUTH0_DOMAIN,
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_CALLBACK_URL = "http://localhost:3000/callback",
} = process.env;

const IN_PROD = NODE_ENV === "production";

/*********************
Mongoose Configuration
***********************/
mongoose.connect(DATABASE_URL, { useNewUrlParser: true, useCreateIndex: true });
mongoose.set("useUnifiedTopology", true);

/**********************
Session Configuration
************************/
app.use(
  expressSession({
    name: SESS_NAME,
    secret: SESS_SECRET,
    saveUninitialized: false,
    resave: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    cookie: {
      sameSite: false,
      secure: IN_PROD,
    },
  })
);

/********************
Passport Configuration
*********************/
const strategy = new Auth0Strategy(
  {
    domain: AUTH0_DOMAIN,
    clientID: AUTH0_CLIENT_ID,
    clientSecret: AUTH0_CLIENT_SECRET,
    callbackURL: AUTH0_CALLBACK_URL,
  },
  function (accessToken, refreshToken, extraParams, profile, done) {
    /**
     * Access tokens are used to authorize users to an API
     * (resource server)
     * accessToken is the token to call the Auth0 API
     * or a secured third-party API
     * extraParams.id_token has the JSON Web Token
     * profile has all the information from the user
     */
    return done(null, profile);
  }
);

/******************* 
App Configuration
********************/

// Set express to recognise all res.render files as .ejs
app.set("view engine", "ejs");
// Make express aware of public folder; location of stylesheets, scripts and images
app.use(express.static(__dirname + "/public"));

app.use(express.json());
// app.use(morgan("dev"));
// Passport config
passport.use(strategy);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

/***************************************************************
Set Helper Functions as properties of the locals object --> makes these functions available to all views
****************************************************************/
app.locals.siteInfo = siteInfo;
app.locals.dateStandardiser = dateStandardiser;


// Attaches request-level info. such as authenticated user and user settings to the locals property made available to the
// specific req/res cycle.
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

/********************** 
Add Routes as Middlware
***********************/
app.use("/", homeRouter);
app.use("/", authRouter);
app.use("/filter", filterRouter);
app.use("/search", searchRouter);
app.use("/favorites", favoritesRouter);
app.use("/subscribe", subscribeRouter);
app.use("/account", accountRouter);

//Handle 404 errors
app.use(function (req, res) {
  res.status(404).render("404");
});

/*************************************************
Tell Express to listen for requests on port 3000 (starts local server)
Visit localhost:3000 to reach site being served by local server. 
***************************************************/
app.listen(PORT, IP, function () {
  console.log("Server started");
});
