const bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  Article = require("./models/scrapedData.js"),
  Archive = require("./models/archive.js"),
  Weather = require("./models/weatherData"),
  express = require("express"),
  moment = require("moment"),
  Data = require("./models/dataFeed.js"),
  ejs = require("ejs"),
  sw = require("stopword");

//Environment variable setup
require("dotenv").config();
const port = process.env.PORT || 3000;
const IP = process.env.IP || "";
const databaseUrl =
  process.env.DATABASE_URL || "mongodb://localhost:27017/scrapedData";

//mongoose config
mongoose.connect(databaseUrl, { useNewUrlParser: true, useCreateIndex: true });
mongoose.set("useUnifiedTopology", true);

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
      siteInfo.URL = "http://gisbarbados.gov.bb/gis-news/";
      siteInfo.icon = "bell";
      break;
    case 8:
      siteInfo.name = "CBC News";
      siteInfo.URL = "https://www.cbc.bb/index.php/news/barbados-news";
      siteInfo.icon = "newspaper";
      break;
    case 9:
      siteInfo.name = "Barbados Reporter";
      siteInfo.URL = "https://www.bajanreporter.com/category/new/";
      siteInfo.icon = "newspaper";
      break;
    case 10:
      siteInfo.name = "The Broad Street Journal";
      siteInfo.URL = "https://www.broadstjournal.com/";
      siteInfo.icon = "newspaper";
      break;
  }
  return siteInfo;
}

// Gives the moment JS format code for the specific date format used by each site
function momentDateFormat(siteID) {
  let dateFormat = "";

  switch (siteID) {
    case 0:
      dateFormat = "LLL";
      break;
    case 1:
      dateFormat = "D MMMM YYYY";
      break;
    case 2:
    case 4:
    case 5:
    case 7:
    case 8:
    case 10:
      dateFormat = "LL";
      break;
    case 3:
      dateFormat = "ddd, MM/DD/YYYY - H:mma";
      break;
    case 9:
      dateFormat = "MMMM Do, YYYY";
      break;
  }
  return dateFormat;
}

// Format dates to UTC format and be able to set either the end of date or start of day
const dateStandardiser = {
  endOfDay: function(date) {
    return moment
      .utc(date)
      .endOf("day")
      .format();
  },
  startOfDay: function(date) {
    return moment
      .utc(date)
      .startOf("day")
      .format();
  },
  utcDate: function(date, siteID) {
    return moment
      .utc(date, momentDateFormat(siteID))
      .startOf("day")
      .format();
  },
  localFormat: function(date, siteID) {
    if (date && siteID) {
      return moment(date, momentDateFormat(siteID)).format("LL");
    } else if (date) {
      return moment(date).format("LL");
    } else {
      return "";
    }
  }
};

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

/*********************************
ROUTES
************************************/

// Home Page Route
app.get("/", function(req, res) {
  // Query Articles DB
  Archive.aggregate(
    [
      //Sort articles in each document (Sorts in descendig order )
      { $sort: { utcDate: -1 } },
      { $limit: 50 },
      //group articles according to utcDate
      { $group: { _id: "$utcDate", data: { $push: "$$ROOT" } } },
      //sort according utcDate
      { $sort: { "data.utcDate": -1 } }
      // { $sort: { _id: 1 } }
      // { $group: { _id: "$siteID", data: { $push: "$$ROOT" } } },
      // { $sort: { _id: 1 } },
      // { $sort: {"utcDate":-1} },
      // {$project: {
      //   "data": {
      //     "$slice": ["$data", 15]
      //   }
      // }}
    ],
    function(error, articles) {
      if (error) {
        console.log("Error quering articles DB on home page" + error);
      } else {
        // Get Local Weather To Be Used in Widget
        Data.find({}, function(error, data) {
          // Render homepage template
          res.render("home", {
            articles: articles,
            siteInfo: siteInfo,
            data: data[0],
            dateStandardiser: dateStandardiser,
            date: new Date()
          });
        });
      }
    }
  );
});

// "Filtered" Articles Route
app.get("/filter/:filterValue", function(req, res) {
  let filterValue = req.params.filterValue,
    queryFilter;

  if (filterValue === "daily") {
    queryFilter = {
      $match: {
        utcDate: {
          $gte: new Date(
            moment()
              .utc()
              .startOf("day")
              .format()
          ),
          $lte: new Date(
            moment()
              .utc()
              .endOf("day")
              .format()
          )
        }
      }
    };
  } else if (filterValue === "yesterday") {
    queryFilter = {
      $match: {
        utcDate: {
          $gte: new Date(
            moment()
              .subtract(1, "day")
              .utc()
              .startOf("day")
              .format()
          ),
          $lte: new Date(
            moment()
              .subtract(1, "day")
              .utc()
              .endOf("day")
              .format()
          )
        }
      }
    };
  } else if (filterValue === "tomorrow") {
    res.render("error");
    return;
  } else if (filterValue === "corona") {
    queryFilter = {
      $match: {
        $text: {
          $search: "corona covid"
        }
      }
    };
  }

  // Query Articles DB
  Archive.aggregate(
    [
      // Filter articles according to page clicked
      queryFilter,
      { $sort: { utcDate: -1 } },
      { $limit: 50 },
      //group articles according to siteIDs
      { $group: { _id: "$utcDate", data: { $push: "$$ROOT" } } },
      //sort according utcDate
      { $sort: { "data.utcDate": -1 } }
    ],
    function(error, articles) {
      if (error) {
        console.log(error + "     Error quering articles DB on home page");
      } else {
        // Get Data To Be Used in Widget
        Data.find({}, function(error, data) {
          // Render homepage template
          res.render("home", {
            articles: articles,
            siteInfo: siteInfo,
            data: data[0],
            dateStandardiser: dateStandardiser
          });
        });
      }
    }
  );
});

// Archive Page Route
app.get("/archive", function(req, res) {
  // Query Articles DB and return a list of unique news sites (as the SiteIDs) currently in DB
  Archive.distinct("siteID", function(error, articles) {
    if (error) {
      console.log("Error quering archives DB on archives page");
    } else {
      // Render archive template
      res.render("archive", {
        articles: articles,
        siteInfo: siteInfo
      });
    }
  });
});

// Results Page Route
app.get("/results", function(req, res) {
  let siteID = Number(req.query.siteID),
    startDate = req.query.startDate,
    // If endDate not given in form, then endDate is today's date
    endDate = req.query.endDate || new Date().toISOString().slice(0, 10),
    filter = {
      $match: {
        siteID: siteID,
        utcDate: {
          $gte: new Date(dateStandardiser.startOfDay(startDate)),
          $lte: new Date(dateStandardiser.endOfDay(endDate))
        }
      }
    };

  Archive.aggregate(
    [
      // Filter search results based on siteID,  start date and end date given by the user
      filter,
      // Sort articles according to created date/time, from newest to oldest
      { $sort: { created_at: 1 } },
      // Group articles according to created date; note that date has been formated to the YYYYMMDD format
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$utcDate" } },
          data: { $push: "$$ROOT" }
        }
      },
      { $addFields: { articleCount: { $size: "$data" } } },
      // Sort articles according to date in ascending order
      { $sort: { _id: 1 } }
    ],
    function(error, articles) {
      if (error) {
        console.log(error);
      } else {
        // Render results template
        res.render("results", {
          siteID: siteID,
          siteInfo: siteInfo,
          articles: articles,
          articleCount: articleCounter(articles),
          dates: {
            startDate: startDate,
            endDate: endDate
          }
        });
      }
    }
  );
});



// Show page with displays charts
app.get("/insights/charts", function(req,res){
  // Query Articles DB and return a list of unique news sites (as the SiteIDs) currently in DB
  Archive.distinct("siteID", function(error, articles) {
    if (error) {
      console.log("Error quering archives DB on archives page");
    } else {
      // Render archive template
      res.render("insights", {
        articles: articles,
        siteInfo: siteInfo
      });
    }
  });
});


// End point to query DB to send to front end to generate charts that show word counts
app.get("/insights/charts/:siteID", function(req, res) {
  let siteID = Number(req.params.siteID);
  let wordCount = req.params.count; //Change these

  // // Get all headlines from archive DB
  Archive.aggregate(
    [
      {
        $match: {
          siteID: siteID
        }
      },
      {
        $project: {
          headline: 1
        }
      }
    ],
    function(error, documents) {
      if (error) {
        console.log(error);
      } else {
        // Extract headlines  only from documents and add to an array
        let document = documents;
        // List of non-printable Unicode Characters: https://stackoverflow.com/questions/11598786/how-to-replace-non-printable-unicode-characters-javascript
        const nonPrintUnicode = /[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g;

        // Generate arr containing headlines only in the form [["full", "headline", "text"], ["another", "fullheadline", "text"], ....]
        let headlinesArr = document.reduce((arr, document) => {
          arr.push(document.headline.split(" "));
          return arr;
        }, []);

        // Flatten 2 dimensional array to one directional array the form ["this", "is", "one", "headline", "this", "is", "another"]
        const headlineWordsArr = headlinesArr.flat(Infinity);

        // Remove unicode characters from headlines
        const headlineWordsNonPrintUnicodeRemoved = headlineWordsArr.reduce(
          (arr, word) => {
            arr.push(word.replace(nonPrintUnicode, ""));
            return arr;
          },
          []
        );

        // Clean up array by removing stop words - using stopword npm package --> https://www.npmjs.com/package/stopword
        const headlineWordsArrNoStopWords = sw.removeStopwords(
          headlineWordsNonPrintUnicodeRemoved
        );

        // Count number of times word appears in text in the form [word1: 1, word3: 2, ....]
        const wordCountObj = headlineWordsArrNoStopWords.reduce(
          (allWords, word) => {
            if (word in allWords) {
              allWords[word]++;
            } else {
              allWords[word] = 1;
            }
            return allWords;
          },
          {}
        );
        // Convert from wordCountObj to the arr in the form [["word", 1], ["word2, 3"],...]
        const wordCountArr = Object.entries(wordCountObj);

        // const wordsArr = wordCountArr.reduce((arr, wordArr) => {
        //   arr.push(wordArr[0]);
        //   return arr;
        // }, []);

        // Sort array in descending order according to count of words
        const sortedWordCountArr = wordCountArr
          .sort(function(a, b) {
            return b[1] - a[1];
          })
          .slice(0, 10); // Set article limit here

        const JSONdata = JSON.stringify(sortedWordCountArr);
        res.send(JSONdata);
      }
    }
  );
});

app.get("*", function(req, res) {
  // Get Local Weather To Be Used in Widget
  Weather.find({}, function(error, data) {
    // Render results template
    res.render("error");
  });
});

//Tell Express to listen for requests on port 3000 (starts local server)
//Visit localhost:3000 to reach site being served by local server.
app.listen(port, IP, function() {
  console.log("Server started");
});
