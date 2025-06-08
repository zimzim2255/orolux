const express = require("express");
const router = express.Router();
const fs = require('fs');
const path = require('path');
const User = require("../models/Users");
const Order = require("../models/Order");
const Product = require("../models/Product");
const PageContent = require("../models/PageContent");
const AdminUser = require("../models/AdminUser");
const Message = require("../models/Message");
const PromoCode = require("../models/PromoCode");
const bcrypt = require("bcrypt");

// Middleware to protect admin routes
function ensureAdmin(req, res, next) {
  if (!req.session.admin) return res.redirect("/admin/login");
  next();
}

// Admin Login Routes
router.get("/admin/login", (req, res) => {
  res.render("admin-login");
});

router.post("/admin/login", async (req, res) => {
  try {
    const admin = await AdminUser.findOne({ email: req.body.email });
    
    // Check if account is locked
    if (admin && admin.isLocked) {
      if (admin.lockUntil && admin.lockUntil > new Date()) {
        return res.status(403).send("Account is locked. Please try again later.");
      } else {
        // Reset lock if lockUntil has expired
        admin.isLocked = false;
        admin.loginAttempts = 0;
        await admin.save();
      }
    }

    if (admin && (await bcrypt.compare(req.body.password, admin.password))) {
      // Reset login attempts on successful login
      admin.loginAttempts = 0;
      admin.isLocked = false;
      admin.lockUntil = null;
      await admin.save();
      
      req.session.admin = admin;
      res.json({ success: true });
    } else {
      if (admin) {
        // Increment login attempts
        admin.loginAttempts += 1;
        
        // Lock account if attempts exceed 5
        if (admin.loginAttempts >= 5) {
          admin.isLocked = true;
          admin.lockUntil = new Date(Date.now() + 30 * 60000); // Lock for 30 minutes
          await admin.save();
          return res.status(403).send("Account locked for 30 minutes due to too many failed attempts.");
        }
        
        await admin.save();
      }
      res.status(401).send("Invalid Credentials");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Admin Dashboard
router.get("/admin/dashboard", ensureAdmin, async (req, res) => {
  const totalMessages = await Message.countDocuments();
  const totalOrders = await Order.countDocuments();
  const totalUsers = await User.countDocuments();
  res.render("admin/dashboard", {
    totalMessages,
    totalOrders,
    totalUsers
  });
});

// Analytics Dashboard
router.get("/admin/analytics", ensureAdmin, async (req, res) => {  // Total Sales
  const totalOrders = await Order.find();
  let totalSales = totalOrders.reduce((sum, order) => {
    // Only add if order.total is a valid number
    return sum + (typeof order.total === 'number' ? order.total : 0);
  }, 0);

  // Total Users
  const totalUsers = await User.countDocuments();

  // Total Orders & Pending Orders
  const allOrders = await Order.find();
  const pendingOrders = allOrders.filter((o) => o.status === "Pending").length;
  // Monthly Order Count
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // Get last 6 months including current

  const monthlyOrders = await Order.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const months = [];
  const orderCounts = [];
  
  // Fill in all months, including those with no orders
  const currentDate = new Date();
  for (let i = 0; i < 6; i++) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - i);
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    // Find if we have orders for this month
    const monthData = monthlyOrders.find(item => 
      item._id.year === year && item._id.month === month
    );
    
    // Format month name
    const monthName = date.toLocaleString('default', { month: 'short' });
    
    // Add in reverse order so most recent is last
    months.unshift(monthName);
    orderCounts.unshift(monthData ? monthData.count : 0);
  }

  // Top Selling Products
  const topProducts = await Product.aggregate([
    {
      $lookup: {
        from: "orders",
        localField: "_id",
        foreignField: "products.productId",
        as: "orders",
      },
    },
    {
      $addFields: {
        totalQuantity: {
          $sum: {
            $map: {
              input: "$orders",
              as: "order",
              in: {
                $sum: "$$order.products.quantity",
              },
            },
          },
        },
      },
    },
    {
      $project: {
        name: 1,
        totalQuantity: 1,
        totalPrice: { $multiply: ["$price", "$totalQuantity"] },
      },
    },
    { $sort: { totalPrice: -1 } },
    { $limit: 5 },
  ]);

  const topProductList = topProducts.map((p) => ({
    name: p.name,
    totalQuantity: p.totalQuantity || 0,
    totalRevenue: p.totalPrice || 0,
  }));

  // Send to view
  res.render("admin/dashboard-analytics", {
    totalSales: totalSales.toFixed(2),
    totalUsers,
    totalOrders: allOrders.length,
    pendingOrders,
    months: months,
    orderCounts: orderCounts,
    topProducts: topProductList,
  });
});

// View All Users
router.get("/admin/users", ensureAdmin, async (req, res) => {
  const searchQuery = req.query.search;
  let query = {};
  
  if (searchQuery) {
    query = {
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ]
    };
  }

  // Get users with their orders
  const users = await User.find(query);
  
  // Get orders for each user
  const usersWithOrders = await Promise.all(users.map(async (user) => {
    const allOrders = await Order.find({ userId: user._id });
    const completedOrders = allOrders.filter(order => order.status === "Completed");
    return {
      ...user.toObject(),
      totalOrders: allOrders.length,
      completedOrders: completedOrders
    };
  }));

  res.render("admin/users", { users: usersWithOrders });
});

// Edit User Form
router.get("/admin/edit-user/:id", ensureAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);  res.render("admin/edit-user", { user });
});

// Update User Info
router.post("/admin/update-user/:id", ensureAdmin, async (req, res) => {
  const { username, email, totalSpent } = req.body;
  await User.findByIdAndUpdate(req.params.id, { username, email, totalSpent });
  res.redirect("/admin/users");
});

// Delete User
router.get("/admin/delete-user/:id", ensureAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect("/admin/users");
});

// View All Products
router.get("/admin/products", ensureAdmin, async (req, res) => {
  const searchQuery = req.query.search;
  let query = {};
  
  if (searchQuery) {
    query = {
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ]
    };
  }

  const products = await Product.find(query);
  res.render("admin/products", { products, searchQuery });
});

// Add Product Form
router.get("/admin/add-product", ensureAdmin, (req, res) => {
  res.render("admin/add-products", { error: null });
});

// Save New Product
router.post("/admin/add-product", ensureAdmin, async (req, res) => {
  try {
    const upload = req.app.locals.upload;
    
    upload.single('image')(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.render("admin/add-products", { 
          error: 'Error uploading image: ' + err.message 
        });
      }

      try {
        // Validate required fields
        if (!req.body.name || !req.body.price || !req.body.description || !req.file) {
          return res.render("admin/add-products", { 
            error: 'Please fill in all required fields and upload an image'
          });
        }

        let imageUrl = '';
        if (req.file) {
          const result = await req.app.locals.uploadToCloudinary(req.file);
          imageUrl = result.secure_url;
        }

        const productData = {
          name: req.body.name,
          price: parseFloat(req.body.price),
          description: req.body.description,
          image: imageUrl
        };

        const product = new Product(productData);
        await product.save();
        res.redirect("/admin/products");
      } catch (error) {
        console.error('Product creation error:', error);
        res.render("admin/add-products", { 
          error: 'Error creating product: ' + error.message 
        });
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    res.render("admin/add-products", { 
      error: 'Server error: ' + error.message 
    });
  }
});

// Edit Product Form
router.get("/admin/edit-product/:id", ensureAdmin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.render("admin/edit-product", { product });
});

// Update Product
router.post("/admin/update-product/:id", ensureAdmin, async (req, res) => {
  try {
    const upload = req.app.locals.upload;
    
    upload.single('image')(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).send(err.message);
      }

      try {
        const product = await Product.findById(req.params.id);
        if (!product) {
          return res.status(404).send("Product not found");
        }

        // If a new file was uploaded, update the image
        if (req.file) {
          const result = await req.app.locals.uploadToCloudinary(req.file);
          product.image = result.secure_url;
        }

        // Update other fields
        Object.assign(product, {
          ...req.body,
          image: product.image // Keep the updated image URL
        });

        await product.save();
        res.redirect("/admin/products");
      } catch (error) {
        console.error('Product update error:', error);
        res.status(500).send("Error updating product");
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating product");
  }
});

// Delete Product
router.get("/admin/delete-product/:id", ensureAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting product");
  }
});

// Edit Pages (About/Terms/Contact)
router.get("/admin/pages", ensureAdmin, async (req, res) => {
  const about = await PageContent.findOne({ page: "about" });
  const terms = await PageContent.findOne({ page: "terms" });
  const contact = await PageContent.findOne({ page: "contact" });
  res.render("admin/pages", { about, terms, contact });
});

router.post("/admin/pages", ensureAdmin, async (req, res) => {
  const { page, content } = req.body;
  await PageContent.findOneAndUpdate({ page }, { content }, { upsert: true });
  res.redirect("/admin/pages");
});

// View All Comments
router.get("/admin/comments", ensureAdmin, async (req, res) => {
  const products = await Product.find().select("name comments");
  let allComments = [];
  products.forEach((product) => {
    if (product.comments) {
      product.comments.forEach((comment, index) => {
        allComments.push({
          productId: product._id,
          productName: product.name,
          username: comment.username,
          text: comment.text,
          createdAt: comment.createdAt,
          index: index,
        });
      });
    }
  });
  res.render("admin/comments", { comments: allComments });
});

// Delete Comment
router.get(
  "/admin/delete-comment/:productId/:index",
  ensureAdmin,
  async (req, res) => {
    const { productId, index } = req.params;
    const product = await Product.findById(productId);
    if (product && product.comments && product.comments[index]) {
      product.comments.splice(index, 1);
      await product.save();
    }
    res.redirect("/admin/comments");
  }
);  // View Orders
router.get("/admin/orders", ensureAdmin, async (req, res) => {
  const searchQuery = req.query.search;
  let query = {};

  if (searchQuery) {
    query = {
      $or: [
        { _id: searchQuery.match(/^[0-9a-fA-F]{24}$/) ? searchQuery : null },
        { "deliveryInfo.name": { $regex: searchQuery, $options: 'i' } },
        { "deliveryInfo.email": { $regex: searchQuery, $options: 'i' } }
      ]
    };
  }

  const orders = await Order.find(query)
    .populate({
      path: 'products.productId',
      select: 'name price'
    })
    .sort({ createdAt: -1 });
  res.render("admin/orders", { orders, searchQuery });
});

// Update Order Status
// Delete Order
router.get("/admin/orders/delete/:id", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    
    // If the order is completed, update user's totalSpent
    if (order.status === "Completed" && order.userId) {
      await User.findByIdAndUpdate(order.userId, {
        $inc: { totalSpent: -(order.total || 0) },
        $pull: { completedOrders: order._id }
      });
    }
    
    await Order.findByIdAndDelete(id);
    res.redirect("/admin/orders");
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).send("Error deleting order");
  }
});

// Update Order Status
router.post("/admin/orders/:id/status", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await Order.findById(id);
    const oldStatus = order.status;
    order.status = status;
    await order.save();
    
    if (order.userId) {
      const user = await User.findById(order.userId);
        // Handle completion status
      if (status === "Completed") {
        // Only update if not already in completedOrders
        if (!user.completedOrders || !user.completedOrders.includes(order._id)) {
          // Add to completed orders and update total spent
          await User.findByIdAndUpdate(order.userId, {
            $push: { completedOrders: order._id },
            $inc: { totalSpent: Number(order.total) || 0 }
          });
        }
      } 
      // Handle cancellation
      else if (status === "Cancelled" && oldStatus === "Completed") {
        // Remove from completed orders and reduce total spent
        await User.findByIdAndUpdate(order.userId, {
          $pull: { completedOrders: order._id },
          $inc: { totalSpent: -(order.total || 0) }
        });
      }
      // Handle moving back to completed from cancelled
      else if (status === "Completed" && oldStatus === "Cancelled") {
        // Add back to completed orders and update total spent
        await User.findByIdAndUpdate(order.userId, {
          $push: { completedOrders: order._id },
          $inc: { totalSpent: order.total || 0 }
        });
      }
    }
    
    res.redirect("/admin/orders");
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).send("Error updating order status");
  }
});

// Recalculate All Users' Total Spent
router.get("/admin/recalculate-totals", ensureAdmin, async (req, res) => {
  try {
    const users = await User.find();
    
    for (const user of users) {
      // Get all completed orders for this user
      const completedOrders = await Order.find({
        userId: user._id,
        status: "Completed"
      });
      
      // Calculate total spent from completed orders
      const totalSpent = completedOrders.reduce((sum, order) => {
        return sum + (Number(order.total) || 0);
      }, 0);
      
      // Update user
      await User.findByIdAndUpdate(user._id, {
        $set: { 
          totalSpent,
          completedOrders: completedOrders.map(order => order._id)
        }
      }, { new: true });
    }
    
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error recalculating totals:", error);
    res.status(500).send("Error recalculating totals");
  }
});

// View All Messages
router.get("/admin/messages", ensureAdmin, async (req, res) => {
  const messages = await Message.find().sort({ createdAt: -1 });
  res.render("admin/messages", { messages });
});

// Delete Message
router.get("/admin/messages/delete/:id", ensureAdmin, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.redirect("/admin/messages");
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).send("Error deleting message");
  }
});

// View All Promo Codes
router.get("/admin/promo-codes", ensureAdmin, async (req, res) => {
  const promoCodes = await PromoCode.find();
  res.render("admin/promo-codes", { promoCodes });
});

// Add Promo Code Form
router.get("/admin/add-promo", ensureAdmin, (req, res) => {
  res.render("admin/add-promo");
});

// Save New Promo Code
router.post("/admin/add-promo", ensureAdmin, async (req, res) => {
  const newCode = new PromoCode(req.body);
  await newCode.save();
  res.redirect("/admin/promo-codes");
});

// Delete Promo Code
router.get("/admin/delete-promo/:id", ensureAdmin, async (req, res) => {
  await PromoCode.findByIdAndDelete(req.params.id);
  res.redirect("/admin/promo-codes");
});

module.exports = router;