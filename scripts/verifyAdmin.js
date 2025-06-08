const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const AdminUser = require("../models/AdminUser");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const admin = await AdminUser.findOne({ email: "orolux.store1@gmail.com" });
    if (admin) {
      console.log("Admin account found!");
      console.log("Email:", admin.email);
      
      // Test password
      const testPassword = "Q!7v9z$Lp2@eR4wX";
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
  }
  mongoose.disconnect();
});
