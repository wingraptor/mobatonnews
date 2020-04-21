const express = require("express");
const router = express.Router();
const validator = require("validator");

const Archive = require("../models/archive");
const User = require("../models/user");

router.post("/", async (req, res) => {
  const emailAddress = req.body.emailAddress;
  const frequency = req.body.frequency;
  const sessionId = req.session.id;

  let message;
  let statusCode;
  let dbResponse;

  // Validate email address
  if (validator.isEmail(emailAddress)) {
    try {
      // const user = await User.findById(sessionId);

      // console.log(test);

      const user = await User.updateOne(
        { _id: sessionId },
        {
          $set: {
            frequency,
            emailAddress,
          },
        },
        { upsert: true }
      );
      message = "Subscribed!";
      statusCode = 201;
      dbResponse = user;

      res.status(201).json({
        message,
        statusCode,
        dbResponse,
      });
    } catch (error) {
      message = "Error Adding Data to DB";
      statusCode = 500;

      if (error.code === 11000) {
        message = "You are already subscribed";
      }
      // Send response
      res.status(statusCode).json({
        message: message,
        statusCode: statusCode,
        dbResponse: error,
        error: true,
      });
      console.log(error);
    }
  } else {
    res.json({
      message: "Invalid Email Address",
    });
  }
});

module.exports = router;
