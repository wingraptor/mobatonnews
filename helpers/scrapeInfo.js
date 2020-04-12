module.exports = [
  {
    siteName: "Barbados Today",
    requestOptions: {
      uri: "https://barbadostoday.bb/category/local-news/",
    },
    toBeScraped: true,
    scrape: function ($) {
      $(".post").each(function (index, element) {
        let siteData = {};
        // First element on page has different structure to other elements
        if (index !== 0) {
          //Add scraped data to articles document
          siteData = {
            link: $(this).find(".post-thumbnail a").attr("href"),
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
          if ($(this).find(".post-thumbnail a img").attr("src")) {
            siteData.imgURL = $(this).find(".post-thumbnail a img").attr("src");
          } else if ($(this).find(".post-thumbnail a img").attr("srcset")) {
            siteData.imgURL = $(this)
              .find(".post-thumbnail a img")
              .attr("srcset")
              .split(" ")[0];
          }
        }
      });
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
  },
  {
    siteName: "Loop News",
    requestOptions: {
      uri: "https://barbadostoday.bb/category/local-news/",
    },
    toBeScraped: true,
  },
  {
    siteName: "Barbados Advocate",
    requestOptions: {
      uri: "https://www.barbadosadvocate.com/news",
    },
    toBeScraped: true,
  },
  {
    siteName: "Barbados Intl Business Assoc",
    requestOptions: {
      uri: "http://biba.bb/category/news/local-news/",
    },
    toBeScraped: true,
  },
  {
    siteName: "Barbados ICT",
    requestOptions: {
      uri: "http://barbadosict.org/news/",
    },
    toBeScraped: true,
  },
  {
    siteName: "Business Barbados",
    requestOptions: {
      uri: "http://businessbarbados.com/",
    },
    toBeScraped: true,
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
    toBeScraped: true,
  },
  {
    siteName: "Barbados Reporter",
    requestOptions: {
      uri: "https://www.bajanreporter.com/category/new/",
    },
    toBeScraped: true,
  },
  {
    siteName: "The Broad Street Journal",
    requestOptions: {
      uri: "https://www.broadstjournal.com/categories/marketing",
    },
    toBeScraped: false,
  },
];
