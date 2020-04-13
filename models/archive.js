const mongoose = require("mongoose");

//Environment variable setup
require("dotenv").config();
const databaseUrl =
  process.env.DATABASE_URL || "mongodb://localhost:27017/scrapedData";

//mongoose config
mongoose.connect(databaseUrl, { useNewUrlParser: true });

//Database config
var archiveSchema = new mongoose.Schema(
  {
    link: { type: String, trim: true },
    headline: { type: String, unique: true },
    date: { type: String, trim: true },
    summary: { type: String, trim: true },
    siteID: Number,
    utcDate: Date,
    imgURL: { type: String, trim: true },
  },
  { timestamps: { createdAt: "created_at" } }
);

archiveSchema.index({
  headline: "text",
});

module.exports = mongoose.model("Archive", archiveSchema);
