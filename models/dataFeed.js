const mongoose = require("mongoose");

//Environment variable setup
require("dotenv").config();

var dataSchema = new mongoose.Schema({
  temperature: String,
  skytext: String,
  imageUrl: String,
  gasPrice: Number,
  dieselPrice: Number,
  gbp:Number,
  cad:Number
});

module.exports = mongoose.model("Data", dataSchema);