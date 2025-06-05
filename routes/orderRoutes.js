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
      const itemTotal = item.quantity * item.productId.price;
      total += itemTotal;
      return {
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price
      };
    });

    // Create order
    const order = new Order({
      deliveryInfo: req.body,
      userId: userId,
      products: products,
      total: total,
      status: "Pending"
    });

    await order.save();

    // Update user's totalSpent
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $inc: { totalSpent: total }
      });
    }

    // Clear the cart
    await Cart.deleteMany({ userId });

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