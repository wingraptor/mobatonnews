const mongoose = require("mongoose"),
  weatherAPI = require("weather-js"),
  request = require("request"),
  cheerio = require("cheerio"),
  CronJob = require("cron").CronJob,
  Twitter = require("twitter"),
  moment = require("moment"),
  chalk = require("chalk"),
  rp = require("request-promise");

// Import Mongoose Models
const Article = require("./models/scrapedData.js");
const Archive = require("./models/archive.js");
const Weather = require("./models/weatherData");
const Data = require("./models/dataFeed.js");

//Environment variable setup
require("dotenv").config();
const databaseUrl =
  process.env.DATABASE_URL || "mongodb://localhost:27017/scrapedData";

//mongoose config
mongoose.connect(databaseUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// Import Helper Functions
const dateStandardiser = require("./helpers/dateStandardiser");
const scrapeInfo = require("./helpers/scrapeInfo");

//  Twitter Config
// let client = new Twitter({
//   consumer_key: process.env.TWITTER_CONSUMER_KEY,
//   consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
//   access_token_key : process.env.TWITTER_ACCESS_TOKEN,
//   access_token_secret: process.env.TWITTER_ACCESS_SECRET
// });

/************************
Declare Global Variables
*************************/
// Count articles as data is scraped from website
let articleCount = 0,
  location = "America/Barbados",
  scrapeHours = "*",
  scrapeMins = 0;

// Scrape at minute 0 and minute 30 every hour
new CronJob(
  `0 0,15 ${scrapeHours} * * *`,
  (_) => {
    console.log("Cron job started");
    scrapeFunction(scrapeInfo);
  },
  null,
  "start",
  location
);

/****************************************
Article Scrape, Parse and Save Functions
******************************************/
// Scrape Website
async function scrapeFunction(scrapeInfo) {
  let promises = [];
  let siteID = [];
  // Iterate through scrapeInfo array to access info. needed for scraping
  for (let i = 0; i <= scrapeInfo.length - 1; i++) {
    // Allows for parsing of html document returned by request promise using cheerio
    scrapeInfo[i].requestOptions.transform = function (body) {
      return cheerio.load(body);
    };
    // Check that site is to be scraped
    if (scrapeInfo[i].toBeScraped) {
      try {
        const $ = await rp(scrapeInfo[i].requestOptions);
        promises.push($);
        siteID.push(i);
      } catch (error) {
        // Add ability to email error to myself
        console.log(
          chalk.bold.yellow(
            `Error code: ${error.statusCode} from ${error.options.uri}`
          )
        );
      }
    }
  }
  parseFunction(promises, siteID);
}

// Parse website for Article Data
async function parseFunction(promises, siteID) {
  for (let i = 0; i <= promises.length - 1; i++) {
    try {
      const parsedData = scrapeInfo[siteID[i]].parse(promises[i]);
      // Save to DB
      saveToDb(parsedData);
    } catch {
      console.log(chalk.bold.red(error));
    }
  }
}

// Save Parsed Article Data to DB
async function saveToDb(parsedData) {
  for (var i = 0; i <= parsedData.length - 1; i++) {
    try {
      let currentDate = new Date();
      let date = parsedData[i].date
        ? parsedData[i].date
        : currentDate.toISOString();
      let utcDate = dateStandardiser.utcDate(date, parsedData[i].siteID);

      const articleData = new Archive({
        link: parsedData[i].link,
        headline: parsedData[i].headline,
        summary: parsedData[i].summary,
        imgURL: parsedData[i].imgURL,
        date: date,
        siteID: parsedData[i].siteID,
        utcDate: utcDate,
      });

      const savedArticleData = await articleData.save();
      console.log(chalk.red.bold(savedArticleData));
    } catch (error) {
      if (error && error.code !== 11000) {
        console.log(chalk.bold.magenta(error));
      }
    }
  }
}

// // Get Weather Data and FX Data and reset article count
// new CronJob(`0 26 ${scrapeHours} * * *`, function () {
//   // Reset article count to 0 after all sites have been scraped
//   articleCount = 0;
//   weatherAPI.find({ search: 'Bridgetown, Barbados', degreeType: 'C' }, function (err, result) {
//     if (err) console.log(`Error getting weather data: ${err}`);
//     Data.findOneAndUpdate({}, {
//       temperature: result[0].current.temperature,
//       skytext: result[0].current.skytext,
//       imageUrl: result[0].current.imageUrl
//     },
//       { upsert: true }, function (err, data) {
//         if (err) {
//           console.log(`Error adding weather to DB: ${err}`);
//         }
//       });
//   });
//   Get Fx rates
//   request.get(`https://free.currconv.com/api/v7/convert?q=GBP_BBD,CAD_BBD&compact=ultra&apiKey=${process.env.CURRENCY_API_KEY}`, function (error, response, body) {
//     if (error) {
//       console.log(`Error getting currency data: ${error}`);
//     } else {
//       Data.findOneAndUpdate({}, {
//         gbp: JSON.parse(body).GBP_BBD,
//         cad: JSON.parse(body).CAD_BBD
//       }, function (err, data) {
//         if (err) {
//           console.log(`Error adding currency data to page: ${err}`)
//         }
//       });
//     }
//   });
// }, null, "start", location);

// Get Fuel Price Data - once a day
new CronJob(
  `0 0 12 * * *`,
  function () {
    const gasoptions = {
      method: "GET",
      url: "https://api.collectapi.com/gasPrice/otherCountriesGasoline",
      headers: {
        "content-type": "application/json",
        authorization: `apikey ${process.env.FUEL_API_KEY}`,
      },
    };

    const dieseloptions = {
      method: "GET",
      url: "https://api.collectapi.com/gasPrice/otherCountriesDiesel",
      headers: {
        "content-type": "application/json",
        authorization: `apikey ${process.env.FUEL_API_KEY}`,
      },
    };

    // Get Gasoline Prices
    request.get(gasoptions, function (error, response, body) {
      if (error) {
        console.log(`Error getting currency data: ${error}`);
      } else {
        let arr = JSON.parse(body).results;
        arr.forEach((element) => {
          if (element.country === "Barbados") {
            Data.findOneAndUpdate(
              {},
              {
                gasPrice: element.price,
              },
              function (err, data) {
                if (err) {
                  console.log(`Error adding gas price to DB: ${err}`);
                }
              }
            );
          }
        });
      }
    });

    // Get Diesel Prices
    request.get(dieseloptions, function (error, response, body) {
      if (error) {
        console.log(`Error getting currency data: ${error}`);
      } else {
        let arr = JSON.parse(body).results;
        arr.forEach((element) => {
          if (element.country === "Barbados") {
            Data.findOneAndUpdate(
              {},
              {
                dieselPrice: element.price,
              },
              function (err, data) {
                if (err) {
                  console.log(`Error adding diesel price to DB: ${err}`);
                }
              }
            );
          }
        });
      }
    });
  },
  null,
  "start",
  location
);
