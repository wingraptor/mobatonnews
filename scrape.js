const Article = require("./models/scrapedData.js"),
      mongoose = require("mongoose"),  
      request = require("request"),
      cheerio = require("cheerio"),
      CronJob  = require("cron").CronJob;

  // const bbToday = [],
  //       nationNews = [],
  //       loopNews = [],
  //       advocate = [],
  //       advocate2 = [],
  //       biba = [],
  //       bbict = [],
  //       businessbb = [],
  //       GIS = [];

//mongoose config
mongoose.connect("mongodb://localhost:27017/scrapedData",
  { useNewUrlParser: true });


// Schedule Barbados Today to be scrapped every hour on minute 0, second 0 between 5am and 8pm inclusive
new CronJob("0 0 5-20 * * *",function(){
  // Scrape Barbados Today
  request.get("https://barbadostoday.bb/", function (error, response, body) {
    if (error) {
      console.log(`Error scraping Barbados Today: ${error}`);
    } else {
      let $ = cheerio.load(body);
      //Iterate through each local news element on page
      $('#category-posts-10-internal .cat-post-item a').each(function (index, element) {
        //Add scraped data to articles document
        Article.create({
          link: $(this).attr("href"),
          headline: $(this).find(".cat-post-title").text(),
          date: $(this).find(".cat-post-date").text(),
          summary: $(this).find("p").text(),
          site: "Barbados Today"
        }, function (error) {
          if (error) {
            console.log(`Error adding Barbados Today data to articles database: ${error}`);
          }
        });
      });
    }
  });
}, null, "start", "America/Barbados");


// Schedule NationNews to be scrapped every hour on minute 2, second 0 between 5am and 8pm inclusive
new CronJob("0 2 5-20 * * *", function(){
  //Scrape NationNews
  request.get("http://www.nationnews.com/type/news", function (error, response, body) {
    if (error) {
      console.log(`Error scraping NationNews: ${error}`);
    } else {
      let $ = cheerio.load(body);
      //Iterate through news
      $(".latest_block").each(function (index, element) {
        let summary = $(this).find(".latest_content p").text();
        //Add scraped data to articles document
        Article.create({
          link: "http://www.nationnews.com" + $(this).find(".latest_content h3 a").attr("href"),
          headline: $(this).find(".latest_content h3 a").text(),
          date: $(this).find(".latest_content span").text(),
          //Remove spaces and new line character before, after and within summary text
          summary: $(this).find(".latest_content p").text().substring(21, summary.length - 20).replace(/\n/g, ''),
          site: "Nation News"
        }, function (error) {
          if (error) {
            console.log(`Error adding Nation News data to articles database: ${error}`);
          }
        });
      });
    }
  })
}, null, "start","America/Barbados");

// Schedule LoopNews to be scrapped every hour on minute 4, second 0 between 5am and 8pm inclusive
new CronJob("0 4 5-20 * * *", function(){
  //Scrape LoopNews
  request.get("http://www.loopnewsbarbados.com/category/loopnewsbarbados-barbados-news", function (error, response, body) {
    if (error) {
      console.log(`Error scraping Loop News: ${error}`);
    } else {
      let $ = cheerio.load(body);
      ///Iterate through news sections on page
      $(".col-half.common-aspect-ratios").each(function (index, element) {
        //Add object elements to loopnews array where each object contains the following properties:- link to article, headline, date and article summary
        Article.create({
          //add root URL to relative link scraped from page
          link: "http://www.loopnewsbarbados.com" + $(this).find("a").attr("href"),
          //Replace newlines and spaces with a '' from beginning and ending of string
          headline: $(this).find(".title-5 a").text().replace(/^\s+|\s+$/g, ''),
          //Replace newlines and spaces with a '' from beginning, within and ending of string
          summary: $(this).find("p").text().replace(/^\s+|\s+$|\n/g, ' '),
          date: $(this).find(".date span").text(),
          site: "Loop News"
        }, function (error) {
          if(error){
            console.log(`Error adding LoopNews data to articles database: ${error}`)
          }
        })
      });
    }
  });
}, null, "start", "America/Barbados");

// Schedule Advocate1 to be scrapped every hour on minute 6, second 0 between 5am and 8pm inclusive
new CronJob("0 6 5-20 * * *", function(){
  // Scrape Advocate Page 1
  request.get("https://www.barbadosadvocate.com/news", function (error, response, body) {
    if (error) {
      console.log(`Error scraping Advocate1: ${error}`);
    } else {
      let $ = cheerio.load(body);
      $(".node-article").each(function (index, element) {
        Article.create({
          link: "https://www.barbadosadvocate.com" + $(this).find(".title a").attr("href"),
          headline: $(this).find(".title a").text(),
          date: $(this).find(".date span").text(),
          summary: $(this).find(".field-item p").text() + "...",
          site: "Barbados Advocate"
        }, function (error) {
          if (error) {
            console.log(`Error adding Advocate1 data to articles database: ${error}`);
          }
        });
      });
    }
  });
}, null, "start", "America/Barbados");


// Schedule Advocate2 to be scrapped every hour on minute 8, second 0 between 5am and 8pm inclusive
new CronJob("0 8 5-20 * * *", function () {
  // Scrape Advocate Page 2
  request.get("https://www.barbadosadvocate.com/news?page=1", function (error, response, body) {
    if (error) {
      console.log(`Error scraping Advocate2: ${error}`);
    } else {
      let $ = cheerio.load(body);
      $(".node-article").each(function (index, element) {
        Article.create({
          link: "https://www.barbadosadvocate.com" + $(this).find(".title a").attr("href"),
          headline: $(this).find(".title a").text(),
          date: $(this).find(".date span").text(),
          summary: $(this).find(".field-item p").text() + "...",
          site: "Barbados Advocate"
        }, function (error) {
          if (error) {
            console.log(`Error adding Advocate2 data to articles database: ${error}`);
          }
        });
      });
    }
  });
}, null, "start", "America/Barbados");


// Schedule BIBA to be scrapped every hour on minute 10, second 0 between 5am and 8pm inclusive
new CronJob("0 10 5-20 * * *", function(){
  // Scrape BIBA
  request.get("http://biba.bb/category/news/local-news/", function (error, response, body) {
    if (error) {
      console.log(`Error scraping BIBA: ${error}`);
    } else {
      let $ = cheerio.load(body);
      $(".jeg_post").each(function (index, element) {
        Article.create({
          link: $(this).find(".jeg_thumb a").attr("href"),
          headline: $(this).find(".jeg_post_title a").text(),
          date: $(this).find(".jeg_meta_date a").text(),
          site: "Barbados International Business Association"
        }, function (error) {
          if(error){
            console.log(`Error adding BIBA data to articles database: ${error}`);
          }
        })
      });
    }
  });
}, null, "start", "America/Barbados");


// Schedule BBICT to be scrapped every hour on minute 12, second 0 between 5am and 8pm inclusive
new CronJob("0 12 5-20 * * *", function(){
  // Scrape Barbados ICT
  request.get("http://barbadosict.org/news/", function (error, response, body) {
    if (error) {
      console.log(`Error scraping bbICT: ${error}`);
    } else {
      let $ = cheerio.load(body);
      $(".post-list-styles").each(function (index, element) {
        Article.create({
          link: $(this).find(".image a").attr("href"),
          headline: $(this).find(".title a").text(),
          date: $(this).find(".date").text(),
          site: "Barbados ICT"
        }, function (error) {
          if (error) {
            console.log(`Error adding BBICT data to articles database: ${error}`);
          }
        });
      });
    }
  });
},null, "start", "America/Barbados");


// Schedule bbBusiness to be scrapped every hour on minute 14, second 0 between 5am and 8pm inclusive
new CronJob("0 14 5-20 * * *", function(){
  // Scrape BusinessBarbados
  request.get("http://businessbarbados.com/", function (error, response, body) {
    if (error) {
      console.log(`Error scraping BusinessBarbados: ${error}`);
    } else {
      let $ = cheerio.load(body);
      $(".news-item").each(function (index, element) {
        Article.create({
          link: $(this).find("a").attr("href"),
          headline: $(this).find("a").text(),
          site: "Business Barbados"
        }, function (error) {
          if (error) {
            console.log(`Error adding BusinessBarbados data to articles database: ${error}`)
          }
        });
      });
    }
  });
}, null, "start", "America/Barbados");


// Schedule GIS to be scrapped every hour on minute 16, second 0 between 5am and 8pm inclusive
new CronJob("0 16 5-20 * * *", function(){
  // Scrape GIS
  request.get("http://gisbarbados.gov.bb/top-stories/", function (error, response, body) {
    if (error) {
      console.log(`Error scraping GIS: ${error}`);
    } else {
      let $ = cheerio.load(body);
      $(".filter-topstories").each(function (index, element) {
        //Limit news articles to first 16 only
        if (index > 15) {
          return;
        }
        Article.create({
          link: $(this).find(".esg-bottom a").attr("href"),
          headline: $(this).find(".eg-hmpg_alt-element-0").text(),
          date: $(this).find(".eg-hmpg_alt-element-3").text(),
          site: "Government Info. Service"
        }, function (error) {
          if (error) {
            console.log(`Error adding GIS data to articles database: ${error}`);
          }
        });
      });
    }
  });
},null, "start", "America/Barbados");

