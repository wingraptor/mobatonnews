const mongoose = require("mongoose");

//Environment variable setup
require("dotenv").config();


var weatherData = new mongoose.Schema({
  temperature: String,
  skytext: String,
  imageUrl: String
});

module.exports = mongoose.model("Weather", weatherData);