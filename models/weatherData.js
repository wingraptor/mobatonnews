const mongoose = require("mongoose");

//Environment variable setup
require("dotenv").config();
const databaseUrl = process.env.DATABASE_URL || "mongodb://localhost:27017/scrapedData";

//mongoose config
mongoose.connect(
  databaseUrl,
  { useNewUrlParser: true }
);

var weatherData = new mongoose.Schema({
  temperature: String,
  skytext: String,
  imageUrl: String
});

module.exports = mongoose.model("Weather", weatherData);