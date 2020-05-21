const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const auth = require("../middleware/authMiddleware");

// create application/json parser
const jsonParser = express.json();
// create application/x-www-form-urlencoded parser
const urlencodedParser = express.urlencoded({ extended: false });

// Get Route -> Render preferences page with user data
router.get("/preferences", auth, jsonParser, async (req, res) => {
  const email = req.user.emails[0].value;
  try {
    const user = await User.findOne({email});
    res.render("account/preferences", {isSubscribed: user.subscribed, frequency: user.frequency});
  } catch (error) {
    res.redirect("back");
  }
});

// Post Route -> Post preferences changes
router.post("/preferences", auth, urlencodedParser, async (req, res) => {
  const email = req.user.emails[0].value;
  const frequency = req.body.frequency;
  const subscribed = req.body.subscribe;

  let message;
  let statusCode;
  let dbResponse;

  try {
    const user = await User.updateOne(
      { email },
      {
        $set: {
          subscribed,
          frequency,
        },
      },
      { upsert: true }
    );
    message = "Subscribed!";
    statusCode = 201;
    dbResponse = user;

    // res.status(201).json({
    //   message,
    //   statusCode,
    //   dbResponse,
    // });
    res.redirect("back");
  } catch (error) {
    message = "Error Adding Data to DB";
    statusCode = 500;

    if (error.code === 11000) {
      message = "You are already subscribed";
    }
    // Send response
    // res.status(statusCode).json({
    //   message: message,
    //   statusCode: statusCode,
    //   dbResponse: error,
    //   error: true,
    // });
    res.redirect("back");
    console.log(error);
  }
});

// Export Module
module.exports = router;
