const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Middleware to protect user routes
function ensureUser(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// Middleware to allow guest users
function getOrCreateGuestId(req) {
  if (!req.session.guestId) {
    req.session.guestId = `guest_${Date.now()}_${Math.floor(Math.random()*10000)}`;
  }
  return req.session.guestId;
}

// Modified ensureUser to allow guest checkout for cart/checkout/order
function ensureUserOrGuest(req, res, next) {
  if (!req.session.user && !req.session.guestId) {
    getOrCreateGuestId(req);
  }
  next();
}

// Use userId or guestId for cart actions
router.get("/cart", ensureUserOrGuest, async (req, res) => {
  const userId = req.session.user && (req.session.user.id || req.session.user._id) || req.session.guestId;
  if (!userId) {
    return res.redirect("/login");
  }
  const cart = await Cart.findOne({ userId }).populate('items.productId');
  res.render("cart", { 
    cart: cart || { items: [] },
    promoCode: req.session.promoCode,
    discountedTotal: req.session.discountedTotal,
    error: req.session.error,
    discountedTotal: req.session.discountedTotal || null,
    error: req.session.error,
    promoCode: req.session.promoCode
  });
  // Clear flash messages
  delete req.session.error;
});

// Add to Cart
router.post("/cart/add", ensureUserOrGuest, async (req, res) => {
  const userId = req.session.user && (req.session.user.id || req.session.user._id) || req.session.guestId;
  if (!userId) {
    return res.redirect("/login");
  }
  const { productId, quantity, selectedColor } = req.body;
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({
      userId,
      items: [{
        productId,
        quantity: parseInt(quantity) || 1,
        selectedColor
      }]
    });
  } else {
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId && item.selectedColor === selectedColor
    );
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += parseInt(quantity);
    } else {
      cart.items.push({ productId, quantity: parseInt(quantity), selectedColor });
    }
    await cart.save();
  }
  res.redirect("/cart");
});

// Update Quantity
router.post("/cart/update/:itemId", ensureUserOrGuest, async (req, res) => {
  const userId = req.session.user && (req.session.user.id || req.session.user._id) || req.session.guestId;
  const { quantity } = req.body;
  const cart = await Cart.findOne({ userId });
  if (cart) {
    const itemIndex = cart.items.findIndex(item => item._id.toString() === req.params.itemId);
    if (itemIndex > -1) {
      const newQuantity = parseInt(quantity);
      if (newQuantity > 0) {
        cart.items[itemIndex].quantity = newQuantity;
        await cart.save();
      } else {
        // Remove item if quantity is 0 or negative
        cart.items.splice(itemIndex, 1);
        await cart.save();
        if (cart.items.length === 0) {
          // Clear promo code data if cart is empty
          delete req.session.promoApplied;
          delete req.session.discountedTotal;
          delete req.session.promoCode;
        }
      }
    }
  }
  res.redirect("/cart");
});

// Remove Item from Cart
router.get("/cart/remove/:id", ensureUserOrGuest, async (req, res) => {
  const userId = req.session.user && (req.session.user.id || req.session.user._id) || req.session.guestId;
  const cart = await Cart.findOne({ userId });
  if (cart) {
    cart.items = cart.items.filter(item => item._id.toString() !== req.params.id);
    await cart.save();
    if (cart.items.length === 0) {
      // Clear promo code data if cart is empty
      delete req.session.promoApplied;
      delete req.session.discountedTotal;
      delete req.session.promoCode;
    }
  }
  res.redirect("/cart");
});

module.exports = router;