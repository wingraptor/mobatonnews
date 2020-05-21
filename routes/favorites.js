const express = require("express");
const router = express.Router();
const Data = require("../models/dataFeed");
const User = require("../models/user.js");
const mongoose = require("mongoose");
const auth = require("../middleware/authMiddleware.js");

const chalk = require("chalk");

// create application/json parser
const jsonParser = express.json();
// create application/x-www-form-urlencoded parser
const urlencodedParser = express.urlencoded({ extended: false });

// GET ROUTE
router.get("/", auth, async (req, res) => {
  const email = req.user.emails[0].value;
  let articles;

  try {
    let user = await User.findOne({ email });
    articles = await User.aggregate([
      { $match: { _id: user._id } },
      // Join two collections and preserve indexed order of favoriteArticles array in Users collections -
      // https://stackoverflow.com/questions/55033804/aggregate-lookup-does-not-return-elements-original-array-order
      {
        $lookup: {
          from: "archives",
          let: { favoriteArticles: "$favoriteArticles" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$favoriteArticles"] },
              },
            },
            {
              $addFields: {
                sort: {
                  $indexOfArray: ["$$favoriteArticles", "$_id"],
                },
              },
            },
            { $sort: { sort: -1 } },
            { $addFields: { sort: "$$REMOVE" } },
          ],
          as: "data",
        },
      },
      { $project: { data: 1, _id: 0 } },
    ]);
    // Render homepage template
    res.render("favorites", {
      data: articles[0].data,
    });
  } catch (error) {
    console.log(error);
  }
});

// POST ROUTE
router.post("/", jsonParser, async (req, res) => {
  const favoriteArticleId = req.body.articleId;
  if (req.user) {
    try {
      const email = req.user.emails[0].value;
      const user = await User.findOne({ email });
      // User Already in DB
      if (user) {
        const updateUser = await User.updateOne(
          { _id: user._id },
          // Prevents duplicate articleIds
          { $addToSet: { favoriteArticles: favoriteArticleId } }
        );
        const favoriteArticleAddedCount = updateUser.nModified;
        const statusCode = favoriteArticleAddedCount === 0 ? 204 : 201;
        const message =
          statusCode === 204
            ? "Article Already In Favorites"
            : "Article Added to Favorites";
        // Can send status code in header in the future --> status code 204 sends no information in the body
        res.json({
          message: message,
          statusCode: statusCode,
          dbResponse: updateUser,
        });
      }
      // Add new user if not found in DB
      else if (!user) {
        const statusCode = 201;
        const message = "Please sign to save";
        const error = "User Not Found";

        res.status(statusCode).json({
          message,
          statusCode,
          dbResponse: savedUser,
          user: "New",
          error
        });
      }
    } catch (error) {
      const message = "User not in database";
      const statusCode = 500;
      res.status(statusCode).json({
        message,
        statusCode,
        error
      });
    }
  } else {
    const message = "Please sign to save";
    const statusCode = 201;
    const error = "User not signed in"
    res.status(statusCode).json({
      message,
      statusCode,
      error
    });
  }
});

// DELETE ROUTE
router.delete("/", jsonParser, async (req, res) => {
  if (req.user) {
    const email = req.user.emails[0].value;
    const favoriteArticleId = req.body.articleId;
    try {
      const user = await User.findOne({ email });
      // User Already in DB
      if (user) {
        const deletedArticle = await User.updateOne(
          { _id: user._id },
          { $pullAll: { favoriteArticles: [favoriteArticleId] } }
        );
        const favoriteArticleDeletedCount = deletedArticle.nModified;
        const statusCode = favoriteArticleDeletedCount === 0 ? 204 : 201;
        const message =
          statusCode === 204
            ? "Article Not in Database"
            : "Article Removed From Favorites";

        // Can send status code in header in the future --> status code 204 sends no information in the body
        res.status(statusCode).json({
          message,
          statusCode,
          dbResponse: deletedArticle,
        });
      } else if (!user) {
        const message = "User Not Found";
        const statusCode = 200;
        res.status(statusCode).json({
          message,
          statusCode,
          dbResponse: user,
          error: true,
        });
      }
    } catch (error) {
      const message = "Error Removing Favorite Article From Favorites";
      const statusCode = 500;
      res.status(statusCode).json({
        message,
        statusCode,
        error,
        error: true,
      });
    }
  } else {
    const message = "User Not Found";
    const statusCode = 500;
    res.status(statusCode).json({
      message,
      statusCode,
      error: true,
    });
  }
});

module.exports = router;
