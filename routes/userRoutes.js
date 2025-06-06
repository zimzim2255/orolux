const express = require("express");
const router = express.Router();
const User = require("../models/Users");
const Order = require("../models/Order");
const Product = require("../models/Product");
const bcrypt = require("bcrypt");

// Middleware to protect user routes
function ensureUser(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// User Profile
router.get("/profile", ensureUser, async (req, res) => {
  // Get full user data
  const user = await User.findById(req.session.user.id);

  // Get user's orders with populated product data
  const orders = await Order.find({ userId: user._id })
    .populate('products.productId')
    .sort({ createdAt: -1 });

  res.render("profile", { user, orders });
});

// Change Email
router.post("/profile/change-email", ensureUser, async (req, res) => {
  const { newEmail } = req.body;

  try {
    // Check if email is already taken
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== req.session.user.id) {
      return res.status(400).json({ error: "Email already in use" });
    }

    await User.findByIdAndUpdate(req.session.user.id, { email: newEmail });
    req.session.user.email = newEmail;

    res.redirect("/profile");
  } catch (error) {
    console.error("Error changing email:", error);
    res.status(500).json({ error: "Error updating email" });
  }
});

// Change Password
router.post("/profile/change-password", ensureUser, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  try {
    const user = await User.findById(req.session.user.id);

    // Check current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid current password" });
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Save updated password
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    res.json({ message: "Password changed successfully!" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Error updating password" });
  }
});

// Show Register Form
router.get("/register", (req, res) => {
  res.render("register", {
    t: req.t,
    language: req.language,
    isRTL: req.language === 'ar'
  });
});

// Handle Registration
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.send("Email already taken");
  }
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  // Save user to DB
  const newUser = new User({
    username,
    email,
    password: hashedPassword
  });
  await newUser.save();
  // Set session
  req.session.user = { id: newUser._id, email: newUser.email, username: newUser.username };
  res.redirect("/profile");
});

// Show Login Form
router.get("/login", (req, res) => {
  res.render("login");
});

// Handle Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.send("User not found");
  }
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.send("Invalid Password");
  }  // Save user in session
  req.session.user = { id: user._id, email: user.email, username: user.username };
  res.redirect("/products");
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;