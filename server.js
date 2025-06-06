const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const i18nextMiddleware = require('i18next-http-middleware');
const i18next = require('./config/i18n');
require("dotenv").config();

const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/images'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Make upload middleware available to routes
app.locals.upload = upload;

// --- ROUTES ---
const indexRoutes = require("./routes/indexRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const pageRoutes = require("./routes/pageRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const cartRoutes = require("./routes/cartRoutes"); // <-- Added
const wishlistRoutes = require("./routes/wishlistRoutes"); // <-- Added wishlist routes
const promoRoutes = require("./routes/promoRoutes"); // <-- Added promo routes

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(i18nextMiddleware.handle(i18next));

// Add language direction middleware
app.use((req, res, next) => {
  res.locals.isRTL = req.language === 'ar';
  res.locals.currentLanguage = req.language;
  next();
});

// MongoDB Connection with enhanced error handling
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB Atlas');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Session configuration with secure settings
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
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
app.use(promoRoutes); // <-- Added promo routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: 'Something broke!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Export for Vercel
module.exports = app;

// Start server only in development
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
