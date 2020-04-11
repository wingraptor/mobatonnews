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
      { $sort: { utcDate: -1 } },
      { $limit: 50 },
      //group articles according to utcDate
      { $group: { _id: "$utcDate", data: { $push: "$$ROOT" } } },
      //sort according utcDate
      { $sort: { "data.utcDate": -1 } },
    ]);

    // Render homepage template
    res.status(200).render("home", {
      // Object property shorthand for articles:articles
      articles,
      data: widgetData[0],
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
