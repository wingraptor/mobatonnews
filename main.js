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



// Convert siteID to siteName
function siteName(siteID) {
  let siteName = "";
  switch (siteID) {
    case 0:
      siteName = "Barbados Today";
      break;
    case 1:
      siteName = "Nation News";
      break;
    case 2:
      siteName = "Loop News";
      break;
    case 3:
      siteName = "Barbados Advocate";
      break;
    case 4:
      siteName = "Barbados International Business Association";
      break;
    case 5:
      siteName = "Barbados ICT";
      break;
    case 6:
      siteName = "Business Barbados";
      break;
    case 7:
      siteName = "Government Info.Service";
      break;
  }
  return siteName;
}


app.get("/", function(req,res){
  // Return data from articles DB sorted according to siteID and ID(newest article to oldest article)
  // Article.find({}, null, { sort: { siteID: "ascending", _id: "ascending" } }, function(error, articles){
  //   if(error){
  //     console.log("Error quering articles DB on home page");
  //   }
  //   else {
  //     res.render("home", { articles: articles, siteNameConvertor: siteName});
  //   }
  // });

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
      res.render("home", { articles: articles, siteNameConvertor: siteName});
    }
  });
});


//Tell Express to listen for requests on port 3000 (starts local server)
//Visit localhost:3000 to reach site being served by local server.
app.listen(3000, function(){
  console.log("Server started");
});