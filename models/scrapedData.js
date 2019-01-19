const mongoose = require("mongoose");

//mongoose config
mongoose.connect("mongodb://localhost:27017/scrapedData",
  { useNewUrlParser: true });

//Database config
var scrapedDataSchema = new mongoose.Schema({
    link: String,
    headline: String,
    date: String,
    summary: String,
    siteID: Number
}, 
{ timestamps: { createdAt: 'created_at' } });



module.exports = mongoose.model("Article", scrapedDataSchema);