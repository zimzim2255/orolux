const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const cloudinary = require('cloudinary').v2;
const multer = require("multer");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Middleware to protect admin routes
function ensureAdmin(req, res, next) {
  if (!req.session.admin) return res.redirect("/admin/login");
  next();
}

// Admin Products List
router.get("/admin/products", ensureAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.render("admin/products", { products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.render("admin/products", { products: [], error: "Error fetching products" });
  }
});

// Show Add Product Form
router.get("/admin/add-product", ensureAdmin, (req, res) => {
  res.render("admin/add-products");
});

// Handle Add Product with Image Upload
router.post("/admin/add-product", ensureAdmin, upload.single('image'), async (req, res) => {
  try {
    // Upload image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'products',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      // Convert buffer to stream and pipe to Cloudinary
      const bufferStream = require('stream').Readable.from(req.file.buffer);
      bufferStream.pipe(uploadStream);
    });

    // Create new product with Cloudinary URL
    const product = new Product({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      image: result.secure_url // Use the Cloudinary secure URL
    });

    await product.save();
    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error adding product:", error);
    res.render("admin/add-products", { 
      error: "Error adding product", 
      product: req.body 
    });
  }
});

// Show Edit Product Form
router.get("/admin/edit-product/:id", ensureAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.render("admin/edit-product", { product });
  } catch (error) {
    res.redirect("/admin/products");
  }
});

// Handle Edit Product
router.post("/admin/edit-product/:id", ensureAdmin, upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw new Error("Product not found");

    let imageUrl = product.image; // Keep existing image by default

    // If new image uploaded, update it on Cloudinary
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'products',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        
        const bufferStream = require('stream').Readable.from(req.file.buffer);
        bufferStream.pipe(uploadStream);
      });
      
      imageUrl = result.secure_url;
    }

    // Update product
    await Product.findByIdAndUpdate(req.params.id, {
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      image: imageUrl
    });

    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error updating product:", error);
    res.render("admin/edit-product", { 
      error: "Error updating product", 
      product: { ...req.body, _id: req.params.id } 
    });
  }
});

// Delete Product
router.get("/admin/delete-product/:id", ensureAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error deleting product:", error);
    res.redirect("/admin/products");
  }
});

module.exports = router;
