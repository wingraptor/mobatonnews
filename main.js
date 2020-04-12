const bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  express = require("express"),
  morgan = require("morgan"),
  chalk = require("chalk"),
  ejs = require("ejs");


// Import Helper Functions
const siteInfo = require("./helpers/siteInfo");
const dateStandardiser = require("./helpers/dateStandardiser");

// Import Routes
const homeRouter = require("./routes/home");
const filterRouter = require("./routes/filter");
const searchRouter = require("./routes/search");

//Environment variable setup
require("dotenv").config();
const port = process.env.PORT || 3000;
const IP = process.env.IP || "";
const databaseUrl =
  process.env.DATABASE_URL || "mongodb://localhost:27017/scrapedData";

//mongoose config
mongoose.connect(databaseUrl, { useNewUrlParser: true, useCreateIndex: true });
mongoose.set("useUnifiedTopology", true);

//EJS + Express config
const app = express();
// Set express to recognise all res.render files as .ejs
app.set("view engine", "ejs");
// Make express aware of public folder; location of stylesheets, scripts and images
app.use(express.static(__dirname + "/public"));
// Body Parser Config
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));


// Set Helper Functions as properties of the locals object --> makes these functions available to all routes
app.locals.siteInfo = siteInfo;
app.locals.dateStandardiser = dateStandardiser;

// App Routes
app.use("/", homeRouter);
app.use("/filter", filterRouter);
app.use("/search", searchRouter);

//Handle 404 errors
app.use(function(req,res){
  res.status(404).render("404");
});


//Tell Express to listen for requests on port 3000 (starts local server)
//Visit localhost:3000 to reach site being served by local server.
app.listen(port, IP, function() {
  console.log("Server started");
});
