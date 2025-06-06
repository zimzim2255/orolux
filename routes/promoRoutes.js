const express = require("express");
const router = express.Router();
const PromoCode = require("../models/PromoCode");
const Cart = require("../models/Cart");

// Middleware to protect user routes
function ensureUser(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// Apply Promo Code
router.post("/cart/apply-promo", ensureUser, async (req, res) => {
  try {
    const { promoCode } = req.body;    if (!promoCode || typeof promoCode !== 'string') {
      req.session.error = "Please enter a valid promo code";
      return res.redirect("/cart");
    }

    // Find promo code in DB (case insensitive)
    const code = await PromoCode.findOne({ 
      code: { $regex: new RegExp('^' + promoCode + '$', 'i') }
    });

    if (!code) {
      req.session.error = "Invalid promo code";
      return res.redirect("/cart");
    }

    if (code.expiresAt && code.expiresAt < new Date()) {
      req.session.error = "This promo code has expired";
      return res.redirect("/cart");
    }

    // Check if discount percentage is valid
    if (!code.discountPercent || code.discountPercent <= 0 || code.discountPercent >= 100) {
      req.session.error = "Invalid discount configuration";
      return res.redirect("/cart");
    }const userId = req.session.user && (req.session.user.id || req.session.user._id);
    const cartItems = await Cart.find({ userId }).populate("productId");

    if (!cartItems || cartItems.length === 0) {
      req.session.error = "Your cart is empty";
      return res.redirect("/cart");
    }

    // Calculate total
    let grandTotal = cartItems.reduce((sum, item) => {
      // Check if product exists and has a price
      if (!item.productId || typeof item.productId.price !== 'number') {
        throw new Error('Invalid product in cart');
      }
      return sum + (item.productId.price * item.quantity);
    }, 0);

    // Apply discount
    const discount = code.discountPercent / 100;
    const discountedTotal = grandTotal * (1 - discount);

    req.session.promoApplied = true;
    req.session.discountedTotal = discountedTotal;
    req.session.promoCode = promoCode;

    res.redirect("/cart");
  } catch (error) {
    console.error('Error applying promo code:', error);
    req.session.error = "An error occurred while applying the promo code";
    res.redirect("/cart");
  }
});

module.exports = router;