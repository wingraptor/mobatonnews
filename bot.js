const mongoose = require("mongoose"),
  Article = require("./models/scrapedData.js"),
  Archive = require("./models/archive.js"),
  Weather = require("./models/weatherData"),
  express = require("express"),
  moment = require("moment"),
  ejs = require("ejs");


//Environment variable setup
require("dotenv").config();
const port = process.env.PORT || 3000;
const IP = process.env.IP || "";
const databaseUrl = process.env.DATABASE_URL || "mongodb://localhost:27017/scrapedData";

//Twilio Setup
const accountSid = process.env.ACCT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const MessagingResponse = require('twilio').twiml.MessagingResponse;

//mongoose config
mongoose.connect(
  databaseUrl,
  { useNewUrlParser: true }
);

//EJS + Express config
const app = express();
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// Send Message
// client.messages
//   .create({
//     from: 'whatsapp:+14155238886',
//     body: 'I see youuuu!',
//     to: 'whatsapp:+12462455701'
//   })
//   .then(message => console.log(message.sid));

// Use siteID to get siteName and URL - reverse function is found in scrape.js
function siteInfo(siteID) {
  let siteInfo = {
    name: "",
    URL: "",
    icon: ""
  };
  switch (siteID) {
    case 0:
      siteInfo.name = "Barbados Today";
      siteInfo.URL = "http://barbadostoday.bb/";
      siteInfo.icon = "newspaper";
      break;
    case 1:
      siteInfo.name = "Nation News";
      siteInfo.URL = "http://www.nationnews.com/";
      siteInfo.icon = "newspaper";
      break;
    case 2:
      siteInfo.name = "Loop News";
      siteInfo.URL = "http://www.loopnewsbarbados.com/";
      siteInfo.icon = "newspaper";
      break;
    case 3:
      siteInfo.name = "Barbados Advocate";
      siteInfo.URL = "https://www.barbadosadvocate.com/";
      siteInfo.icon = "newspaper";
      break;
    case 4:
      siteInfo.name = "Barbados Intl Business Assoc";
      siteInfo.URL = "http://biba.bb/";
      siteInfo.icon = "briefcase";
      break;
    case 5:
      siteInfo.name = "Barbados ICT";
      siteInfo.URL = "http://barbadosict.org/";
      siteInfo.icon = "laptop";
      break;
    case 6:
      siteInfo.name = "Business Barbados";
      siteInfo.URL = "http://businessbarbados.com/";
      siteInfo.icon = "briefcase";
      break;
    case 7:
      siteInfo.name = "Government Info Service";
      siteInfo.URL = "http://gisbarbados.gov.bb/gis-news/"
      siteInfo.icon = "bell";
      break;
    case 8:
      siteInfo.name = "CBC News";
      siteInfo.URL = "https://www.cbc.bb/index.php/news/barbados-news"
      siteInfo.icon = "newspaper";
      break;
    case 9:
      siteInfo.name = "Barbados Reporter";
      siteInfo.URL = "https://www.bajanreporter.com/category/new/";
      siteInfo.icon = "newspaper"
  }
  return siteInfo;
}


app.post('/sms', (req, res) => {
  const twiml = new MessagingResponse();
  const date = moment().format("MMMM Do h a");
  const title = "*🇧🇧Local News From Mobaton News🇧🇧 https://www.mobatonnews.info/*";
  const articlesPerSite = 3;
  let newArticlesMessage = "";
  // Group top 3 newest articles from BBToday, NationNews and LoopNews
  Article.aggregate([
    //Find and Return articles from BBToday, NationNews and Loop News only
    { $match: { $or: [{ siteID: 0 }, { siteID: 1 }, { siteID: 2 }] } },
    //Sort articles from each website in ascending order according to articleCount
    { $sort: { articleCount: 1 } },
    //group articles according to siteIDs
    { $group: { _id: "$siteID", data: { $push: "$$ROOT" } } },
    //sort according siteID
    { $sort: { _id: 1 } }
  ], function (error, articles) {
    let newArticles = "";
    // Iterate through each news site
    for (var i = 0; i <= articles.length - 1; i++) {
      let siteName = `*${siteInfo(articles[i]._id).name.toUpperCase()}* \n -----------------------\n`;
      newArticles += siteName;
      // Iterate through articles from specific news site
      for (var j = 1; j <= articlesPerSite; j++) {
        newArticles += `*${articles[i].data[j].headline}* - ${articles[i].data[j].link}\n\n`;
      }
    }
    // Construct message for Users
      newArticlesMessage = `${title}\n-----------------------\n*${date}*\n\n${newArticles}`;

    twiml.message(newArticlesMessage);

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  });
});


app.listen(port, IP, function () {
  console.log("Server started");
});