const bodyParser = require('body-parser'),
  mongoose = require("mongoose"),
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
app.use(bodyParser.urlencoded({ extended: false }));

// Error and Command Messages
const siteCount = 10;
const generalInvalidCommandMsg = `🤖BEEP BOOP🤖 I don't understand that command, human😒.\n\n`;
const generalCommands = "*/news*: Send this command see the latest news from selected local sites\n";
const botCommands = `See Valid Commands below:\n\n ${generalCommands} ${commandGenerator()}`;
const invalidCommandMsg = `${generalInvalidCommandMsg}${botCommands}`;

// Returns array of unique siteIDs from articles DB - used to generate unique news sites from which articles are scraped  
// Article.distinct("siteID", function (error, uniqueIDs) {
//   if (error) {
//     console.log(`Error finding distinct siteIDs from DB:   ${error}`);
//   } else{
//     for (var i = 0; i <= uniqueIDs.length; i++) {
//       return siteInfo(uniqueIDs[i]).name;
//     }
//   }
// });

/********************************************
HELPER FUNCTIONS
*********************************************/

// Generates valid commands and description in the form: /siteName: News from SiteName
function commandGenerator(){
  let siteCommandList = "";
  for (var i = 0; i <= siteCount - 1; i++){
    let siteInformation = siteInfo(i);
    siteCommandList += `*${siteInformation.command()}*: News from ${siteInformation.name}\n`;
  }
  return siteCommandList;
}

// Use siteID to get siteName and URL - reverse function is found in scrape.js
function siteInfo(siteID) {
  let siteInfo = {
    name: "",
    URL: "",
    icon: "",
    // Generates command strings from the given site
    command: function(){ 
      return `/${siteInfo.name.toLowerCase().split(" ").join("")}`;
    }
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
      siteInfo.name = "BIBA";
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
      siteInfo.name = "GIS";
      siteInfo.URL = "http://gisbarbados.gov.bb/gis-news/"
      siteInfo.icon = "bell";
      break;
    case 8:
      siteInfo.name = "CBC News";
      siteInfo.URL = "https://www.cbc.bb/index.php/news/barbados-news"
      siteInfo.icon = "newspaper";
      break;
    case 9:
      siteInfo.name = "Bajan Reporter";
      siteInfo.URL = "https://www.bajanreporter.com/category/new/";
      siteInfo.icon = "newspaper"
  }
  return siteInfo;
}


app.post('/sms', (req, res) => {
  const twiml = new MessagingResponse();
  const date = moment().format("MMMM Do h a");
  const title = "🇧🇧*Local News From Mobaton News*🇧🇧 \n https://www.mobatonnews.info/";
  const articlesPerSite = 3;
  let newArticlesMessage = "";
// Handle Latest News Message
  if (req.body.Body.toLowerCase() === "/news") {
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
        // Get Website name based on siteID
        let siteName = `*${siteInfo(articles[i]._id).name.toUpperCase()}* \n -----------------------\n`;
        // Append siteName to initial newArticles message
        newArticles += siteName;
        // Iterate through articles from specific news site
        for (var j = 1; j <= articlesPerSite; j++) {
          newArticles += `*${articles[i].data[j].headline}* - ${articles[i].data[j].link}\n\n`;
        }
      }
      // Construct message for Users
      newArticlesMessage = `${title}\n-----------------------\n*Last Updated: ${date}*\n\n${newArticles}`;

      twiml.message(newArticlesMessage);
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(twiml.toString());
    });
  } else {
    twiml.message(invalidCommandMsg);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});


app.listen(port, IP, function () {
  console.log("Server started");
});