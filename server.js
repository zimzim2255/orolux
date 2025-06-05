const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const i18nextMiddleware = require('i18next-http-middleware');
const i18next = require('./config/i18n');
require("dotenv").config();
const app = express();

// --- ROUTES ---
const indexRoutes = require("./routes/indexRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const pageRoutes = require("./routes/pageRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const cartRoutes = require("./routes/cartRoutes"); // <-- Added
const wishlistRoutes = require("./routes/wishlistRoutes"); // <-- Added wishlist routes

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(i18nextMiddleware.handle(i18next));
app.set("view engine", "ejs");

// Add language direction middleware
app.use((req, res, next) => {
  res.locals.isRTL = req.language === 'ar';
  res.locals.currentLanguage = req.language;
  next();
});

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

// Add user to locals middleware
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Route middleware
app.use("/", indexRoutes);

// Register routes
app.use(productRoutes);
app.use(orderRoutes);
app.use(pageRoutes);
app.use(adminRoutes);
app.use(userRoutes);
app.use(cartRoutes); // <-- Added
app.use(wishlistRoutes); // <-- Added wishlist routes

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Render homepage
app.get("/", (req, res) => {
  res.render("index", {
    title: "Orolux - Luxury Watches",
    navItems: ["Home", "Collection", "Couture", "Journal", "Contact"]
  });
});

// Start Server
const PORT = process.env.PORT || 5501;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
