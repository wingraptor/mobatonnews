const mongoose = require("mongoose");

//Environment variable setup
require("dotenv").config();
const databaseUrl = process.env.DATABASE_URL || "mongodb://localhost:27017/scrapedData";

//mongoose config
mongoose.connect(
  databaseUrl,
  { useNewUrlParser: true }
);

//Database config
var scrapedDataSchema = new mongoose.Schema({
    link: String,
    headline: String,
    date: String,
    summary: String,
    siteID: Number,
    articleCount: Number
}, 
{ timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model("Article", scrapedDataSchema);