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

// rp("https://barbadostoday.bb/category/local-news/")
// .then(htmlString =>{
//   console.log(htmlString);
// })
// .catch(err => console.log(err));


async function scrapeFunction(scrapeInfo) {
  let promises = [];
  let siteID = []
  // Iterate through scrapeInfo array to access info. needed for scraping
  for (let i = 0; i <= scrapeInfo.length - 1; i++) {
    // Allows for parsing of html document returned by request promise using cheerio
    // scrapeInfo[i].requestOptions.transform = function (body) {
    //   return cheerio.load(body);
    // };
    // Check that site is to be scraped
    if (scrapeInfo[i].toBeScraped) {
      try {
        const $ = await rp(scrapeInfo[i].requestOptions);
        promises.push($);
        siteID.push(i);
      } catch (error) {
        // Add ability to email error to myself
        console.log(chalk.bold.red(`Error code: ${error.statusCode} from ${error.options.uri}`));
      }
    }
  }
  // console.log(chalk.blue.bold(promises.length));
  // console.log(chalk.green.bold(siteID));
  // parseFunction(promises, siteID);
}

async function parseFunction(promises, siteID){
  for (let i = 0; i <= promises.length - 1; i++){
    // let $ = cheerio.load(promises[0]);
    //   $(".post").each(function (index, element) {
    //     console.log($(this).find(".post-thumbnail a").attr("href"));
    //   });
    // console.log(siteID[i]);
  }
}

scrapeFunction(scrapeInfo);

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
