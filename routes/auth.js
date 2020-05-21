const express = require("express");
const router = express.Router();
const chalk = require("chalk");
const bcrypt = require("bcrypt");
const User = require("../models/user.js");
const passport = require("passport");
const util = require("util");
const url = require("url");
const querystring = require("querystring");

require("dotenv").config();

// Login Route
router.get(
  "/login",
  passport.authenticate("auth0", {
    scope: "openid email profile",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

// Callback Route, called by AUTH0 servers
router.get("/callback", async (req, res, next) => {
  passport.authenticate("auth0", async (err, user, info) => {
    // Extract email from Auth0 response (user argument)
    const {
      emails: [{ value }],
    } = user;

    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    }
    req.logIn(user, async (err) => {
      if (err) {
        return next(err);
      }
      const returnTo = req.session.returnTo;
      delete req.session.returnTo;

      // See if user is already in DB
      let user = await User.findOne({ email: value });
      // Add user if first time creating an account
      if (!user) {
        user = new User({
          email: value,
        });
        await user.save();
      }
      res.redirect(returnTo || "/");
    });
  })(req, res, next);
});

// Logout Route
router.get("/logout", (req, res) => {
  req.logOut();

  let returnTo = req.protocol + "://" + req.hostname;
  const port = req.connection.localPort;

  if (port !== undefined && port !== 80 && port !== 443) {
    returnTo =
      process.env.NODE_ENV === "production"
        ? `${returnTo}/`
        : `${returnTo}:${port}/`;
  }

  const logoutURL = new URL(
    util.format("https://%s/logout", process.env.AUTH0_DOMAIN)
  );
  const searchString = querystring.stringify({
    client_id: process.env.AUTH0_CLIENT_ID,
    returnTo: returnTo,
  });
  logoutURL.search = searchString;
  res.redirect(logoutURL);
});

module.exports = router;
