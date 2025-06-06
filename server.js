const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const multer = require("multer");
const path = require("path");
const cloudinary = require('cloudinary').v2;
const i18nextMiddleware = require('i18next-http-middleware');
const i18next = require('./config/i18n');
require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();

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
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  }
});

// Make upload middleware available to routes with Cloudinary handling
app.locals.upload = upload;
app.locals.uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "orolux-store" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};

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

// Initialize i18next middleware
app.use(i18nextMiddleware.handle(i18next));

// Add language middleware to set up translation function and RTL
app.use((req, res, next) => {
  res.locals.t = req.t;
  res.locals.isRTL = req.language === 'ar';
  res.locals.currentLanguage = req.language || 'en';
  next();
});

// MongoDB Connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
    });
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};
connectDB();

// Session configuration with secure settings
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 24 * 60 * 60, // 1 day
    autoRemove: 'native'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // trust first proxy for Vercel
  sessionConfig.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionConfig));

// Static files with caching
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true
}));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Body parser with increased limit for file uploads
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

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

// Enhanced error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).render('error', {
        message: 'File is too large. Maximum size is 5MB.',
        error: {}
      });
    }
    return res.status(400).render('error', {
      message: 'File upload error.',
      error: {}
    });
  }

  // Handle 404
  if (err.status === 404) {
    return res.status(404).render('error', {
      message: 'Page not found',
      error: {}
    });
  }

  // Handle other errors
  res.status(err.status || 500).render('error', {
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message,
    error: process.env.NODE_ENV === 'production' ? {} : err
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
