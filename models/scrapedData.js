const mongoose = require("mongoose");

//Environment variable setup
require("dotenv").config();

//Database config
var scrapedDataSchema = new mongoose.Schema({
    link: String,
    headline: String,
    date: String,
    summary: String,
    siteID: Number,
    articleCount: Number,
    imgURL: String,
    newArticle: Boolean
}, 
{ timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model("Article", scrapedDataSchema);