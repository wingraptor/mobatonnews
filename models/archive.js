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
var archiveSchema = new mongoose.Schema({
  link: String,
  headline: String,
  date: String,
  siteID: Number,
  utcDate: Date
},
  { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model("Archive", archiveSchema);