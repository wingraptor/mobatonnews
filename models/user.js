const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Archive = require("./archive");

//Environment variable setup
require("dotenv").config();
const databaseUrl =
  process.env.DATABASE_URL || "mongodb://localhost:27017/scrapedData";

//mongoose config
mongoose.connect(databaseUrl, { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
  _id: String,
  favoriteArticles: [
    {
      type: Schema.Types.ObjectId,
      ref: "Archive",
      index: true,
    },
  ],
  emailAddress: {
    type: String,
    unique: true,
    index: true,
    trim: true,
    lowercase: true,
  },
  frequency: String
});

module.exports = mongoose.model("User", userSchema);
