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

// Sets the initial value of the favorite articles array to the article that describes adding/saving articles to favorites
userSchema.pre("save", function (next) {
  if (this.favoriteArticles.length == 0) this.favoriteArticles.push("5e9f42aa82b17e58ca72ca08"); //Default article ID for live DB: 5e9f3edac028d0585a209ce2
  next();
});

module.exports = mongoose.model("User", userSchema);
