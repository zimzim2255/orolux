const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema({
  page: String,
  content: String
});

module.exports = mongoose.model("PageContent", pageSchema);