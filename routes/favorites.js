const express = require("express");
const router = express.Router();
const Archive = require("../models/archive");
const Data = require("../models/dataFeed");
const User = require("../models/user");
const mongoose = require("mongoose");
const moment = require("moment");

// GET ROUTE
router.get("/", async (req, res) => {
  const sessionId = req.session.id;
  let articles;

  try {
    let user = await User.findById(sessionId);

    if (!user) {
      user = new User({
        _id: sessionId,
      });
      await user.save();
    } 
      articles = await User.aggregate([
        { $match: { _id: sessionId } },
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
router.post("/", async (req, res) => {
  const favoriteArticleId = req.body.articleId;
  const sessionId = req.session.id;

  try {
    const user = await User.findById(sessionId);

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
      const newUser = new User({
        _id: sessionId,
        favoriteArticles: [favoriteArticleId],
      });
      const savedUser = await newUser.save();
      const statusCode = 201;
      const message = "Article Added to Favorites";

      res.status(statusCode).json({
        message,
        statusCode,
        dbResponse: savedUser,
        user: "New",
      });
    }
  } catch (error) {
    const message = "Error Adding Article to Favorites";
    const statusCode = 500;

    res.status(statusCode).json({
      message,
      statusCode,
      dbResponse: error,
      error: true,
    });
  }
});

// DELETE ROUTE
router.delete("/", async (req, res) => {
  const favoriteArticleId = req.body.articleId;
  const sessionId = req.session.id;

  try {
    const user = await User.findById(sessionId);

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
      res.json({
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

    res.json({
      message,
      statusCode,
      error,
      error: true,
    });
  }
});

module.exports = router;
