const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can only have a product once in their wishlist
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);
