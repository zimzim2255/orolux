const mongoose = require("mongoose");
const AdminUser = require("../models/AdminUser");
require("dotenv").config();

async function createNewAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Remove all existing admin users
    await AdminUser.deleteMany({});
      // Create new admin
    const admin = new AdminUser({
      email: "orolux.store1@gmail.com",
      password: "Orolux@2025#Store", // Strong password with uppercase, lowercase, numbers and special chars
      loginAttempts: 0,
      isLocked: false
    });
    
    await admin.save();
    console.log("New admin account created successfully!");
    console.log("Login credentials:");
    console.log("Email: admin@orolux.com");
    console.log("Password: Admin@123456");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

createNewAdmin();
