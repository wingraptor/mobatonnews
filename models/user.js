const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Archive = require("./archive");

//Environment variable setup
require("dotenv").config();

// TODO: Modify indices for emailAddress field on mlab.
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    index: true,
  },
  favoriteArticles: [
    {
      type: Schema.Types.ObjectId,
      ref: "Archive",
      index: true,
    },
  ],
  subscribed: {
    type: Boolean,
  },
  frequency: { 
    type: String, 
    default: "30min" 
  },
});

// Sets the initial value of the favorite articles array to the article that describes how to add/save articles to favorites
userSchema.pre("save", function (next) {
  if (this.favoriteArticles.length == 0)
    this.favoriteArticles.push("5e9f42aa82b17e58ca72ca08"); //Default article ID for live DB: 5e9f3edac028d0585a209ce2
  next();
});

module.exports = mongoose.model("User", userSchema);
