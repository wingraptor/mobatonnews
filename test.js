const weather = require("weather-js"),
  weatherAPI = require("weather-js"),
  mongoose = require("mongoose"),
  moment = require("moment"),
  Archive = require("./models/archive.js"),
  Article = require("./models/scrapedData.js"),
  Weather = require("./models/weatherData"),
  request = require("request"),
  cheerio = require("cheerio"),
  Data = require("./models/dataFeed.js");

//Environment variable setup
require("dotenv").config();
const databaseUrl =
  process.env.DATABASE_URL || "mongodb://localhost:27017/scrapedData";

//mongoose config
mongoose.connect(databaseUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: true
});

// weather.find({ search: 'Bridgetown, Barbados', degreeType: 'C' }, function (err, result) {
//   if (err) console.log(err);
//   // Weather.replaceOne({}, {
//   //   temperature: result[0].current.temperature,
//   //   skytext: result[0].current.skytext,
//   //   imageUrl: result[0].current.imageUrl,
//   //   windspeed: result[0].current.windspeed
//   // },
//     // { upsert: true });

//   console.log(result[0].current);
// });

// Weather.find({ }, function(error, data){
//   console.log(data);
// })

// // BBTODAY
// console.log(moment("February 16, 2019 10:32 pm", "LLL").format("LL"));

// //Nation
// console.log(moment("17 February 2019", "D MMMM YYYY").format("LL"));

// // Loop News and BB Intl Business Assoc and BB ICT and GIS, CBC and Broadstreet journal
// console.log(moment("February 15, 2019", "LL").format("LL"));

// //Advocate
// console.log(moment("Sun, 02/17/2019 - 1:47am", "ddd, MM/DD/YYYY - H:mma").format("LL"));

// //BB reporter
// console.log(moment("February 15th, 2019", "MMMM Do, YYYY").format("LL"));

// // Broad Street Journal
// console.log(moment("Jan 16, 2020", ""))

// // Nation News

/*****************************************************************************
Functions associated with datastring, date object and associated DB queries
******************************************************************************/

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

// Convert datestring to UTC format
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
    if (date) {
      return moment(date, momentDateFormat(siteID)).format("LL");
    } else {
      return "";
    }
  }
};

// console.log(dateStandardiser.utcDate("Sun, 03/08/2020 - 7:47am", 3))

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

let articleCount = 0,
  location = "America/Barbados",
  scrapeHours = "5-21",
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

// Scrape Barbados Today
request.get("https://barbadostoday.bb/category/local-news/", function(
  error,
  response,
  body
) {
  let siteName = "Barbados Today";
  if (error) {
    console.log(`Error scraping ${siteName}: ${error}`);
  } else {
    let $ = cheerio.load(body);

    //Generate siteData object from scraped data
    //Iterate through each local news element on page
    $(".post").each(function(index, element) {
      let siteData = {};
      // First element on page has different structure to other elements
      if (index !== 0) {
        //Add scraped data to articles document
        siteData = {
          link: $(this)
            .find(".post-thumbnail a")
            .attr("href"),
          headline: $(this)
            .find(".title_caption_wrap .post-header .post-title a")
            .text(),
          summary: $(this)
            .find(".title_caption_wrap")
            .contents()
            .last()
            .text(),
        };
        // imgURLs are not consistent on page, below checks to see how image is stored on page and records appropriate src
        if (
          $(this)
            .find(".post-thumbnail a img")
            .attr("src")
        ) {
          siteData.imgURL = $(this)
            .find(".post-thumbnail a img")
            .attr("src");
        } else if (
          $(this)
            .find(".post-thumbnail a img")
            .attr("srcset")
        ) {
          siteData.imgURL = $(this)
            .find(".post-thumbnail a img")
            .attr("srcset")
            .split(" ")[0];
        }
      }
      console.log(siteData)
    });
  }
});

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
