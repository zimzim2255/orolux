const express = require("express");
const router = express.Router();
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

// Middleware to protect user routes
function ensureUser(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// View Wish List
router.get("/wishlist", ensureUser, async (req, res) => {
  try {
    const wishlistItems = await Wishlist.find({ userId: req.session.user.id }).populate("productId");
    const wishlist = wishlistItems.map(item => ({
      _id: item._id,
      product: item.productId
    }));
    res.render("wishlist", { wishlist, user: req.session.user });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.render("wishlist", { wishlist: [], user: req.session.user });
  }
});

// Add to Wish List
router.get("/wishlist/add/:productId", ensureUser, async (req, res) => {
  const { productId } = req.params;

  try {
    // Try to add product to wishlist
    await Wishlist.findOneAndUpdate(
      { userId: req.session.user.id, productId },
      {},
      { upsert: true, new: true }
    );
  } catch (err) {
    console.log("Already in wish list or error:", err.message);
  }

  res.redirect("/wishlist");
});

// Remove from Wish List
router.get("/wishlist/remove/:itemId", ensureUser, async (req, res) => {
  await Wishlist.findByIdAndDelete(req.params.itemId);
  res.redirect("/wishlist");
});

module.exports = router;