const mongoose = require("mongoose");

//mongoose config
mongoose.connect("mongodb://localhost:27017/scrapedData",
  { useNewUrlParser: true });

//Database config
var archiveSchema = new mongoose.Schema({
  link: String,
  headline: String,
  date: String,
  siteID: Number
},
  { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model("Archive", archiveSchema);