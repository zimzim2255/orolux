const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: {
    type: String, // Accept both ObjectId and guestId string
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    selectedColor: String
  }]
});

module.exports = mongoose.model("Cart", cartSchema);