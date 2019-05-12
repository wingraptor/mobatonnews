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

// Number of new websites that are crawled
let siteCount = 10;

// Error and Command Messages
const generalInvalidCommandMsg = `🤖BEEP BOOP🤖 I don't understand that command, human😒.\n\n`;
const generalCommands = "*/news*: Send this command see the latest news from selected local sites\n";
const botCommands = `See Valid Commands below:\n\n ${generalCommands} ${addDescriptionToCommands(commandsGenerator())}`;
const invalidCommandMsg = `${generalInvalidCommandMsg}${botCommands}`;


/********************************************
HELPER FUNCTIONS
*********************************************/

// Generate an array of commands in the format "["/website1", "/webiste2"]" via calling the site.info.command method in the siteInfo function
function commandsGenerator() {
  // let siteCommandList = "";
  let siteCommandList = [];
  for (var i = 0; i <= siteCount - 1; i++) {
    let siteInformation = siteInfo(i);
    // siteCommandList += `*${siteInformation.command()}*: News from ${siteInformation.name}\n`;
    siteCommandList.push(siteInformation.command());
  }
  return siteCommandList;
}

// Adds specific descriptions to generated commands in the format "/newsSite1: News from {siteName]"
function addDescriptionToCommands(commands) {
  let commandsAndDescript = "";
  commands.forEach(function (command, i) {
    let siteInformation = siteInfo(i);
    commandsAndDescript += `*${command}*: News from ${siteInformation.name}\n`;
  });
  return commandsAndDescript;
}

function siteCommandValidator(userCommand, validSiteCommands) {
  let validCommand = false;
  validSiteCommands.forEach(function (siteCommand) {
    if (siteCommand === userCommand) {
      validCommand = true;
    }
  });
  return validCommand;
}

// Use siteID to get siteName and URL - reverse function is found in scrape.js
function siteInfo(siteID) {
  let siteInfo = {
    name: "",
    URL: "",
    icon: "",
    // Generates command strings from the given site in the form "/siteName"
    command: function () {
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


// Convert userCommand to a siteID - reverse function is found in main.js
function siteIDGenerator(userCommand) {
  let siteID = "";
  switch (userCommand) {
    case "/barbadostoday":
      siteID = 0;
      break;
    case "/nationnews":
      siteID = 1;
      break;
    case "/loopnews":
      siteID = 2;
      break;
    case "/barbadosadvocate":
      siteID = 3;
      break;
    case "/biba":
      siteID = 4;
      break;
    case "/barbadosict":
      siteID = 5;
      break;
    case "/businessbarbados":
      siteID = 6;
      break;
    case "/gis":
      siteID = 7;
      break;
    case "/cbcnews":
      siteID = 8;
      break;
    case "/bajanreporter":
      siteID = 9;
      break;
  }
  return siteID;
}


// (function getSiteCount() {
//   Article.distinct("siteID", function (error, uniqueIDs) {
//     if (error) {
//       console.log(`Error finding distinct siteIDs from DB:   ${error}`);
//     } else {
//       siteCount = uniqueIDs.length;
//     }
//   });
// })();

app.post('/sms', (req, res) => {
  const twiml = new MessagingResponse();
  const date = moment().format("MMMM Do h a");
  const title = "🇧🇧 *Local News From Mobaton News* 🇧🇧\n https://www.mobatonnews.info/";
  const articlesPerSite = 3;
  let newArticlesMessage = "";
  let userCommand = req.body.Body.toLowerCase();
  // Handle Latest News Message
  if (userCommand === "/news") {
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
        for (var j = 0; j <= articlesPerSite - 1; j++) {
          newArticles += `*${articles[i].data[j].headline}* - ${articles[i].data[j].link}\n\n`;
        }
      }
      // Construct message for Users
      newArticlesMessage = `${title}\n-----------------------\n*Last Updated: ${date}*\n\n${newArticles}`;

      twiml.message(newArticlesMessage);
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(twiml.toString());
    });
  } else if (siteCommandValidator(userCommand, commandsGenerator())) {
    let siteID = siteIDGenerator(userCommand);
    let articlesList = "";
    Article.find({ siteID: siteID }, null, { $sort: { articleCount: 1 } }, function (error, articles) {
      if (error) {
        console.log(`Error finding news site: ${Error}`);
      } else {
        let siteName = `*${siteInfo(siteID).name.toUpperCase()}* \n -----------------------\n`;
        for (var i = 0; i <= 3; i++) {
          articlesList += `*${articles[i].headline}* - ${articles[i].link}\n\n`;
        }

        // Construct message for Users
        articlesMessage = `${title}\n-----------------------\n${siteName}*Last Updated: ${date}*\n\n${articlesList}`;
        twiml.message(articlesMessage);
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
      }
    });
    // console.log(siteID(userCommand));
  } else {

    twiml.message(invalidCommandMsg);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});


app.listen(port, IP, function () {
  console.log("Server started");
});