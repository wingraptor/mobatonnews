const express = require("express");
const router = express.Router();
const Archive = require("../models/archive");
const Data = require("../models/dataFeed");
const User = require("../models/user");

// Home Page Route
router.get("/", async (req, res) => {
  // Extract email from Auth0 response (user argument)
  let email;
  if (req.user) email = req.user.emails[0].value;

  try {
    // Get data from api for weather, currency, oil prices etc.
    const widgetData = await Data.find({});
    // Query DB for user using their email address
    const user = await User.findOne({ email });
    let favoriteArticleIds = [];

    // Get user specific favorite Article Ids
    if (user) favoriteArticleIds = user.favoriteArticles;

    // Query DB for articles data
    const articles = await Archive.aggregate([
      //Sort articles in each document (Sorts in descending order )
      { $sort: { created_at: -1 } },
      { $limit: 50 },
      //group articles according to created_at
      { $group: { _id: "$created_at", data: { $push: "$$ROOT" } } },
      //sort according created_at
      { $sort: { "data.created_at": -1 } },
    ]);

    // Render homepage template
    res.status(200).render("home", {
      articles: articles,
      data: widgetData[0],
      favoriteArticleIds: favoriteArticleIds,
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
