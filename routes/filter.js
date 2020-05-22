const express = require("express");
const router = express.Router();
const Archive = require("../models/archive");
const Data = require("../models/dataFeed");
const moment = require("moment");
const User = require("../models/user");

router.get("/:filterValue", async (req, res) => {
  // Extract email from Auth0 response
  let email;
  if (req.user) email = req.user.emails[0].value;
  let filterValue = req.params.filterValue;
  let queryFilter;

  let favoriteArticleIds = [];
  const user = await User.findOne({ email });
  // If user has account, retrieve favorited articles
  if (user) {
    favoriteArticleIds = user.favoriteArticles;
  }

  if (filterValue === "daily") {
    queryFilter = {
      $match: {
        utcDate: {
          $gte: new Date(
            moment().utc().subtract(4, "hours").startOf("day").format()
          ),
          $lte: new Date(
            moment().utc().subtract(4, "hours").endOf("day").format()
          ),
        },
      },
    };
  } else if (filterValue === "yesterday") {
    queryFilter = {
      $match: {
        utcDate: {
          $gte: new Date(
            moment()
              .utc()
              .subtract(4, "hours")
              .subtract(1, "day")
              .startOf("day")
              .format()
          ),
          $lte: new Date(
            moment()
              .utc()
              .subtract(4, "hours")
              .subtract(1, "day")
              .endOf("day")
              .format()
          ),
        },
      },
    };
  } else if (filterValue === "corona") {
    queryFilter = {
      $match: {
        $text: {
          $search: "corona covid",
        },
      },
    };
  }

  try {
    // Get data from api for weather, currency, oil prices etc.
    const widgetData = await Data.find({});
    const articles = await Archive.aggregate([
      // Filter articles according to page clicked
      queryFilter,
      { $sort: { created_at: -1 } },
      { $limit: 50 },
      //group articles according to siteIDs
      { $group: { _id: "$created_at", data: { $push: "$$ROOT" } } },
      //sort according createdAt
      { $sort: { _id: -1 } },
    ]);
    // Render homepage template
    res.status(200).render("home", {
      // Object property shorthand for articles:articles
      articles,
      data: widgetData[0],
      favoriteArticleIds,
    });
  } catch (error) {
    console.log(error);
    res.status(404).render("404");
  }
});

module.exports = router;
