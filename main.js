const bodyParser = require("body-parser"),
  session = require("express-session"),
  MongoStore = require("connect-mongo")(session),
  mongoose = require("mongoose"),
  express = require("express"),
  // morgan = require("morgan"),
  chalk = require("chalk"),
  ejs = require("ejs");

// Import Helper Functions
const siteInfo = require("./helpers/siteInfo");
const dateStandardiser = require("./helpers/dateStandardiser");

// Import Routes
const homeRouter = require("./routes/home");
const filterRouter = require("./routes/filter");
const searchRouter = require("./routes/search");
const favoritesRouter = require("./routes/favorites");
const subscribeRouter = require("./routes/subscribe");

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
app.use(bodyParser.json());
// app.use(morgan("dev"));

// Set up express-session and connect-mongo
app.use(
  session({
    secret: "Shaddam",
    saveUninitialized: true,
    resave: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);

// Set Helper Functions as properties of the locals object --> makes these functions available to all routes
app.locals.siteInfo = siteInfo;
app.locals.dateStandardiser = dateStandardiser;

// App Routes
app.use("/", homeRouter);
app.use("/filter", filterRouter);
app.use("/search", searchRouter);
app.use("/favorites", favoritesRouter);
app.use("/subscribe", subscribeRouter);

//Handle 404 errors
app.use(function (req, res) {
  res.status(404).render("404");
});

//Tell Express to listen for requests on port 3000 (starts local server)
//Visit localhost:3000 to reach site being served by local server.
app.listen(port, IP, function () {
  console.log("Server started");
});
