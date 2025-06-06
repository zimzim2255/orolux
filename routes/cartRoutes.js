const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Middleware to protect user routes
function ensureUser(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// View Cart
router.get("/cart", ensureUser, async (req, res) => {
  const userId = req.session.user && (req.session.user.id || req.session.user._id);
  if (!userId) {
    return res.redirect("/login");
  }  const cartItems = await Cart.find({ userId }).populate("productId");  res.render("cart", { 
    cart: cartItems,
    discountedTotal: req.session.discountedTotal || null,
    error: req.session.error,
    promoCode: req.session.promoCode
  });
  
  // Clear flash messages
  delete req.session.error;
});

// Add to Cart
router.post("/cart/add", ensureUser, async (req, res) => {
  const userId = req.session.user && (req.session.user.id || req.session.user._id);
  if (!userId) {
    return res.redirect("/login");
  }
  const { productId, quantity } = req.body;
  const existingItem = await Cart.findOne({ userId, productId });
  if (existingItem) {
    existingItem.quantity += parseInt(quantity);
    await existingItem.save();
  } else {
    await Cart.create({ userId, productId, quantity });
  }
  res.redirect("/cart");
});

// Update Quantity
router.post("/cart/update/:id", ensureUser, async (req, res) => {
  const { quantity } = req.body;
  await Cart.findByIdAndUpdate(req.params.id, { quantity });
  res.redirect("/cart");
});

// Remove Item from Cart
router.get("/cart/remove/:id", ensureUser, async (req, res) => {
  const userId = req.session.user && (req.session.user.id || req.session.user._id);
  await Cart.findByIdAndDelete(req.params.id);
  
  // Check if cart is empty
  const remainingItems = await Cart.find({ userId });
  if (remainingItems.length === 0) {
    // Clear promo code data if cart is empty
    delete req.session.promoApplied;
    delete req.session.discountedTotal;
    delete req.session.promoCode;
  }
  
  res.redirect("/cart");
});

module.exports = router;