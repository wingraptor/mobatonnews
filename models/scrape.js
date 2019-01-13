const request = require("request"),
      cheerio = require("cheerio");

  const bbToday = [],
        nationNews = [],
        loopNews = [],
        advocate = [],
        advocate2 = [],
        biba = [],
        bbict = [],
        businessbb = [],
        GIS = [];

// Scrape Barbados Today
request.get("https://barbadostoday.bb/", function(error,response,body){
  if (error){
    console.log(error);
  } else {
    let $ = cheerio.load(body);
    //Iterate through each local news element on page
    $('#category-posts-10-internal .cat-post-item a').each(function(index, element){
      //Add object elements to bbToday array where each object contains the following properties:- link to article, headline, date and article summary
      bbToday[index] = {
        link: $(this).attr("href"),
        headline: $(this).find(".cat-post-title").text(),
        date: $(this).find(".cat-post-date").text() ,
        summary: $(this).find("p").text()
      }
    });
  }
});

//Scrape NationNews
request.get("http://www.nationnews.com/type/news", function (error, response, body) {
  if (error) {
    console.log(`Error scraping NationNews: ${error}`);
  } else {
    let $ = cheerio.load(body);
    //Iterate through news in the RSS stream
    $(".latest_block").each(function (index, element) {
      //Add object elements to nationNews array where each object contains the following properties:- link to article, headline, date and article summary
      let summary = $(this).find(".latest_content p").text();
      nationNews[index] = {
        link: "http://www.nationnews.com" + $(this).find(".latest_content h3 a").attr("href"),
        headline: $(this).find(".latest_content h3 a").text(),
        date: $(this).find(".latest_content span").text(),
        //Remove spaces and new line character before, after and within summary text
        summary: $(this).find(".latest_content p").text().substring(21, summary.length-20).replace(/\n/g, '')
      }
    });
  }
});

//Scrape LoopNews
request.get("http://www.loopnewsbarbados.com/category/loopnewsbarbados-barbados-news", function(error, response, body){
  if(error){
    console.log(error)
  } else {
    let $ = cheerio.load(body);
    ///Iterate through news sections on page
    $(".col-half.common-aspect-ratios").each(function(index, element){
      //Add object elements to loopnews array where each object contains the following properties:- link to article, headline, date and article summary
      loopNews[index] = {
        //add root URL to relative link scraped from page
        link: "http://www.loopnewsbarbados.com" + $(this).find("a").attr("href"),
        //Replace newlines and spaces with a '' from beginning and ending of string
        headline: $(this).find(".title-5 a").text().replace(/^\s+|\s+$/g, ''),
        //Replace newlines and spaces with a '' from beginning, within and ending of string
        summary: $(this).find("p").text().replace(/^\s+|\s+$|\n/g, ' '),
        date: $(this).find(".date span").text(),
      }
    });
  }
});


// Scrape the Advocate Home Page
request.get("https://www.barbadosadvocate.com", function(error, response, body){
  if(error){
    console.log(error);
  } else {
    let $ = cheerio.load(body);
    $(".views-slideshow-cycle-main-frame-row").each(function(index, element){
      let summary = $(this).find(".views-field-body .field-content").text();
      advocate[index] = {
        link: "https://www.barbadosadvocate.com" + $(this).find(".views-field-field-image .field-content a").attr("href"),
        headline: $(this).find(".views-field-title .field-content a span").text(),
        //Removes the "...more" from the end of the story summary page
        summary: summary.substring(0, summary.length - 8),
      }
    });
  }
})


// Scrape Advocate Page 1
request.get("https://www.barbadosadvocate.com/news", function(error, response, body){
  if(error){
    console.log(body);
  } else {
    let $ = cheerio.load(body);
    $(".node-article").each(function(index, element){
      advocate[index] = {
        link: "https://www.barbadosadvocate.com" + $(this).find(".title a").attr("href"),
        headline: $(this).find(".title a").text(),
        date: $(this).find(".date span").text(),
        summary: $(this).find(".field-item p").text() + "..."
      }
    })
  }
});

//Scrape Advocate Page 2
request.get("https://www.barbadosadvocate.com/news?page=1", function (error, response, body) {
  if (error) {
    console.log(body);
  } else {
    let $ = cheerio.load(body);
    $(".node-article").each(function (index, element) {
      advocate2[index] = {
        link: "https://www.barbadosadvocate.com" + $(this).find(".title a").attr("href"),
        headline: $(this).find(".title a").text(),
        date: $(this).find(".date span").text(),
        summary: $(this).find(".field-item p").text() + "..."
      }
    })
  }
});

// Scrape BIBA
request.get("http://biba.bb/category/news/local-news/", function(error, response, body){
  if(error){
    console.log(`Error scraping BIBA: ${error}`);
  } else {
    let $ = cheerio.load(body);
    $(".jeg_post").each(function(index, element){
      biba[index] = {
        link: $(this).find(".jeg_thumb a").attr("href"),
        headline: $(this).find(".jeg_post_title a").text(),
        date: $(this).find(".jeg_meta_date a").text()
      }
    });
  }
});

// Scrape Barbados ICT
request.get("http://barbadosict.org/news/", function(error, response, body){
  if(error){
    console.log(`Error scraping bbICT: ${error}`);
  } else {
    let $ = cheerio.load(body);
    $(".post-list-styles").each(function(index, element){
      bbict[index] = {
        link: $(this).find(".image a").attr("href"),
        headline: $(this).find(".title a").text(),
        date: $(this).find(".date").text()
      }
    });
  }
})

// Scrape BusinessBarbados
request.get("http://businessbarbados.com/", function(error, response, body){
  if(error){
    console.log(`Error with business Barbados: ${error}`);
  } else {
    let $ = cheerio.load(body);
    $(".news-item").each(function(index, element){
      businessbb[index] = {
        link: $(this).find("a").attr("href"),
        headline: $(this).find("a").text()
      }
    });
  }
});

// Scrape GIS
request.get("http://gisbarbados.gov.bb/top-stories/", function(error, response, body){
  if (error){
    console.log(`Error scraping GIS: ${error}`);
  } else {
    let $ = cheerio.load(body);
    $(".filter-topstories").each(function(index, element){
      //Limit news articles to first 16 only
      if (index > 15 ){
        return;
      }
      GIS[index] = {
        link: $(this).find(".esg-bottom a").attr("href"),
        headline: $(this).find(".eg-hmpg_alt-element-0").text(),
        date: $(this).find(".eg-hmpg_alt-element-3").text()
      }
    });
  }
});
