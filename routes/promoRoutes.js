const express = require("express");
const router = express.Router();
const PromoCode = require("../models/PromoCode");
const Cart = require("../models/Cart");

// Remove ensureUser from promoRoutes and allow guests to apply promo codes
function getOrCreateGuestId(req) {
  if (!req.session.guestId) {
    req.session.guestId = `guest_${Date.now()}_${Math.floor(Math.random()*10000)}`;
  }
  return req.session.guestId;
}

function ensureUserOrGuest(req, res, next) {
  if (!req.session.user && !req.session.guestId) {
    getOrCreateGuestId(req);
  }
  next();
}

// Apply Promo Code
router.post("/cart/apply-promo", ensureUserOrGuest, async (req, res) => {
  try {
    const { promoCode } = req.body;
    if (!promoCode || typeof promoCode !== 'string') {
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
    }    const userId = req.session.user && (req.session.user.id || req.session.user._id) || req.session.guestId;
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart || !cart.items || cart.items.length === 0) {
      req.session.error = "Your cart is empty";
      return res.redirect("/cart");
    }

    // Calculate total
    let grandTotal = cart.items.reduce((sum, item) => {
      // Check if product exists and has a price
      if (!item.productId || typeof item.productId.price !== 'number') {
        throw new Error('Invalid product in cart');
      }
      return sum + (item.productId.price * item.quantity);
    }, 0);

    // Apply discount
    const discount = code.discountPercent / 100;
    const discountedTotal = grandTotal * (1 - discount);

    // Store promo code info in session
    req.session.promoApplied = true;
    req.session.discountedTotal = discountedTotal;
    req.session.promoCode = promoCode;

    // Clear any previous errors
    delete req.session.error;

    res.redirect("/cart");
  } catch (error) {
    console.error('Error applying promo code:', error);
    req.session.error = "An error occurred while applying the promo code";
    res.redirect("/cart");
  }
});

module.exports = router;