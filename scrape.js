const mongoose = require("mongoose"),
  Article = require("./models/scrapedData.js"),
  request = require("request"),
  cheerio = require("cheerio"),
  CronJob = require("cron").CronJob,
  Archive = require("./models/archive.js");

// const bbToday = [],
//       nationNews = [],
//       loopNews = [],
//       advocate = [],
//       advocate2 = [],
//       biba = [],
//       bbict = [],
//       businessbb = [],
//       GIS = [];


//Environment variable setup
require("dotenv").config();
const databaseUrl = process.env.DATABASE_URL || "mongodb://localhost:27017/scrapedData";

//mongoose config
mongoose.connect(databaseUrl,
  { useNewUrlParser: true });


let articleCount = 0;

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
  }
  return siteID;
}

// Adds Scraped Data to Database
function addSiteData(siteData, siteName) {
  Article.create(siteData, function (error) {
    if (error) {
      console.log(`Error adding ${siteName} data to articles database: ${error}`);
    }
    // Add site data to the archive DB
    archiver(siteData, siteName);
  });
}

//Adds data to archive collection
function archiver(siteData, siteName) {
  Archive.findOne({ headline: siteData.headline }, function (error, document) {
    if (error) {
      console.log(`Error finding ${siteName} in Articles collection: ${error}`)
    } else {
      // Add site data to Archive if not already in archive
      if (!document) {
        Archive.create({
          link: siteData.link,
          headline: siteData.headline,
          siteID: siteData.siteID,
          date: siteData.date
        }, function (error) {
          if (error) {
            console.log(`Error adding ${siteName} data to archive`);
          }
        });
      } else {
        return;
      }
    }
  });
}


// Schedule Barbados Today to be scrapped every hour on minute 0, second 0 between 5am and 9pm inclusive
new CronJob("0 0 5-21 * * *", function () {
  // Scrape Barbados Today
  request.get("https://barbadostoday.bb/", function (error, response, body) {
    let siteName = "Barbados Today";
    if (error) {
      console.log(`Error scraping ${siteName}: ${error}`);
    } else {
      let $ = cheerio.load(body);
      //Clear Article collection
      Article.deleteMany({ siteID: siteID(siteName) }, function (error) {
        if (error) {
          console.log(`Error deleting ${siteName} data`);
        }
      });
      //Generate siteData object from scraped data
      //Iterate through each local news element on page
      $('#category-posts-10-internal .cat-post-item a').each(function (index, element) {
        //Add scraped data to articles document
        let siteData = {
          link: $(this).attr("href"),
          headline: $(this).find(".cat-post-title").text(),
          date: $(this).find(".cat-post-date").text(),
          summary: $(this).find("p").text(),
          siteID: siteID(siteName),
          articleCount: articleCount
        }
        addSiteData(siteData, siteName);
        articleCount++;
      });
    }
  });
}, null, "start", "America/Barbados");

// Schedule NationNews to be scrapped every hour on minute 2, second 0 between 5am and 9pm inclusive
new CronJob("0 2 5-21 * * *", function () {
  //Scrape NationNews
  request.get("http://www.nationnews.com/type/news", function (error, response, body) {
    let siteName = "Nation News"
    if (error) {
      console.log(`Error scraping ${siteName}: ${error}`);
    } else {
      let $ = cheerio.load(body);
      //Clear Article collection
      Article.deleteMany({ siteID: siteID(siteName) }, function (error) {
        if (error) {
          console.log(`Error deleting ${siteName} data`);
        }
      });
      //Generate siteData object from scraped data
      //Iterate through news
      $(".latest_block").each(function (index, element) {
        let summary = $(this).find(".latest_content p").text();
        //Add scraped data to articles document
        let siteData = {
          link: "http://www.nationnews.com" + $(this).find(".latest_content h3 a").attr("href"),
          headline: $(this).find(".latest_content h3 a").text(),
          date: $(this).find(".latest_content span").text(),
          //Remove spaces and new line character before, after and within summary text
          summary: $(this).find(".latest_content p").text().substring(21, summary.length - 20).replace(/\n/g, ''),
          siteID: siteID(siteName),
          articleCount: articleCount
        }
        addSiteData(siteData, siteName);
        articleCount++;       
      });
    }
  })
}, null, "start", "America/Barbados");

// Schedule LoopNews to be scrapped every hour on minute 4, second 0 between 5am and 9pm inclusive
new CronJob("0 4 5-21 * * *", function () {
  //Scrape LoopNews
  request.get("http://www.loopnewsbarbados.com/category/loopnewsbarbados-barbados-news", function (error, response, body) {
    let siteName = "Loop News";
    if (error) {
      console.log(`Error scraping ${siteName}: ${error}`);
    } else {
      let $ = cheerio.load(body);
      //Clear Article collection
      Article.deleteMany({ siteID: siteID(siteName) }, function (error) {
        if (error) {
          console.log(`Error deleting ${siteName} data`);
        }
      });
      //Generate siteData object from scraped data
      ///Iterate through news sections on page
      $(".col-half.common-aspect-ratios").each(function (index, element) {
        //Add object elements to loopnews array where each object contains the following properties:- link to article, headline, date and article summary
        let siteData = {
          //add root URL to relative link scraped from page
          link: "http://www.loopnewsbarbados.com" + $(this).find("a").attr("href"),
          //Replace newlines and spaces with a '' from beginning and ending of string
          headline: $(this).find(".title-5 a").text().replace(/^\s+|\s+$/g, ''),
          //Replace newlines and spaces with a '' from beginning, within and ending of string
          summary: $(this).find("p").text().replace(/^\s+|\s+$|\n/g, ' '),
          date: $(this).find(".date span").text(),
          articleCount: articleCount
        }
        addSiteData(siteData, siteName);
        articleCount++;
      });
    }
  });
}, null, "start", "America/Barbados");

// Schedule Advocate1 to be scrapped every hour on minute 6, second 0 between 5am and 9pm inclusive
new CronJob("0 6 5-21 * * *", function () {
  // Scrape Advocate Page 1
  request.get("https://www.barbadosadvocate.com/news", function (error, response, body) {
    let siteName = "Barbados Advocate";
    if (error) {
      console.log(`Error scraping ${siteName}: ${error}`);
    } else {
      let $ = cheerio.load(body);
      //Clear Article collection
      Article.deleteMany({ siteID: siteID(siteName) }, function (error) {
        if (error) {
          console.log(`Error deleting ${siteName} data`);
        }
      });
      //Generate siteData object from scraped data
      $(".node-article").each(function (index, element) {
        let siteData = {
          link: "https://www.barbadosadvocate.com" + $(this).find(".title a").attr("href"),
          headline: $(this).find(".title a").text(),
          date: $(this).find(".date span").text(),
          summary: $(this).find(".field-item p").text() + "...",
          articleCount: articleCount
        }
        addSiteData(siteData, siteName);
        articleCount++;      
      });
    }
  });
}, null, "start", "America/Barbados");


// Schedule Advocate2 to be scrapped every hour on minute 8, second 0 between 5am and 9pm inclusive
new CronJob("0 8 5-21 * * *", function () {
  // Scrape Advocate Page 2
  request.get("https://www.barbadosadvocate.com/news?page=1", function (error, response, body) {
    let siteName = "Barbados Advocate"
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
      $(".node-article").each(function (index, element) {
        let siteData = {
          link: "https://www.barbadosadvocate.com" + $(this).find(".title a").attr("href"),
          headline: $(this).find(".title a").text(),
          date: $(this).find(".date span").text(),
          summary: $(this).find(".field-item p").text() + "...",
          articleCount: articleCount
        }
        addSiteData(siteData, siteName);
        articleCount++; 
      });
    }
  });
}, null, "start", "America/Barbados");


// Schedule BIBA to be scrapped every hour on minute 10, second 0 between 5am and 9pm inclusive
new CronJob("0 10 5-21 * * *", function () {
  // Scrape BIBA
  request.get("http://biba.bb/category/news/local-news/", function (error, response, body) {
    let siteName = "Barbados Intl Business Assoc";
    if (error) {
      console.log(`Error scraping ${siteName}: ${error}`);
    } else {
      let $ = cheerio.load(body);
      //Clear Article collection
      Article.deleteMany({ siteID: siteID(siteName) }, function (error) {
        if (error) {
          console.log(`Error deleting ${siteName} data`);
        }
      });
      //Generate siteData object from scraped data
      $(".jeg_post").each(function (index, element) {
        let siteData = {
          link: $(this).find(".jeg_thumb a").attr("href"),
          headline: $(this).find(".jeg_post_title a").text(),
          date: $(this).find(".jeg_meta_date a").text(),
          articleCount: articleCount
        }
        addSiteData(siteData, siteName);
        articleCount++;
        
      });
    }
  });
}, null, "start", "America/Barbados");


// Schedule BBICT to be scrapped every hour on minute 12, second 0 between 5am and 9pm inclusive
new CronJob("0 12 5-21 * * *", function () {
  // Scrape Barbados ICT
  request.get("http://barbadosict.org/news/", function (error, response, body) {
    let siteName = "Barbados ICT";
    if (error) {
      console.log(`Error scraping ${siteName}: ${error}`);
    } else {
      let $ = cheerio.load(body);
      //Clear Article collection
      Article.deleteMany({ siteID: siteID(siteName) }, function (error) {
        if (error) {
          console.log(`Error deleting ${siteName} data`);
        }
      });
      //Generate siteData object from scraped data
      $(".post-list-styles").each(function (index, element) {
        let siteData = {
          link: $(this).find(".image a").attr("href"),
          headline: $(this).find(".title a").text(),
          date: $(this).find(".date").text(),
          articleCount: articleCount
        }
        addSiteData(siteData, siteName);
        articleCount++;
        
      });
    }
  });
}, null, "start", "America/Barbados");


// Schedule bbBusiness to be scrapped every hour on minute 14, second 0 between 5am and 9pm inclusive
new CronJob("0 14 5-21 * * *", function () {
  // Scrape BusinessBarbados
  request.get("http://businessbarbados.com/", function (error, response, body) {
    let siteName = "Business Barbados";
    if (error) {
      console.log(`Error scraping ${siteName}: ${error}`);
    } else {
      let $ = cheerio.load(body);
      //Clear Article collection
      Article.deleteMany({ siteID: siteID(siteName) }, function (error) {
        if (error) {
          console.log(`Error deleting ${siteName} data`);
        }
      });
      //Generate siteData object from scraped data
      $(".news-item").each(function (index, element) {
        let siteData = {
          link: $(this).find("a").attr("href"),
          headline: $(this).find("a").text(),
          articleCount: articleCount
        }
        addSiteData(siteData, siteName);
        articleCount++;
        
      });
    }
  });
}, null, "start", "America/Barbados");


// Schedule GIS to be scrapped every hour on minute 16, second 0 between 5am and 9pm inclusive
new CronJob("0 16 5-21 * * *", function () {
  // Scrape GIS
  request.get("http://gisbarbados.gov.bb/top-stories/", function (error, response, body) {
    let siteName = "Government Info Service";
    if (error) {
      console.log(`Error scraping ${siteName}: ${error}`);
    } else {
      let $ = cheerio.load(body);
      //Clear Article collection
      Article.deleteMany({ siteID: siteID(siteName) }, function (error) {
        if (error) {
          console.log(`Error deleting ${siteName} data`);
        }
      });
      //Generate siteData object from scraped data
      $(".filter-topstories").each(function (index, element) {
        //Limit news articles to first 16 only
        if (index > 15) {
          return;
        }
        let siteData = {
          link: $(this).find(".esg-bottom a").attr("href"),
          headline: $(this).find(".eg-hmpg_alt-element-0").text(),
          date: $(this).find(".eg-hmpg_alt-element-3").text(),
          articleCount: articleCount
        }
        addSiteData(siteData, siteName);
        articleCount++;
        
      });
    }
  });
}, null, "start", "America/Barbados");

// Schedule CBC News to be scrapped every hour on minute 18, second 0 between 5am and 8pm inclusive
new CronJob("0 18 5-21 * * *", function () {
  // Scrape CBC
  request.get("https://www.cbc.bb/index.php/news/barbados-news", function (error, response, body) {
    let siteName = "CBC News";
    if (error) {
      console.log(`Error scraping ${siteName}: ${error}`);
    } else {
      let $ = cheerio.load(body);
      // Clear Article collection
      Article.deleteMany({ siteID: siteID(siteName) }, function (error) {
        if (error) {
          console.log(`Error deleting ${siteName} data`);
        }
      });
      //Generate siteData object from scraped data
      $(".catItemView").each(function (index, element) {
        //Limit news articles to first 16 only
        let siteData = {
          link:"https://www.cbc.bb" + $(this).find(".catItemHeader a").attr("href"),
          headline: $(this).find(".catItemHeader a").text().replace(/^\s+|\s+$/g, ''),
          date: $(this).find(".itemDate  span").text(),
          summary: $(this).find(".catItemIntroText").text().replace(/^\s+|\s+$/g, '').replace("Twitter", ""),
          articleCount: articleCount
        }
        addSiteData(siteData, siteName);
        articleCount++;
      });
    }
  });
}, null, "start", "America/Barbados");


// Schedule CBC News to be scrapped every hour on minute 20, second 0 between 5am and 8pm inclusive
new CronJob("0 20 5-21 * * *", function () {
// Scrape CBC
  request.get("https://www.cbc.bb/index.php/news/barbados-news?start=6", function (error, response, body) {
  let siteName = "CBC News";
  if (error) {
    console.log(`Error scraping ${siteName}: ${error}`);
  } else {
    let $ = cheerio.load(body);
    // Do not clear Article collection because it contains info about for page 1 of CBC news
    // Article.deleteMany({ siteID: siteID(siteName) }, function (error) {
    //   if (error) {
    //     console.log(`Error deleting ${siteName} data`);
    //   }
    // });
    //Generate siteData object from scraped data
    $(".catItemView").each(function (index, element) {
      //Limit news articles to first 16 only
      let siteData = {
        link: "https://www.cbc.bb" + $(this).find(".catItemHeader a").attr("href"),
        headline: $(this).find(".catItemHeader a").text().replace(/^\s+|\s+$/g, ''),
        date: $(this).find(".itemDate  span").text(),
        summary: $(this).find(".catItemIntroText").text().replace(/^\s+|\s+$/g, '').replace("Twitter", ""),
        siteID: siteID(siteName)
      }
      addSiteData(siteData, siteName);
    });
  }
});
}, null, "start", "America/Barbados");


// Schedule Barbados Reporter to be scrapped every hour on minute 18, second 0 between 5am and 9pm inclusive
new CronJob("0 22 5-21 * * *", function () {
  // Scrape Barbados Reporter
  request.get("https://www.bajanreporter.com/category/new/", function (error, response, body) {
    let siteName = "Barbados Reporter";
    if (error) {
      console.log(`Error scraping ${siteName}: ${error}`);
    } else {
      let $ = cheerio.load(body);
      // Clear Article collection
      Article.deleteMany({ siteID: siteID(siteName) }, function (error) {
        if (error) {
          console.log(`Error deleting ${siteName} data`);
        }
      });
      //Generate siteData object from scraped data
      $(".post").each(function (index, element) {
        //Limit news articles to first 16 only
        if (index > 15) {
          return;
        }
        //Limit news articles to first 16 only
        let siteData = {
          link: $(this).find("h2 a").attr("href"),
          headline: $(this).find("h2 a").text(),
          date: $(this).find(".byline .post-date").text(),
          // to only select text of summary and not text in <noscript> element - https://stackoverflow.com/questions/3442394/using-text-to-retrieve-only-text-not-nested-in-child-tags
          summary: $(this).find(".article-summary").clone().children().remove().end(".article-summary").text().replace(/^\s+|\s+$/g, ''),
          articleCount: articleCount
        }
        addSiteData(siteData, siteName);
        articleCount++;
      });
    }
  });
}, null, "start", "America/Barbados");