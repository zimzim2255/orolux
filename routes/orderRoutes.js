const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/Users");

function ensureUserOrGuest(req, res, next) {
  if (!req.session.user && !req.session.guestId) {
    return res.redirect("/login");
  }
  next();
}

router.get("/checkout", ensureUserOrGuest, (req, res) => {
  res.render("checkout", { user: req.session.user });
});

router.post("/order", ensureUserOrGuest, async (req, res) => {
  try {
    const userId = req.session.user?.id || req.session.user?._id || req.session.guestId;
    // Get cart items
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).send("Your cart is empty");
    }
    // Calculate total
    let total = 0;
    const products = cart.items.map(item => {
      if (!item.productId || typeof item.productId.price !== 'number') {
        throw new Error('Invalid product in cart');
      }
      const itemTotal = Number(item.quantity) * Number(item.productId.price);
      total += itemTotal;
      return {
        productId: item.productId._id,
        quantity: Number(item.quantity),
        price: Number(item.productId.price),
        selectedColor: item.selectedColor
      };
    });
    // Use discounted total if promo code was applied
    const finalTotal = req.session.discountedTotal || total;
    // Create order
    const order = new Order({
      deliveryInfo: req.body,
      userId: req.session.user ? userId : undefined, // Only set userId if registered
      products: products,
      total: finalTotal,
      promoCode: req.session.promoCode,
      originalTotal: total,
      status: "Pending"
    });
    await order.save();
    // Clear the cart
    await Cart.deleteMany({ userId });
    // Clear promo code data
    delete req.session.promoApplied;
    delete req.session.discountedTotal;
    delete req.session.promoCode;
    // If guest, clear guestId after order
    if (req.session.guestId && !req.session.user) {
      delete req.session.guestId;
    }
    res.redirect("/order-success");
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).send("Error creating order");
  }
});

router.get("/order-success", (req, res) => {
  res.render("order-success", { user: req.session.user });
});

// Get order details
router.get("/order/:id", async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).populate('products.productId');

    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Check if the order belongs to the current user or if user is admin
    const isAdmin = req.session.isAdmin;
    const userId = req.session.user?.id || req.session.user?._id || req.session.guestId;

    if (!isAdmin && order.userId.toString() !== userId) {
      return res.status(403).send("You don't have permission to view this order");
    }

    res.render("order-details", { 
      order,
      user: req.session.user
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).send("Error fetching order details");
  }
});

module.exports = router;