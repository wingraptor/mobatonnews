const express = require("express");
const router = express.Router();
const Archive = require("../models/archive");
const Data = require("../models/dataFeed");

// Home Page Route
router.get("/", async (req, res) => {
  try {
    // Get data from api for weather, currency, oil prices etc.
    const widgetData = await Data.find({});
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
      // Object property shorthand for articles:articles
      articles:articles,
      data: widgetData[0],
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
