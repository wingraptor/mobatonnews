const mongoose = require("mongoose");

//Environment variable setup
require("dotenv").config();
const databaseUrl = process.env.DATABASE_URL || "mongodb://localhost:27017/scrapedData";

//mongoose config
mongoose.connect(
  databaseUrl,
  { useNewUrlParser: true }
);

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