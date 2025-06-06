const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/Users");

router.get("/checkout", (req, res) => {
  res.render("checkout", { user: req.session.user });
});

router.post("/order", async (req, res) => {
  try {
    const userId = req.session.user?.id || req.session.user?._id;
      // Get cart items
    const cartItems = await Cart.find({ userId }).populate('productId');
    
    // Calculate total
    let total = 0;
    const products = cartItems.map(item => {
      if (!item.productId || typeof item.productId.price !== 'number') {
        throw new Error('Invalid product in cart');
      }
      const itemTotal = Number(item.quantity) * Number(item.productId.price);
      total += itemTotal;
      return {
        productId: item.productId._id,
        quantity: Number(item.quantity),
        price: Number(item.productId.price)
      };
    });    // Use discounted total if promo code was applied
    const finalTotal = req.session.discountedTotal || total;

    // Create order
    const order = new Order({
      deliveryInfo: req.body,
      userId: userId,
      products: products,
      total: finalTotal,
      promoCode: req.session.promoCode,
      originalTotal: total,
      status: "Pending"
    });

    await order.save();    // Update user's totalSpent - don't update on order creation since it starts as Pending
    if (userId) {
      const user = await User.findById(userId);
      if (!user.totalSpent) {
        await User.findByIdAndUpdate(userId, { $set: { totalSpent: 0 } });
      }
    }// Clear the cart
    await Cart.deleteMany({ userId });

    // Clear promo code data
    delete req.session.promoApplied;
    delete req.session.discountedTotal;
    delete req.session.promoCode;

    res.redirect("/order-success");
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).send("Error creating order");
  }
});

router.get("/order-success", (req, res) => {
  res.render("order-success", { user: req.session.user });
});

module.exports = router;