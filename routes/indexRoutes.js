const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

router.get("/", async (req, res) => {
  try {
    // Fetch the 6 most recent products for New Arrivals
    const newArrivals = await Product.find()
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .limit(6); // Get 6 products

    res.render("index", { 
      newArrivals,
      user: req.session.user
    });
  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    res.render("index", { 
      newArrivals: [],
      user: req.session.user
    });
  }
});

module.exports = router;
