const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const AdminUser = require("../models/AdminUser");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const admin = await AdminUser.findOne({ email: "orolux.store1@gmail.com" });
    if (admin) {
      // Hash the new password
      const newPassword = "Q!7v9z$Lp2@eR4wX";
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update the admin user
      admin.password = hashedPassword;
      admin.loginAttempts = 0;
      admin.isLocked = false;
      admin.lockUntil = null;
      
      await admin.save();
      console.log("Admin password updated successfully!");
      console.log("New login credentials:");
      console.log("Email:", admin.email);
      console.log("Password:", newPassword);
    } else {
      console.log("Admin account not found!");
    }
  } catch (error) {
    console.error("Error:", error);
  }
  mongoose.disconnect();
});
