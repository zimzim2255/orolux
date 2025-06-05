const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// Learn More Pages
router.get("/watches/patek-philippe-1579", (req, res) => {
  res.render("learn-more", { user: req.session.user });
});

router.get("/watches/rolex-day-date-1803", (req, res) => {
  res.render("day-date-1803", { user: req.session.user });
});

router.get("/products", async (req, res) => {
  try {
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
    res.render("products", { 
      products, 
      user: req.session.user,
      searchQuery
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.render("products", { 
      products: [], 
      user: req.session.user,
      searchQuery: req.query.search
    });
  }
});

router.get("/product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .render("product-details", { product: null, user: req.session.user });
    }
    res.render("product-details", { product, user: req.session.user });
  } catch (error) {
    console.error("Error fetching product:", error);
    res
      .status(404)
      .render("product-details", { product: null, user: req.session.user });
  }
});

// Add comment to product
router.post("/product/:id/add-comment", async (req, res) => {
  const { username, text } = req.body;
  await Product.findByIdAndUpdate(req.params.id, {
    $push: {
      comments: {
        username,
        text,
        createdAt: new Date(),
      },
    },
  });
  res.redirect(`/product/${req.params.id}`);
});

// Add new route for search suggestions
router.get("/products/suggestions", async (req, res) => {
  try {
    const searchQuery = req.query.search;
    if (!searchQuery || searchQuery.length < 2) {
      return res.json([]);
    }

    const suggestions = await Product.find({
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ]
    })
    .select('name price') // Only get name and price for suggestions
    .limit(5); // Limit to 5 suggestions

    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.json([]);
  }
});

// Learn More Pages
router.get("/learn-more", (req, res) => {
  res.render("learn-more", { user: req.session.user });
});

router.get("/day-date-1803", (req, res) => {
  res.render("day-date-1803", { user: req.session.user });
});

module.exports = router;