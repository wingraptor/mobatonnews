const express = require("express");
const router = express.Router();
const Archive = require("../models/archive");
const Data = require("../models/dataFeed");

const dateStandardiser = require("../helpers/dateStandardiser");


// HELPER FUNCTION

// Counts number of articles queried from DB
function articleCounter(queryResult) {
  let count = 0;
  // Iterate through artidcles query array
  queryResult.forEach(document => {
    // Iterate through articles in the data array
    document.data.forEach(function() {
      // Increment count variable for each article in data array
      count++;
    });
  });
  return count;
}

// GET Search Page
router.get("/", async (req, res) => {
  try {
    const articles = await Archive.distinct("siteID");
    // Render archive template
    res.status(200).render("search", {
      // Object property shorthand for articles:articles
      articles,
    });
  } catch (error) {
    console.log(error);
  }
});

// GET Search Results and Load Page
router.get("/results", async (req, res) => {
  const siteID = Number(req.query.siteID);
  const startDate = req.query.startDate;
  // If endDate not given in form, then endDate is today's date
  const endDate = req.query.endDate || new Date().toISOString().slice(0, 10);
  const filter = {
    $match: {
      siteID: siteID,
      utcDate: {
        $gte: new Date(dateStandardiser.startOfDay(startDate)),
        $lte: new Date(dateStandardiser.endOfDay(endDate)),
      },
    },
  };

  try {
    const searchResults = await Archive.aggregate([
      filter,
      // Sort articles according to created date/time, from newest to oldest
      { $sort: { created_at: 1 } },
      // Group articles according to created date; note that date has been formated to the YYYYMMDD format
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$utcDate" } },
          data: { $push: "$$ROOT" },
        },
      },
      { $addFields: { articleCount: { $size: "$data" } } },
      // Sort articles according to date in ascending order
      { $sort: { _id: 1 } },
    ]);
    // Render results template
    res.staus(200).render("searchResults", {
      siteID: siteID,
      articles: searchResults,
      articleCount: articleCounter(searchResults),
      dates: {
        startDate: startDate,
        endDate: endDate,
      },
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
