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
  useCreateIndex: true
});

// Import Helper Functions
const dateStandardiser = require("./helpers/dateStandardiser");

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

// Adds Scraped Data to Database
function addSiteData(siteData, siteName) {
  Article.create(siteData, function(error) {
    if (error) {
      console.log(
        `Error adding ${siteName} data to articles database: ${error}`
      );
    }
    // Add site data to the archive DB
    archiver(siteData, siteName);
  });
}


let options = {
  uri: "",
  transform: function(body) {
    return cheerio.load(body)
  }
};

const scrapedData = async (options) => {

}

//Adds data to archive collection
function archiver(siteData, siteName) {
  Archive.findOne(
    { headline: siteData.headline, siteID: siteData.siteID },
    function(error, document) {
      if (error) {
        console.log(
          `Error finding ${siteName} in Archives collection: ${error}`
        );
      } else {
        // Add site data to Archive if not already in archive
        if (!document) {
          // Indicate that aritcle is new (newly scraped)
          Article.findOneAndUpdate(
            { headline: siteData.headline, siteID: siteData.siteID },
            { newArticle: true },
            function(error, article) {
              if (error) {
                console.log(
                  `Error updating newArticle field in document:::: ${error}`
                );
              }
            }
          );
          // Check to see if article has a date value
          if (siteData.date) {
            // Ensures that the utcDate saved corresponds to the same day as the current day in Barbados (UTC is 5hrs ahead of barbados time)
            // 19 corresponds to 7 local time, which is 12 am UTC
            if (new Date().getHours() >= 19) {
              // Convert date value to utcDate object
              siteData.utcDate = dateStandardiser.utcDate(
                siteData.date,
                siteData.siteID,
                true
              );
            } else {
              // Convert date value to utcDate object
              siteData.utcDate = dateStandardiser.utcDate(
                siteData.date,
                siteData.siteID,
                false
              );
            }
            // Convert date value to utcDate object
            Archive.create(siteData, function(error) {
              if (error) {
                console.log(`Error adding ${siteName} data to archive`);
              }
            });
            // For articles without dates, just use current date (the date article was created) as the utcDate field
          } else {
            // Ensures that the utcDate saved corresponds to the same day as the current day in Barbados (UTC is 5hrs ahead of barbados time)
            // 19 corresponds to 7 local time, which is 12 am UTC
            if (new Date().getHours() >= 19) {
              // Convert date value to utcDate object
              siteData.utcDate = new Date(new Date().setHours(19));
            } else {
              // Convert date value to utcDate object
              siteData.utcDate = new Date();
            }
            Archive.create(siteData, function(error) {
              if (error) {
                console.log(`Error adding ${siteName} data to archive`);
              }
            });
          }
        } else {
          return;
        }
      }
    }
  );
}

// Schedule Barbados Today to be scrapped every hour on minute 0
new CronJob(
  `0 0 ${scrapeHours} * * *`,
  function() {
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
        //Clear Article collection
        Article.deleteMany({ siteID: siteID(siteName) }, function(error) {
          if (error) {
            console.log(`Error deleting ${siteName} data`);
          }
        });
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
              siteID: siteID(siteName),
              articleCount: articleCount
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
            addSiteData(siteData, siteName);
            articleCount++;
          }
        });
      }
    });
  },
  null,
  "start",
  location
);

// Schedule NationNews to be scrapped every hour on minute 2
new CronJob(
  `0 2 ${scrapeHours} * * *`,
  function() {
    //Scrape NationNews
    request.get(
      {
        // deflate response from server using gzip --> https://stackoverflow.com/questions/8880741/node-js-easy-http-requests-with-gzip-deflate-compression
        gzip: true,
        uri: "http://www.nationnews.com/type/news"
      },
      function(error, response, body) {
        let siteName = "Nation News";
        if (error) {
          console.log(`Error scraping ${siteName}: ${error}`);
        } else {
          let $ = cheerio.load(body);
          //Clear Article collection
          Article.deleteMany({ siteID: siteID(siteName) }, function(error) {
            if (error) {
              console.log(`Error deleting ${siteName} data`);
            }
          });
          //Generate siteData object from scraped data
          //Iterate through news
          $(".latest_block").each(function(index, element) {
            let summary = $(this)
              .find(".latest_content p")
              .text();
            //Add scraped data to articles document
            if (
              $(this)
                .find(".latest_content h3 a")
                .text() !== ""
            ) {
              let siteData = {
                link:
                  "http://www.nationnews.com" +
                  $(this)
                    .find(".latest_content h3 a")
                    .attr("href"),
                headline: $(this)
                  .find(".latest_content h3 a")
                  .text(),
                date: $(this)
                  .find(".latest_content span")
                  .text(),
                //Remove spaces and new line character before, after and within summary text
                summary: $(this)
                  .find(".latest_content p")
                  .text()
                  .substring(21, summary.length - 20)
                  .replace(/\n/g, ""),
                siteID: siteID(siteName),
                imgURL:
                  "https://www.nationnews.com" +
                  $(this)
                    .find("img")
                    .attr("src"),
                articleCount: articleCount
              };
              addSiteData(siteData, siteName);
              articleCount++;
            }
          });
        }
      }
    );
  },
  null,
  "start",
  location
);

// Schedule LoopNews to be scrapped every hour on minute 4
new CronJob(
  `0 4 ${scrapeHours} * * *`,
  function() {
    // Scrape LoopNews
    request.get(
      "http://www.loopnewsbarbados.com/category/loopnewsbarbados-barbados-news",
      function(error, response, body) {
        let siteName = "Loop News";
        if (error) {
          console.log(`Error scraping ${siteName}: ${error}`);
        } else {
          let $ = cheerio.load(body);
          //Clear Article collection
          Article.deleteMany({ siteID: siteID(siteName) }, function(error) {
            if (error) {
              console.log(`Error deleting ${siteName} data`);
            }
          });
          //Generate siteData object from scraped data
          ///Iterate through news sections on page
          $(".col-half.common-aspect-ratios").each(function(index, element) {
            //Add object elements to loopnews array where each object contains the following properties:- link to article, headline, date and article summary
            let siteData = {
              //add root URL to relative link scraped from page
              link:
                "http://www.loopnewsbarbados.com" +
                $(this)
                  .find("a")
                  .attr("href"),
              //Replace newlines and spaces with a '' from beginning and ending of string
              headline: $(this)
                .find(".title-5 a")
                .text()
                .replace(/^\s+|\s+$/g, ""),
              //Replace newlines and spaces with a '' from beginning, within and ending of string
              summary: $(this)
                .find("p")
                .text()
                .replace(/^\s+|\s+$|\n/g, " "),
              date: $(this)
                .find(".date span")
                .text(),
              siteID: siteID(siteName),
              imgURL: $(this)
                .find("img")
                .attr("src"),
              articleCount: articleCount
            };
            addSiteData(siteData, siteName);
            articleCount++;
          });
        }
      }
    );
  },
  null,
  "start",
  location
);

// Schedule Advocate1 to be scrapped every hour on minute 6
new CronJob(
  `0 6 ${scrapeHours} * * *`,
  function() {
    // Scrape Advocate Page 1
    request.get("https://www.barbadosadvocate.com/news", function(
      error,
      response,
      body
    ) {
      let siteName = "Barbados Advocate";
      if (error) {
        console.log(`Error scraping ${siteName}: ${error}`);
      } else {
        let $ = cheerio.load(body);
        //Clear Article collection
        Article.deleteMany({ siteID: siteID(siteName) }, function(error) {
          if (error) {
            console.log(`Error deleting ${siteName} data`);
          }
        });
        //Generate siteData object from scraped data
        $(".node-article").each(function(index, element) {
          let siteData = {
            link:
              "https://www.barbadosadvocate.com" +
              $(this)
                .find(".title a")
                .attr("href"),
            headline: $(this)
              .find(".title a")
              .text(),
            date: $(this)
              .find(".date span")
              .text(),
            summary:
              $(this)
                .find(".field-item p")
                .text() + "...",
            siteID: siteID(siteName),
            imgURL: $(this)
              .find("img")
              .attr("src"),
            articleCount: articleCount
          };
          addSiteData(siteData, siteName);
          articleCount++;
        });
      }
    });
  },
  null,
  "start",
  location
);

// Schedule Advocate2 to be scrapped every hour on minute 8
new CronJob(
  `0 8 ${scrapeHours} * * *`,
  function() {
    // Scrape Advocate Page 2
    request.get("https://www.barbadosadvocate.com/news?page=1", function(
      error,
      response,
      body
    ) {
      let siteName = "Barbados Advocate";
      if (error) {
        console.log(`Error scraping ${siteName}: ${error}`);
      } else {
        let $ = cheerio.load(body);
        //Do not Clear Advocate2 Article collection because all advocate information is cleared
        // Article.deleteMany({ siteID: siteID(siteName) }, function (error) {
        //   if (error) {
        //     console.log(`Error deleting ${siteName} data`);
        //   }
        // });
        //Generate siteData object from scraped data
        $(".node-article").each(function(index, element) {
          let siteData = {
            link:
              "https://www.barbadosadvocate.com" +
              $(this)
                .find(".title a")
                .attr("href"),
            headline: $(this)
              .find(".title a")
              .text(),
            date: $(this)
              .find(".date span")
              .text(),
            summary:
              $(this)
                .find(".field-item p")
                .text() + "...",
            siteID: siteID(siteName),
            imgURL: $(this)
              .find("img")
              .attr("src"),
            articleCount: articleCount
          };
          addSiteData(siteData, siteName);
          articleCount++;
        });
      }
    });
  },
  null,
  "start",
  location
);

// Schedule BIBA to be scrapped every hour on minute 10
new CronJob(
  `0 10 ${scrapeHours} * * *`,
  function() {
    // Scrape BIBA
    request.get("http://biba.bb/category/news/local-news/", function(
      error,
      response,
      body
    ) {
      let siteName = "Barbados Intl Business Assoc";
      if (error) {
        console.log(`Error scraping ${siteName}: ${error}`);
      } else {
        let $ = cheerio.load(body);
        //Clear Article collection
        Article.deleteMany({ siteID: siteID(siteName) }, function(error) {
          if (error) {
            console.log(`Error deleting ${siteName} data`);
          }
        });
        //Generate siteData object from scraped data
        $(".jeg_post").each(function(index, element) {
          let siteData = {
            link: $(this)
              .find(".jeg_thumb a")
              .attr("href"),
            headline: $(this)
              .find(".jeg_post_title a")
              .text(),
            date: $(this)
              .find(".jeg_meta_date a")
              .text(),
            siteID: siteID(siteName),
            articleCount: articleCount
          };
          addSiteData(siteData, siteName);
          articleCount++;
        });
      }
    });
  },
  null,
  "start",
  location
);

// Schedule BBICT to be scrapped every hour on minute 12
new CronJob(
  `0 12 ${scrapeHours} * * *`,
  function() {
    // Scrape Barbados ICT
    request.get("http://barbadosict.org/news/", function(
      error,
      response,
      body
    ) {
      let siteName = "Barbados ICT";
      if (error) {
        console.log(`Error scraping ${siteName}: ${error}`);
      } else {
        let $ = cheerio.load(body);
        //Clear Article collection
        Article.deleteMany({ siteID: siteID(siteName) }, function(error) {
          if (error) {
            console.log(`Error deleting ${siteName} data`);
          }
        });
        //Generate siteData object from scraped data
        $(".post-list-styles").each(function(index, element) {
          let siteData = {
            link: $(this)
              .find(".image a")
              .attr("href"),
            headline: $(this)
              .find(".title a")
              .text(),
            date: $(this)
              .find(".date")
              .text(),
            siteID: siteID(siteName),
            imgURL: $(this)
              .find("img")
              .attr("src"),
            articleCount: articleCount
          };
          addSiteData(siteData, siteName);
          articleCount++;
        });
      }
    });
  },
  null,
  "start",
  location
);

// Schedule Business Barbados to be scrapped every hour on minute 14
new CronJob(
  `0 14 ${scrapeHours} * * *`,
  function() {
    // Scrape Business Barbados
    request.get("http://businessbarbados.com/", function(
      error,
      response,
      body
    ) {
      let siteName = "Business Barbados";
      if (error) {
        console.log(`Error scraping ${siteName}: ${error}`);
      } else {
        let $ = cheerio.load(body);
        //Clear Article collection
        Article.deleteMany({ siteID: siteID(siteName) }, function(error) {
          if (error) {
            console.log(`Error deleting ${siteName} data`);
          }
        });
        //Generate siteData object from scraped data
        $(".news-item").each(function(index, element) {
          let siteData = {
            link: $(this)
              .find("a")
              .attr("href"),
            headline: $(this)
              .find("a")
              .text(),
            siteID: siteID(siteName),
            articleCount: articleCount
          };
          addSiteData(siteData, siteName);
          articleCount++;
        });
      }
    });
  },
  null,
  "start",
  location
);

/**************************************************************************
 * GIS uses anti-scraping software and therefore I am unable to scrape it
 **************************************************************************/

// Schedule GIS to be scrapped every hour on minute 16
// new CronJob(`0 16 ${scrapeHours} * * *`, function () {
//   // Scrape GIS
//   request.get("https://gisbarbados.gov.bb/top-stories/", function (error, response, body) {
//     let siteName = "Government Info Service";
//     if (error) {
//       console.log(`Error scraping ${siteName}: ${error}`);
//     } else {
//       let $ = cheerio.load(body);
//       // Clear Article collection
//       Article.deleteMany({ siteID: siteID(siteName) }, function (error) {
//         if (error) {
//           console.log(`Error deleting ${siteName} data`);
//         }
//       });

//       //Generate siteData object from scraped data
//       $(".et_pb_post").each(function (index, element) {
//         console.log(index);
//         // //Limit news articles to first 12 only
//         // if (index > 11) {
//         //   return;
//         // }
//         let siteData = {
//           link: $(this).find(".entry-title a").attr("href"),
//           headline: $(this).find(".entry-title").text(),
//           date: $(this).find(".post-meta .published").text(),
//           summary: $(this).find(".post-content p").text(),
//           siteID: siteID(siteName),
//           imgURL: $(this).find("img").attr("src"),
//           articleCount: articleCount
//         }
//         addSiteData(siteData, siteName);
//         articleCount++;
//       });
//     }
//   });
// }, null, "start", location);

// Schedule CBC News to be scrapped every hour on minute 18, second 0 between 5am and 8pm inclusive
new CronJob(
  `0 18 ${scrapeHours} * * *`,
  function() {
    // Scrape CBC
    request.get("https://www.cbc.bb/category/barbados-news/", function(
      error,
      response,
      body
    ) {
      let siteName = "CBC News";
      if (error) {
        console.log(`Error scraping ${siteName}: ${error}`);
      } else {
        let $ = cheerio.load(body);
        // Clear Article collection
        Article.deleteMany({ siteID: siteID(siteName) }, function(error) {
          if (error) {
            console.log(`Error deleting ${siteName} data`);
          }
        });
        //Generate siteData object from scraped data
        $(".post").each(function(index, element) {
          //Limit news articles to first 16 only
          let siteData = {
            link: $(this)
              .find(".archive-desc-wrapper .entry-title a")
              .attr("href"),
            headline: $(this)
              .find(".archive-desc-wrapper .entry-title a")
              .text(),
            date: $(this)
              .find(
                ".archive-desc-wrapper .entry-footer .entry-meta .posted-on a .entry-date"
              )
              .text(),
            summary: $(this)
              .find(".archive-desc-wrapper .entry-content p")
              .text(),
            imgURL: $(this)
              .find(".post-image a figure img")
              .attr("src"),
            siteID: siteID(siteName),
            articleCount: articleCount
          };
          addSiteData(siteData, siteName);
          articleCount++;
        });
      }
    });
  },
  null,
  "start",
  location
);

// Schedule CBC News to be scrapped every hour on minute 20, second 0 between 5am and 8pm inclusive
// new CronJob(
//   `0 20 ${scrapeHours} * * *`,
//   function() {
//     // Scrape CBC
//     request.get(
//       "https://www.cbc.bb/index.php/news/barbados-news?start=6",
//       function(error, response, body) {
//         let siteName = "CBC News";
//         if (error) {
//           console.log(`Error scraping ${siteName}: ${error}`);
//         } else {
//           let $ = cheerio.load(body);
//           // Do not clear Article collection because it contains info about for page 1 of CBC news
//           // Article.deleteMany({ siteID: siteID(siteName) }, function (error) {
//           //   if (error) {
//           //     console.log(`Error deleting ${siteName} data`);
//           //   }
//           // });
//           //Generate siteData object from scraped data
//           $(".catItemView").each(function(index, element) {
//             //Limit news articles to first 16 only
//             let siteData = {
//               link:
//                 "https://www.cbc.bb" +
//                 $(this)
//                   .find(".catItemHeader a")
//                   .attr("href"),
//               headline: $(this)
//                 .find(".catItemHeader a")
//                 .text()
//                 .replace(/^\s+|\s+$/g, ""),
//               date: $(this)
//                 .find(".itemDate  span")
//                 .text(),
//               summary: $(this)
//                 .find(".catItemIntroText")
//                 .text()
//                 .replace(/^\s+|\s+$/g, "")
//                 .replace("Twitter", ""),
//               imgURL:
//                 "https://www.cbc.bb/" +
//                 $(this)
//                   .find("img")
//                   .attr("src"),
//               siteID: siteID(siteName)
//             };
//             addSiteData(siteData, siteName);
//           });
//         }
//       }
//     );
//   },
//   null,
//   "start",
//   location
// );

// Schedule Barbados Reporter to be scrapped every hour on minute 18
new CronJob(
  `0 22 ${scrapeHours} * * *`,
  function() {
    // Scrape Barbados Reporter
    request.get("https://www.bajanreporter.com/category/new/", function(
      error,
      response,
      body
    ) {
      let siteName = "Barbados Reporter";
      if (error) {
        console.log(`Error scraping ${siteName}: ${error}`);
      } else {
        let $ = cheerio.load(body);
        // Clear Article collection
        Article.deleteMany({ siteID: siteID(siteName) }, function(error) {
          if (error) {
            console.log(`Error deleting ${siteName} data`);
          }
        });
        //Generate siteData object from scraped data
        $(".post").each(function(index, element) {
          //Limit news articles to first 16 only
          if (index > 15) {
            return;
          }
          //Limit news articles to first 16 only
          let siteData = {
            link: $(this)
              .find("h2 a")
              .attr("href"),
            headline: $(this)
              .find("h2 a")
              .text(),
            date: $(this)
              .find(".byline .post-date")
              .text(),
            // to only select text of summary and not text in <noscript> element - https://stackoverflow.com/questions/3442394/using-text-to-retrieve-only-text-not-nested-in-child-tags
            summary: $(this)
              .find(".article-summary")
              .clone()
              .children()
              .remove()
              .end(".article-summary")
              .text()
              .replace(/^\s+|\s+$/g, ""),
            siteID: siteID(siteName),
            // Image scraped is just a generic Stop, this image is hotlinked image
            // imgURL: $(this).find("img").attr("data-lazy-src"),
            articleCount: articleCount
          };
          addSiteData(siteData, siteName);
          articleCount++;
        });
      }
    });
  },
  null,
  "start",
  location
);

// Schedule The Broad Street Journal to be scrapped every hour on minute 24
new CronJob(
  `0 24 ${scrapeHours} * * *`,
  function() {
    // Scrape The Broad Street Journal
    request.get("https://www.broadstjournal.com/categories/marketing", function(
      error,
      response,
      body
    ) {
      let siteName = "The Broad Street Journal";
      if (error) {
        console.log(`Error scraping ${siteName}: ${error}`);
      } else {
        let $ = cheerio.load(body);
        // Clear Article collection
        Article.deleteMany({ siteID: siteID(siteName) }, function(error) {
          if (error) {
            console.log(`Error deleting ${siteName} data`);
          }
        });
        //Generate siteData object from scraped data
        $(".post-v3-card").each(function(index, element) {
          let siteData = {
            link:
              "https://www.broadstjournal.com" +
              $(this)
                .find(".post-v3-thumbnail")
                .attr("href"),
            headline: $(this)
              .find(".post-v3-content h3")
              .text(),
            date: $(this)
              .find(".post-v3-content .post-info .post-info-block div")
              .text()
              .replace(" min read", ""),
            summary: $(this)
              .find(".post-v3-content .post-summary")
              .text(),
            siteID: siteID(siteName),
            articleCount: articleCount
          };
          addSiteData(siteData, siteName);
          articleCount++;
        });
      }
    });
  },
  null,
  "start",
  location
);

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
  function() {
    const gasoptions = {
      method: "GET",
      url: "https://api.collectapi.com/gasPrice/otherCountriesGasoline",
      headers: {
        "content-type": "application/json",
        authorization: `apikey ${process.env.FUEL_API_KEY}`
      }
    };

    const dieseloptions = {
      method: "GET",
      url: "https://api.collectapi.com/gasPrice/otherCountriesDiesel",
      headers: {
        "content-type": "application/json",
        authorization: `apikey ${process.env.FUEL_API_KEY}`
      }
    };

    // Get Gasoline Prices
    request.get(gasoptions, function(error, response, body) {
      if (error) {
        console.log(`Error getting currency data: ${error}`);
      } else {
        let arr = JSON.parse(body).results;
        arr.forEach(element => {
          if (element.country === "Barbados") {
            Data.findOneAndUpdate(
              {},
              {
                gasPrice: element.price
              },
              function(err, data) {
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
    request.get(dieseloptions, function(error, response, body) {
      if (error) {
        console.log(`Error getting currency data: ${error}`);
      } else {
        let arr = JSON.parse(body).results;
        arr.forEach(element => {
          if (element.country === "Barbados") {
            Data.findOneAndUpdate(
              {},
              {
                dieselPrice: element.price
              },
              function(err, data) {
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
