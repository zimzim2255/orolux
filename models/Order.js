const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.Mixed, // Accept ObjectId or guestId string
    ref: "User",
    required: false // Allow guest orders
  },
  deliveryInfo: {
    name: String,
    phone: String,
    address: String,
    email: String
  },
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: Number,
    selectedColor: String
  }],
  total: Number,
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);