const mongoose = require("mongoose"),
  nodemailer = require("nodemailer"),
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
const User = require("./models/user");

//Environment variable setup
require("dotenv").config();
const databaseUrl =
  process.env.DATABASE_URL || "mongodb://localhost:27017/scrapedData";
const emailPassword = process.env.EMAIL_PASSWORD;

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
const location = "America/Barbados",
  scrapeHours = "*",
  scrapeMins = "0,30";

// let newlyAddedArticles = [];

// Scrape at minute 0 and minute 30 every hour
new CronJob(
  `0 ${scrapeMins} ${scrapeHours} * * *`,
  (_) => {
    console.log("Cron job started");
    scrapeFunction(scrapeInfo);
  },
  null,
  "start",
  location
);

// Send email every 30mins from 7am t0 9pm
new CronJob(
  `0 0,30 7-21 * * *`,
  (_) => {
    console.log("Email Function Started");
    getArticles("30min");
  },
  null,
  "start",
  location
);

new CronJob(
  `0 0 0-23 * * *`,
  (_) => {
    console.log("Email Function Started");
    getArticles("1hr");
  },
  null,
  "start",
  location
);

new CronJob(
  `0 0 7 * * *`,
  (_) => {
    console.log("Email Function Started");
    getArticles("daily");
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

// Parse website for news article Data
async function parseFunction(promises, siteID) {
  let parsedData = [];
  for (let i = 0; i <= promises.length - 1; i++) {
    try {
      parsedData.push(scrapeInfo[siteID[i]].parse(promises[i]));
    } catch {
      console.log(chalk.bold.red(error));
    }
  }
  saveToDb(parsedData);
}

// Save Parsed Data to DB
async function saveToDb(parsedData) {
  for (let i = 0; i <= parsedData.length - 1; i++) {
    for (let j = 0; j <= parsedData[i].length - 1; j++) {
      try {
        let currentDate = new Date();
        let date = parsedData[i][j].date
          ? parsedData[i][j].date
          : currentDate.toISOString();
        let utcDate = dateStandardiser.utcDate(date, parsedData[i][j].siteID);

        const articleData = new Archive({
          link: parsedData[i][j].link,
          headline: parsedData[i][j].headline,
          summary: parsedData[i][j].summary,
          imgURL: parsedData[i][j].imgURL,
          date: date,
          siteID: parsedData[i][j].siteID,
          utcDate: utcDate,
        });

        const savedArticleData = await articleData.save();
        // newlyAddedArticles.push(savedArticleData);
      } catch (error) {
        if (error && error.code !== 11000) {
          console.log(chalk.bold.magenta(error));
        }
      }
    }
  }
  // emailNewArticles(newlyAddedArticles);
}

/****************************************
Emailer Functions
******************************************/

async function getArticles(frequency) {
  if (frequency === "30min") {
    queryFilter = {
      $match: {
        utcDate: {
          $gte: new Date(moment().utc().subtract(30, "minutes").format()),
          $lte: new Date(moment().utc().format()),
        },
      },
    };
  } else if (frequency === "1hr") {
    queryFilter = {
      $match: {
        utcDate: {
          $gte: new Date(moment().utc().subtract(1, "hours").format()),
          $lte: new Date(moment().utc().format()),
        },
      },
    };
  } else if (frequency === "daily") {
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
  }

  try {
    const users = await User.find({ frequency });
    const emailAddresses = users.map((user) => user.emailAddress);
    const articles = await Archive.aggregate([queryFilter]);

    generateEmail(articles, emailAddresses);
  } catch (error) {
    console.log(error);
  }
}

function generateEmail(articles, emailAddresses) {
  let newArticleCount = articles.length;

  // Ensure email only sent when articles have been added to DB
  if (newArticleCount !== 0) {
    let emailHeading = `<h3><strong>There ${
      newArticleCount > 1 ? "are a total of" : "is"
    } <span style="color:rgba(80, 200, 120, 1);"> 
    ${newArticleCount} </span> new ${
      newArticleCount > 1 ? "articles" : "article"
    }:<strong></h3>`;
    let emailBody = "<ul>";

    // Generate email body
    for (let i = 0; i <= articles.length - 1; i++) {
      let headline = articles[i].headline || "";
      let summary = articles[i].summary || "No article summary available";
      let imgSrc =
        articles[i].imgURL ||
        "https://cdn.pixabay.com/photo/2019/04/29/16/11/new-4166472_960_720.png";
      let link = articles[i].link || "#";

      emailBody += `<li><h3><a href="${link}">${headline}</a></h3><p>${summary}</p></li>`;
    }

    // Send Email
    emailNewArticles(emailBody, emailHeading);
    function emailNewArticles(emailBody, emailHeading) {
      const myEmailAddress = "mobatonanews@gmail.com";
      const currentDateTime = moment().format("llll");

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: myEmailAddress,
          pass: emailPassword,
        },
      });

      const mailOptions = {
        from: myEmailAddress,
        to: emailAddresses,
        subject: `Mobaton-A News: New Article Alert - ${currentDateTime}!`,
      };

      // Add article html to options for node mailer
      mailOptions.html = emailHeading + emailBody + "</ul>";

      // Send email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
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
// new CronJob(
//   `0 0 12 * * *`,
//   function () {
//     const gasoptions = {
//       method: "GET",
//       url: "https://api.collectapi.com/gasPrice/otherCountriesGasoline",
//       headers: {
//         "content-type": "application/json",
//         authorization: `apikey ${process.env.FUEL_API_KEY}`,
//       },
//     };

//     const dieseloptions = {
//       method: "GET",
//       url: "https://api.collectapi.com/gasPrice/otherCountriesDiesel",
//       headers: {
//         "content-type": "application/json",
//         authorization: `apikey ${process.env.FUEL_API_KEY}`,
//       },
//     };

//     // Get Gasoline Prices
//     request.get(gasoptions, function (error, response, body) {
//       if (error) {
//         console.log(`Error getting currency data: ${error}`);
//       } else {
//         let arr = JSON.parse(body).results;
//         arr.forEach((element) => {
//           if (element.country === "Barbados") {
//             Data.findOneAndUpdate(
//               {},
//               {
//                 gasPrice: element.price,
//               },
//               function (err, data) {
//                 if (err) {
//                   console.log(`Error adding gas price to DB: ${err}`);
//                 }
//               }
//             );
//           }
//         });
//       }
//     });

//     // Get Diesel Prices
//     request.get(dieseloptions, function (error, response, body) {
//       if (error) {
//         console.log(`Error getting currency data: ${error}`);
//       } else {
//         let arr = JSON.parse(body).results;
//         arr.forEach((element) => {
//           if (element.country === "Barbados") {
//             Data.findOneAndUpdate(
//               {},
//               {
//                 dieselPrice: element.price,
//               },
//               function (err, data) {
//                 if (err) {
//                   console.log(`Error adding diesel price to DB: ${err}`);
//                 }
//               }
//             );
//           }
//         });
//       }
//     });
//   },
//   null,
//   "start",
//   location
// );
