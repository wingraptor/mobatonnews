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
  scrapeMins = 0;

let newlyAddedArticles = [];

// Convert siteName to a siteID - reverse function is found in main.js
function siteID(siteName) {
  let siteID = "";
  switch (siteName) {
    case "Barbados Today":
      siteID = 0;
      break;
    case "Nation News":
      siteID = 1;
      break;
    case "Loop News":
      siteID = 2;
      break;
    case "Barbados Advocate":
      siteID = 3;
      break;
    case "Barbados Intl Business Assoc":
      siteID = 4;
      break;
    case "Barbados ICT":
      siteID = 5;
      break;
    case "Business Barbados":
      siteID = 6;
      break;
    case "Government Info Service":
      siteID = 7;
      break;
    case "CBC News":
      siteID = 8;
      break;
    case "Barbados Reporter":
      siteID = 9;
      break;
    case "The Broad Street Journal":
      siteID = 10;
      break;
  }
  return siteID;
}

/****************************************
Article Scrape, Parse and Save Functions
******************************************/
// scrapeFunction(scrapeInfo);

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
        newlyAddedArticles.push(savedArticleData);
      } catch (error) {
        if (error && error.code !== 11000) {
          console.log(chalk.bold.magenta(error));
        }
      }
    }
  }
  emailNewArticles(newlyAddedArticles);
}

/****************************************
Emailer Functions
******************************************/

let testData = [
  {
    _id: "5e94cdc38ddf1a142ce38006",
    link:
      "https://barbadostoday.bb/2019/01/19/atherley-names-team-to-speak-for-opposition-on-national-issues/",
    headline: "COVID-19 fight far from over, says Czar",
    summary:
      "Barbados is not yet in control of its fight against COVID-19. That...",
    imgURL:
      "https://barbadostoday.bb/wp-content/uploads/2020/04/Screen-Shot-2020-04-13-at-3.22.33-PM-330x206.png",
    date: "2019/01/19",
    siteID: 0,
    utcDate: "2020-04-13T00:00:00.000Z",
    created_at: "2020-04-13T20:38:28.042Z",
    updatedAt: "2020-04-13T21:57:57.792Z",
    __v: 0,
  },
  {
    _id: "5e94cdc38ddf1a142ce38007",
    link:
      "http://www.nationnews.com/nationnews/news/244980/workers-job-spain-remains-lockdown",
    headline: "Some workers back on the job, but Spain remains on lockdown",
    summary:
      "MADRID – Spain let some businesses get back to work on Monday, but one of the strictest lockdowns in Europe remained in place despite a slowing in the country’s coronavirus death rate.",
    imgURL:
      "https://www.nationnews.com/IMG/904/91904/spain-nurse-dies4405-200x196.jpg",
    date: "13 April 2020",
    siteID: 1,
    utcDate: "2020-04-13T00:00:00.000Z",
    created_at: "2020-04-13T20:38:28.043Z",
    updatedAt: "2020-04-13T20:38:28.043Z",
    __v: 0,
  },
  {
    _id: "5e94cdc38ddf1a142ce38008",
    link:
      "http://www.loopnewsbarbados.com/content/covid-19-barbados-buys-additional-20000-test-kits",
    headline: "COVID-19: Barbados buys an additional 20,000 test kits",
    summary:
      "The Government of Barbados has purchased20,000 COVID-19 test kits from the Cayman Islands to increase its stock of the medical suppliesneeded to help combat the pandemic.  Prime Minister Mia Mott...",
    imgURL:
      "https://loopnewslive.blob.core.windows.net/liveimage/sites/default/files/2020-04/O6Wvz0sSPE.jpg",
    date: "April 12, 2020",
    siteID: 2,
    utcDate: "2020-04-12T00:00:00.000Z",
    created_at: "2020-04-13T20:38:28.043Z",
    updatedAt: "2020-04-13T20:38:28.043Z",
    __v: 0,
  },
  {
    _id: "5e94cdc38ddf1a142ce38009",
    link:
      "https://www.barbadosadvocate.com/news/government-committed-consultation-education",
    headline: "Government committed to consultation for education",
    summary:
      "HIGH level talks will be necessary before government can chart a way forward for education as the COVID-19 pandemic continues to be felt by countries across the world. ...",
    date: "Mon, 04/13/2020 - 7:06am",
    siteID: 3,
    utcDate: "2020-04-13T00:00:00.000Z",
    created_at: "2020-04-13T20:38:28.043Z",
    updatedAt: "2020-04-13T20:38:28.043Z",
    __v: 0,
  },
];

function emailNewArticles(articles) {
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
    to: "akonobrathwaite@gmail.com",
    subject: `Mobaton-A News: New Article Alert - ${currentDateTime}!`,
  };


  // Ensure email only sent when articles have been added to DB
  if (articles.length !== 0) {
    let emailHeading = `<h3><strong>There are a total of <span style="color:rgba(80, 200, 120, 1);"> ${articles.length} </span> new articles:<strong></h3>`
    let emailBody = "<ul>";
    for (let i = 0; i <= articles.length - 1; i++) {
      let headline = articles[i].headline || "";
      let summary = articles[i].summary || "No article summary available";
      let imgSrc = articles[i].imgURL || "https://cdn.pixabay.com/photo/2019/04/29/16/11/new-4166472_960_720.png";
      let link = articles[i].link || "#";
      emailBody += `<li><h3><a href="${link}">${headline}</a></h3><p>${summary}</p></li>`;
    }

    // Reset newlyAddedArticles variable
    newlyAddedArticles = [];

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
// -------------------------------------------------------------------------

/****************************************
DB Modifying Functions
******************************************/

// scrapeFunction(scrapeInfo);
// Remove Whitespace from articles in archive collection
async function trimFields() {
  const articles = await Archive.find({ siteID: 9 });

  console.log(chalk.blue(articles.length));

  for (let i = 0; i <= articles.length - 1; i++) {
    // trimmedSummary = article.summary.trim();
    // console.log(chalk.magenta(i));
    try {
      const trimmedArticles = await Archive.update(
        { _id: articles[i]._id },
        {
          $set: {
            // summary: articles[i].summary.trim(),
            headline: articles[i].headline.trim(),
            date: articles[i].date.trim(),
          },
        }
      );
    } catch (error) {
      console.log(chalk.redBright(error));
    }
  }
  console.log(chalk.yellow.bold("DONE"));
}

// Extract article date from its URL from Barbados Today
async function addDateToBBToday() {
  const articles = await Archive.find({ siteID: 0 });
  for (let i = 0; i <= articles.length - 1; i++) {
    // trimmedSummary = article.summary.trim();
    // console.log(chalk.magenta(i));
    try {
      const trimmedArticles = await Archive.updateOne(
        { _id: articles[i]._id },
        {
          $set: {
            date: articles[i].link.substring(25, 35),
          },
        }
      );
    } catch (error) {
      console.log(chalk.redBright(error));
    }
  }
  console.log(chalk.yellow.bold("DONE"));
}
// -----------------------------------------------------------------------------

// Archive.aggregate([
//   { "$sort": { _id: 1 } },
//   {
//     "$group": {
//       "_id": "$headline",
//       "doc": { "$first": "$$ROOT" },
//     },
//   },
//   { "$replaceRoot": { "newRoot": "$doc" } },
//   { "$out": "archives" },
// ], function(error, articles){
//   console.log(articles);
// });

// let options = {
//   uri: "https://barbadostoday.bb/category/local-news/",
// transform: function (body) {
//   return cheerio.load(body);
// },
// };

// const scrapeFunction = async (options) => {
//   try {
//     const $ = await rp(options);
// $(".post").each(function (index, element) {
//   console.log($(this).find(".post-thumbnail a").attr("href"));
// });
//   } catch (error) {
//     console.log(error);
//   }
// };

// scrapeFunction(options);

// Create a new field (utcDate) using the date field value
// Archive.find({siteID: 10, utcDate:{"$exists": false}, date:{"$exists": true}}, function(err, data){
//   // Iterate through each document
//   for (var i = 0; i < data.length; i++) {
//     // Update the UTCdate field to the UTC formatted date taken from the datestring from the date field
//     Archive.updateOne({ _id: data[i]._id }, { $set: { utcDate: dateStandardiser.utcDate(data[i].date, data[i].siteID) } }, function (err, result) {
//       // console.log(result);
//     })
//     console.log("Done");
//   }
//   // console.log(data[data.length-1]);
//   // console.log(data);
//   // console.log(data.length);
// });

// --------------------------------------------------------------------------------------------------------------------------

// Archive.aggregate([
//   {
//     $match:{
//       "headline":"Annual professional registration fees due"
//     }
//   },
//   // {
//   //   $project:{
//   //     UTCDate:{
//   //       $dateFromString:{
//   //         dateString:"$date"
//   //       }
//   //     }
//   //   }
//   // }
// ], function(error, data){
//   console.log(data);
// });

// console.log(momentDateFormat(0));
// Converts date to UTC format
// function dateStandardiser(date,siteID) {
//   return moment(date, momentDateFormat(siteID)).format();
// }

// console.log(dateStandardiser("February 16, 2019 10:32 pm", 0));

// dateStandardiser("February 16, 2019 10:32 pm",0);

// Archive.updateMany({ siteID: 5 }, { $set: { date: }})

// request.get("https://gisbarbados.gov.bb/top-stories/", function (error, response, body) {
//   let siteName = "Government Info Service";
//   if (error) {
//     console.log(`Error scraping ${siteName}: ${error}`);
//   } else {
//     let $ = cheerio.load(body);
//     //Generate siteData object from scraped data
//     $(".et_pb_post").each(function (index, element) {
//       console.log(index);
//       // //Limit news articles to first 12 only
//       if (index > 11) {
//         return;
//       }
//       let siteData = {
//         link: $(this).find(".entry-title a").attr("href")
//         // headline: $(this).find(".entry-title").text(),
//         // date: $(this).find(".post-meta .published").text(),
//         // summary: $(this).find(".post-content p").text(),
//         // imgURL: $(this).find("img").attr("src"),
//       }
//       console.log(siteData);
//     });
//   }
// });

// request.get(`https://free.currconv.com/api/v7/convert?q=GBP_BBD,CAD_BBD&compact=ultra&apiKey=${process.env.CURRENCY_API_KEY}`, function (error, response, body) {
//   if (error) {
//     console.log(`Error getting currency data: ${error}`);
//   } else {
//     Data.findOneAndUpdate({}, {
//       gbp: JSON.parse(body).GBP_BBD,
//       cad: JSON.parse(body).CAD_BBD
//     }, function(err, data){
//       if (err){
//         console.log(`Error adding currency data to page: ${err}`)
//       }
//     });
//   }
// });

// const gasoptions = {
//   method: "GET",
//   url: "https://api.collectapi.com/gasPrice/otherCountriesGasoline",
//   headers: {
//     "content-type": "application/json",
//     authorization: `apikey ${process.env.FUEL_API_KEY}`
//   }
// }

// const dieseloptions = {
//   method: "GET",
//   url: "https://api.collectapi.com/gasPrice/otherCountriesDiesel",
//   headers: {
//     "content-type": "application/json",
//     authorization: `apikey ${process.env.FUEL_API_KEY}`
//   }
// }

// request.get(gasoptions, function (error, response, body) {
//   if (error) {
//     console.log(`Error getting currency data: ${error}`);
//   } else {
//     let arr = JSON.parse(body).results;
//     arr.forEach(element => {
//       if (element.country === "Barbados"){
//         Data.findOneAndUpdate({}, {
//           gasPrice: element.price
//         }, function(err, data){
//           if (err){
//             console.log(`Error adding gas price to DB: ${err}`);
//           }
//         })
//       }
//     });
//   }
// });

// request.get(dieseloptions, function (error, response, body) {
//   if (error) {
//     console.log(`Error getting currency data: ${error}`);
//   } else {
//     let arr = JSON.parse(body).results;
//     arr.forEach(element => {
//       if (element.country === "Barbados") {
//         Data.findOneAndUpdate({}, {
//           dieselPrice: element.price
//         }, function (err, data) {
//           if (err) {
//             console.log(`Error adding diesel price to DB: ${err}`);
//           }
//         })
//       }
//     });
//   }
// });

// Scrape GIS
// request.get("https://gisbarbados.gov.bb/top-stories/", function (error, response, body) {
//   let siteName = "Government Info Service";
//   if (error) {
//     console.log(`Error scraping ${siteName}: ${error}`);
//   } else {
//     let $ = cheerio.load(body);

//     console.log(body);

//     //Generate siteData object from scraped data
//     $(".et_pb_post").each(function (index, element) {
//       // console.log(index);
//       // //Limit news articles to first 12 only
//       // if (index > 11) {
//       //   return;
//       // }
//       let siteData = {
//         link: $(this).find(".entry-title a").attr("href"),
//         headline: $(this).find(".entry-title").text(),
//         date: $(this).find(".post-meta .published").text(),
//         summary: $(this).find(".post-content p").text(),
//         imgURL: $(this).find("img").attr("src"),
//       }
//       console.log(siteData);
//     });
//   }
// });

// function articleCounter(queryResult){
//   let count = 0;
//   // Iterate through artidcles query array
//   queryResult.forEach(document => {
//     // Iterate through articles in the data array
//     document.data.forEach(function(){
//       // Increment count variable for each article in data array
//       count++;
//     })
//   });
//   return count;
// }

// function articleCounter(queryResult) {
//   let count;
//   for(var i = 0; i < queryResult.length; i++){
//     console.log(i);
//   }
// }

// Archive.aggregate([

//   // Filter search results based on  start date and end date given by the user
//   { $match: { "siteID": 1, "created_at": { "$gte": new Date(dateStandardiser("2019-09-17")), "$lte": new Date(dateStandardiser("2019-09-20")) } } },
//   // Split pipeline using $facet Operator
//   {
//     $facet: {
//       // First Pipeline generates a count of the articles that match the $match query --> added to an array
//       totalArticleCount: [
//         { $count: "value" }
//       ],
//       // Second pipeline added to the pipelineResults array
//       pipelineResults: [
//         // // Group articles according to created date; note that date has been formated to the YYYYMMDD format
//         { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, data: { $push: "$$ROOT" }, articlesPerDay: { $sum: 1 } } },
//         // Sort articles according to date in ascending order
//         { $sort: { _id: 1 } }
//       ]
//     }
//   },
//   // unwind (transform) generated arrays from both pipelines into documents in desired format
//   {
//     $unwind: "$pipelineResults"
//   },
//   {
//     $unwind: "$totalArticleCount"
//   },
//   {
//     // Replace root document with the merging of both unwound(transformed) pipelines
//     $replaceRoot:{
//       newRoot:{
//         $mergeObjects: ["$pipelineResults", { totalCount: "$totalArticleCount.value" }]
//       }
//     }
//   }
// ], function (error, articles) {
//   if (error) {
//     console.log(error)
//   } else {
//     console.log("One")
//   }
// }
// )

// Archive.aggregate([

//   // Filter search results based on siteID,  start date and end date given by the user
//   { $match: { "siteID": 1, "created_at": { "$gte": new Date(dateStandardiser("2019-09-17")), "$lte": new Date(dateStandardiser("2019-09-20")) } } },
//   // Group articles according to created date; note that date has been formated to the YYYYMMDD format
//   { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, data: { $push: "$$ROOT" } } },
//   { $addFields: { articleCount: { $size: "$data" } } },
//   // Sort articles according to date in ascending order
//   { $sort: { _id: 1 } }
// ], function (error, articles) {
//   if (error) {
//     console.log(error)
//   } else {
//     console.log("two");
//   }
// }
// )
