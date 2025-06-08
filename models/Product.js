const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  colors: [{
    name: String,
    code: String, // Hex code or RGB value
    stock: Number
  }],
  createdAt: { type: Date, default: Date.now },
  comments: [
    {
      username: String,  
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model("Product", productSchema);