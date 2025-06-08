const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const AdminUser = require("../models/AdminUser");
require("dotenv").config();

async function verifyNewAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const admin = await AdminUser.findOne({ email: "admin@orolux.com" });
    if (admin) {
      console.log("Admin account found!");
      console.log("Email:", admin.email);
      
      // Test password
      const testPassword = "Admin@123456";
      const passwordMatch = await bcrypt.compare(testPassword, admin.password);
      console.log("Password match:", passwordMatch);
      
      // Show account status
      console.log("Account status:");
      console.log("- Is locked:", admin.isLocked);
      console.log("- Login attempts:", admin.loginAttempts);
      console.log("- Lock until:", admin.lockUntil);
    } else {
      console.log("Admin account not found!");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyNewAdmin();
