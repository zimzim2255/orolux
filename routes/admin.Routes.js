const express = require("express");
const router = express.Router();
const AdminUser = require("../models/AdminUser");
const bcrypt = require("bcrypt");
const PageContent = require("../models/PageContent");
const Order = require("../models/Order");

// Middleware to protect admin routes
function ensureAdmin(req, res, next) {
  if (!req.session.admin) return res.redirect("/admin/login");
  next();
}

// Admin Login
router.get("/admin/login", (req, res) => {
  res.render("admin-login");
});

router.post("/admin/login", async (req, res) => {
  try {
    const admin = await AdminUser.findOne({ email: req.body.email });
    if (admin && await bcrypt.compare(req.body.password, admin.password)) {
      req.session.admin = admin;
      res.json({ success: true });
    } else {
      res.send("Invalid Credentials");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Admin Dashboard
router.get("/admin/dashboard", ensureAdmin, (req, res) => {
  res.render("admin/dashboard");
});

// Edit About / Terms / Contact
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

// View Orders
router.get("/admin/orders", ensureAdmin, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.render("admin/orders", { orders });
});

module.exports = router;