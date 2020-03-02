const bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  Article = require("./models/scrapedData.js"),
  Archive = require("./models/archive.js"),
  Weather = require("./models/weatherData"),
  express = require("express"),
  moment = require("moment"),
  ejs = require("ejs");


//Environment variable setup
require("dotenv").config();
const port = process.env.PORT || 3000;
const IP = process.env.IP || "";
const databaseUrl = process.env.DATABASE_URL || "mongodb://localhost:27017/scrapedData";

//mongoose config
mongoose.connect(
  databaseUrl,
  { useNewUrlParser: true }
);

//EJS + Express config
const app = express();
// Set express to recognise all res.render files as .ejs 
app.set("view engine", "ejs");
// Make express aware of public folder; location of stylesheets, scripts and images
app.use(express.static(__dirname + "/public"));
// Body Parser Config
app.use(bodyParser.urlencoded({ extended: true }));


/************************************
Helper Functions!!!
************************************/
// Use siteID to get siteName and URL - reverse function is found in scrape.js
function siteInfo(siteID) {
  let siteInfo = {
    name: "",
    URL: "",
    icon: "",
    count: 10 //UPDATE WHENEVER ADDING A NEW SITE
  };
  switch (siteID) {
    case 0:
      siteInfo.name = "Barbados Today";
      siteInfo.URL = "https://barbadostoday.bb/";
      siteInfo.icon = "newspaper";
      break;
    case 1:
      siteInfo.name = "Nation News";
      siteInfo.URL = "http://www.nationnews.com/";
      siteInfo.icon = "newspaper";
      break;
    case 2:
      siteInfo.name = "Loop News";
      siteInfo.URL = "http://www.loopnewsbarbados.com/";
      siteInfo.icon = "newspaper";
      break;
    case 3:
      siteInfo.name = "Barbados Advocate";
      siteInfo.URL = "https://www.barbadosadvocate.com/";
      siteInfo.icon = "newspaper";
      break;
    case 4:
      siteInfo.name = "Barbados Intl Business Assoc";
      siteInfo.URL = "http://biba.bb/";
      siteInfo.icon = "briefcase";
      break;
    case 5:
      siteInfo.name = "Barbados ICT";
      siteInfo.URL = "http://barbadosict.org/";
      siteInfo.icon = "laptop";
      break;
    case 6:
      siteInfo.name = "Business Barbados";
      siteInfo.URL = "http://businessbarbados.com/";
      siteInfo.icon = "briefcase";
      break;
    case 7:
      siteInfo.name = "Government Info Service";
      siteInfo.URL = "http://gisbarbados.gov.bb/gis-news/"
      siteInfo.icon = "bell";
      break;
    case 8:
      siteInfo.name = "CBC News";
      siteInfo.URL = "https://www.cbc.bb/index.php/news/barbados-news"
      siteInfo.icon = "newspaper";
      break;
    case 9:
      siteInfo.name = "Barbados Reporter";
      siteInfo.URL = "https://www.bajanreporter.com/category/new/";
      siteInfo.icon = "newspaper"
      break;
    case 10:
      siteInfo.name = "The Broad Street Journal";
      siteInfo.URL = "https://www.broadstjournal.com/";
      siteInfo.icon = "newspaper"
      break;
  }
  return siteInfo;
}


// Convert from UTC to Unix
// function unixTime(UTCDate) {
//   return Date.parse(UTCDate) / 1000;
// }

// Gives the moment JS format code for the specific date format used by each site
// function momentDateFormat(siteID) {
//   let dateFormat = "";

//   switch (siteID) {
//     case 0:
//       dateFormat = "LLL";
//       break;
//     case 1:
//       dateFormat = "D MMMM YYYY";
//       break;
//     case 2:
//     case 4:
//     case 5:
//     case 7:
//     case 8:
//       dateFormat = "LL";
//       break;
//     case 3:
//       dateFormat = "ddd, MM/DD/YYYY - H:mma";
//     case 9:
//       dateFormat = "MMMM Do, YYYY";
//       break;
//   }
//   return dateFormat;
// }

// Converts date to UTC format
function dateStandardiser(date) {
  return moment(date).format();
}

function articleCounter(queryResult) {
  let count = 0;
  // Iterate through artidcles query array
  queryResult.forEach(document => {
    // Iterate through articles in the data array
    document.data.forEach(function () {
      // Increment count variable for each article in data array
      count++;
    })
  });
  return count;
}

/*********************************
ROUTES
************************************/

// Home Page Route
app.get("/", function (req, res) {
  // Query Articles DB
  Article.aggregate([
    //Sort articles in each document (Sorts in ascending order )
    { $sort: { articleCount: 1 } },
    //group articles according to siteIDs
    { $group: { _id: "$siteID", data: { $push: "$$ROOT" } } },
    //sort according siteID
    { $sort: { _id: 1 } },
  ], function (error, articles) {
    if (error) {
      console.log("Error quering articles DB on home page");
    }
    else {
      // Get Local Weather To Be Used in Widget
      Weather.find({}, function (error, data) {
        // Render homepage template
        res.render("home", {
          articles: articles,
          siteInfo: siteInfo,
          weather: data[0]
        });
      })
    }
  });
});

// Archive Page Route
app.get("/archive", function (req, res) {
  // Query Articles DB and return a list of unique news sites (as the SiteIDs) currently in DB
  Archive.distinct(
    "siteID"
    , function (error, articles) {
      if (error) {
        console.log("Error quering archives DB on archives page");
      }
      else {
        // Get Local Weather To Be Used in Widget
        Weather.find({}, function (error, data) {
          // Render archive template
          res.render("archive", {
            articles: articles,
            siteInfo: siteInfo,
            weather: data[0]
          });
        })
      }
    });
});

// Results Page Route
app.get("/results", function (req, res) {
  let siteID = Number(req.query.siteID),
    startDate = req.query.startDate,
    // If endDate not given in form, then endDate is today's date
    endDate = req.query.endDate || new Date().toISOString().slice(0, 10);

  Archive.aggregate([
    // Filter search results based on siteID,  start date and end date given by the user
    { $match: { "siteID": siteID, "created_at": { "$gte": new Date(dateStandardiser(startDate)), "$lte": new Date(dateStandardiser(endDate)) } } },
    // Group articles according to created date; note that date has been formated to the YYYYMMDD format
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, data: { $push: "$$ROOT" } } },
    { $addFields: { articleCount: { $size: "$data" } } },
    // Sort articles according to date in ascending order
    { $sort: { _id: 1 } }
  ], function (error, articles) {
    if (error) {
      console.log(error)
    } else {
      // Get Local Weather To Be Used in Widget
      Weather.find({}, function (error, data) {
        // Render results template
        res.render("results", {
          weather: data[0],
          siteID: siteID,
          siteInfo: siteInfo,
          articles: articles,
          articleCount: articleCounter(articles),
          dates: {
            startDate: startDate,
            endDate: endDate
          }
        });
      });
    }
  }
  );
});

//Tell Express to listen for requests on port 3000 (starts local server)
//Visit localhost:3000 to reach site being served by local server.
app.listen(port, IP, function () {
  console.log("Server started");
});