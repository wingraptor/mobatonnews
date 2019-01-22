const mongoose = require("mongoose"),
      Article = require("./models/scrapedData.js"),
      Archive = require("./models/archive.js"),
      express = require("express"),
      ejs = require("ejs");


//mongoose config
mongoose.connect(
  "mongodb://localhost:27017/scrapedData",
  { useNewUrlParser: true }
);

//EJS + Express config
const app = express();
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));



// Use siteID to get siteName and URL
function siteInfo(siteID) {
  let siteInfo = {
    name:"",
    URL: ""
};
  switch (siteID) {
    case 0:
      siteInfo.name = "Barbados Today";
      siteInfo.URL = "http://barbadostoday.bb/";
      break;
    case 1:
      siteInfo.name = "Nation News";
      siteInfo.URL = "http://www.nationnews.com/";
      break;
    case 2:
      siteInfo.name = "Loop News";
      siteInfo.URL = "http://www.loopnewsbarbados.com/";
      break;
    case 3:
      siteInfo.name = "Barbados Advocate";
      siteInfo.URL = "https://www.barbadosadvocate.com/";
      break;
    case 4:
      siteInfo.name = "Barbados International Business Association";
      siteInfo.URL = "http://biba.bb/";
      break;
    case 5:
      siteInfo.name = "Barbados ICT";
      siteInfo.URL = "http://barbadosict.org/";
      break;
    case 6:
      siteInfo.name = "Business Barbados";
      siteInfo.URL = "http://businessbarbados.com/";
      break;
    case 7:
      siteInfo.name = "Government Info.Service";
      siteInfo.URL = "http://gisbarbados.gov.bb/gis-news/"
      break;
  }
  return siteInfo;
}


app.get("/", function(req,res){
  // Query Articles DB
  Article.aggregate([
    //group articles according to siteIDs
    { $group: { _id: "$siteID", data: { $push: "$$ROOT" } } },
    //sort according to siteID and ID(newest article to oldest article)
    { $sort: { _id: 1, "data._id": -1 } },
  ], function (error, articles) {
    if(error){
      console.log("Error quering articles DB on home page");
    }
    else {
      res.render("home", { articles: articles, siteInfo: siteInfo});
    }
  });
});

app.get("/test", function (req, res) {
  // Query Articles DB
  Article.aggregate([
    //group articles according to siteIDs
    { $group: { _id: "$siteID", data: { $push: "$$ROOT" } } },
    //sort according to siteID and ID(newest article to oldest article)
    { $sort: { _id: 1, "data._id": -1 } },
  ], function (error, articles) {
    if (error) {
      console.log("Error quering articles DB on home page");
    }
    else {
      res.render("test", { articles: articles, siteInfo: siteInfo });
    }
  });
});


//Tell Express to listen for requests on port 3000 (starts local server)
//Visit localhost:3000 to reach site being served by local server.
app.listen(3000, function(){
  console.log("Server started");
});