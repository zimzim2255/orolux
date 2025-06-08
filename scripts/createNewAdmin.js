const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const AdminUser = require("../models/AdminUser");
require("dotenv").config();

async function createNewAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Delete existing admin if any
    await AdminUser.deleteOne({ email: "admin@orolux.com" });
    
    // Create new password hash
    const password = "Admin@123456";
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new admin
    const admin = new AdminUser({
      email: "admin@orolux.com",
      password: hashedPassword,
      loginAttempts: 0,
      isLocked: false,
      lockUntil: null
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
