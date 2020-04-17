const express = require("express");
const router = express.Router();
const Archive = require("../models/archive");
const Data = require("../models/dataFeed");
const mongoose = require("mongoose");

router.get("/", async (req, res) => {
  try {
    // Get data from api for weather, currency, oil prices etc.
    const widgetData = await Data.find({});
    // Render homepage template
    res.render("favorites", {
      data: widgetData[0],
    });
  } catch (error) {
    console.log(error);
  }
});

router.post("/", async (req, res) => {
  let favoriteArticleIdsObj = req.body

  let mongoObjectIds = [];

  for(const key in favoriteArticleIdsObj) {
    let mongooseObjectid = mongoose.Types.ObjectId(favoriteArticleIdsObj[key]);
    mongoObjectIds.push(mongooseObjectid);
  }

  try {
    // Get data from api for weather, currency, oil prices etc.
    const widgetData = await Data.find({});
    // Query DB for articles data
    const articles = await Archive.aggregate([
      { $match: { _id: { $in: mongoObjectIds } } },
      //Sort articles in each document (Sorts in descending order )
      { $sort: { created_at: -1 } },
      //group articles according to created_at
      { $group: { _id: "$created_at", data: { $push: "$$ROOT" } } },
      //sort according created_at
      { $sort: { "data.created_at": -1 } },
    ]);
    res.json(articles);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
