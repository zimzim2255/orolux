const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema({
  code: String,
  discountPercent: Number,
  expiresAt: Date
});

module.exports = mongoose.model("PromoCode", promoCodeSchema);