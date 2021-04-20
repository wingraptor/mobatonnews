module.exports = [
  {
    siteName: "Barbados Today",
    requestOptions: {
      uri: "https://barbadostoday.bb/category/local-news/",
    },
    toBeScraped: true,
    parse: function ($) {
      let articles = [];
      $(".post").each(function (index, element) {
        let articleData = {};
        // First element on page has different structure to other elements
        if (index !== 0) {
          //Add scraped data to articles document
          articleData = {
            link: $(this).find(".post-thumbnail a").attr("href"),
            headline: $(this)
              .find(".title_caption_wrap .post-header .post-title a")
              .text()
              .trim(),
            summary: $(this)
              .find(".title_caption_wrap")
              .contents()
              .last()
              .text()
              .trim(),
            // Extract date from article URL: format=https://barbadostoday.bb/YYYY/MM/DD/atherley-names-team-to-speak-for-opposition-on-national-issues/
            date: $(this)
              .find(".post-thumbnail a")
              .attr("href")
              .substring(25, 35),
            siteID: 0,
          };
          // imgURLs are not consistent on page, below checks to see how image is stored on page and records appropriate src
          if ($(this).find(".post-thumbnail a img").attr("src")) {
            articleData.imgURL = $(this)
              .find(".post-thumbnail a img")
              .attr("src");
          } else if ($(this).find(".post-thumbnail a img").attr("srcset")) {
            articleData.imgURL = $(this)
              .find(".post-thumbnail a img")
              .attr("srcset")
              .split(" ")[0];
          }
          articles.push(articleData);
        }
      });
      return articles;
    },
  },
  {
    siteName: "Nation News",
    requestOptions: {
      // deflate response from server using gzip --> https://stackoverflow.com/questions/8880741/node-js-easy-http-requests-with-gzip-deflate-compression
      gzip: true,
      uri: "http://www.nationnews.com/type/news",
    },
    toBeScraped: true,
    parse: function ($) {
      let articles = [];
      $(".latest_block").each(function (index, element) {
        if ($(this).find(".latest_content h3 a").text() !== "") {
          let articleData = {};
          articleData = {
            link:
              "http://www.nationnews.com" +
              $(this).find(".latest_content h3 a").attr("href"),
            headline: $(this).find(".latest_content h3 a").text(),
            date: $(this).find(".latest_content span").text(),
            //Remove spaces and new line character before, after and within summary text
            summary: $(this).find(".latest_content p").text(),
            siteID: 1,
            imgURL:
              "https://www.nationnews.com" + $(this).find("img").attr("src"),
          };
          // Remove spaces and new line character before, after and within summary text
          let summaryLength = articleData.summary.length;
          articleData.summary = articleData.summary
            .substring(21, summaryLength - 20)
            .replace(/\n/g, "");

          articles.push(articleData);
        }
      });
      return articles;
    },
  },
  {
    siteName: "Loop News",
    requestOptions: {
      uri:
        "http://www.loopnewsbarbados.com/category/loopnewsbarbados-barbados-news",
    },
    toBeScraped: true,
    parse: function ($) {
      let articles = [];
      $(".col-half.common-aspect-ratios").each(function (index, element) {
        //Add object elements to loopnews array where each object contains the following properties:- link to article, headline, date and article summary
        let articleData = {
          //add root URL to relative link scraped from page
          link:
            "http://www.loopnewsbarbados.com" + $(this).find("a").attr("href"),
          //Replace newlines and spaces with a '' from beginning and ending of string
          headline: $(this)
            .find(".title-5 a")
            .text()
            .replace(/^\s+|\s+$/g, ""),
          //Replace newlines and spaces with a '' from beginning, within and ending of string
          summary: $(this)
            .find("p")
            .text()
            .replace(/^\s+|\s+$|\n/g, " ").trim(),
          date: $(this).find(".date span").text(),
          siteID: 2,
          imgURL: $(this).find("img").attr("src"),
        };
        articles.push(articleData);
      });
      return articles;
    },
  },
  {
    siteName: "Barbados Advocate",
    requestOptions: {
      uri: "https://www.barbadosadvocate.com/news",
    },
    toBeScraped: true,
    parse: function ($) {
      let articles = [];
      $(".node-article").each(function (index, element) {
        let articleData = {
          link:
            "http://www.barbadosadvocate.com" +
            $(this).find(".title a").attr("href"),
          headline: $(this).find(".title a").text(),
          date: $(this).find(".date span").text(),
          summary: $(this).find(".field-item p").text() + "...",
          siteID: 3,
          // Images no longer available
          // imgURL: $(this).find("img").attr("src"),
        };
        articles.push(articleData);
      });
      return articles;
    },
  },
  {
    siteName: "Barbados Intl Business Assoc",
    requestOptions: {
      uri: "http://biba.bb/category/news/local-news/",
    },
    // Scrape methodology to be changed
    toBeScraped: false,
    parse: function ($) {
      let articles = [];
      $(".jeg_posts").each(function (index, element) {
        let articleData = {
          link: $(this).find(".jeg_thumb a").attr("href"),
          headline: $(this).find(".jeg_post_title a").text(),
          date: $(this).find(".jeg_meta_date a").text(),
          siteID: 4,
        };
        articles.push(articleData);
      });
      return articles;
    },
  },
  {
    siteName: "Barbados ICT",
    requestOptions: {
      uri: "http://barbadosict.org/news/",
    },
    toBeScraped: true,
    parse: function ($) {
      let articles = [];
      $(".post-list-styles").each(function (index, element) {
        let articleData = {
          link: $(this).find(".image a").attr("href"),
          headline: $(this).find(".title a").text(),
          date: $(this).find(".date").text(),
          siteID: 5,
          imgURL: $(this).find("img").attr("src"),
        };
        articles.push(articleData);
      });
      return articles;
    },
  },
  {
    siteName: "Business Barbados",
    requestOptions: {
      uri: "http://businessbarbados.com/",
    },
    toBeScraped: true,
    parse: function ($) {
      let articles = [];
      $(".news-item").each(function (index, element) {
        let articleData = {
          link: $(this).find("a").attr("href"),
          headline: $(this).find("a").text().trim(),
          siteID: 6,
        };
        articles.push(articleData);
      });
      return articles;
    },
  },
  {
    siteName: "Government Info Service",
    requestOptions: {
      uri: "https://gisbarbados.gov.bb/top-stories/",
    },
    toBeScraped: false,
  },
  {
    siteName: "CBC News",
    requestOptions: {
      uri: "https://www.cbc.bb/category/barbados-news/",
    },
    toBeScraped: false,
    parse: function ($) {
      let articles = [];
      $(".post").each(function (index, element) {
        //Limit news articles to first 16 only
        let articleData = {
          link: $(this)
            .find(".archive-desc-wrapper .entry-title a")
            .attr("href"),
          headline: $(this).find(".archive-desc-wrapper .entry-title a").text(),
          date: $(this)
            .find(
              ".archive-desc-wrapper .entry-footer .entry-meta .posted-on a .entry-date"
            )
            .text(),
          summary: $(this)
            .find(".archive-desc-wrapper .entry-content p")
            .text(),
          imgURL: $(this).find(".post-image a figure img").attr("src"),
          siteID: 8,
        };
        articles.push(articleData);
      });
      return articles;
    },
  },
  {
    siteName: "Barbados Reporter",
    requestOptions: {
      uri: "https://www.bajanreporter.com/category/new/",
    },
    toBeScraped: true,
    parse: function ($) {
      let articles = [];
      $(".post").each(function (index, element) {
        //Limit news articles to first 16 only
        if (index > 15) {
          return;
        }
        //Limit news articles to first 16 only
        let articleData = {
          link: $(this).find("h2 a").attr("href"),
          headline: $(this).find("h2 a").text().trim(),
          date: $(this).find(".byline .post-date").text().trim(),
          // to only select text of summary and not text in <noscript> element - https://stackoverflow.com/questions/3442394/using-text-to-retrieve-only-text-not-nested-in-child-tags
          summary: $(this)
            .find(".article-summary")
            .clone()
            .children()
            .remove()
            .end(".article-summary")
            .text()
            .replace(/^\s+|\s+$/g, ""),
          siteID: 9,
          // Image scraped is just a generic Stop, this image is hotlinked image
          // imgURL: $(this).find("img").attr("data-lazy-src"),
        };
        articles.push(articleData);
      });
      return articles;
    },
  },
  {
    siteName: "The Broad Street Journal",
    requestOptions: {
      uri: "https://www.broadstjournal.com/categories/marketing",
    },
    toBeScraped: false,
  },
];
