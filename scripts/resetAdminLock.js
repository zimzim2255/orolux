const mongoose = require("mongoose");
const AdminUser = require("../models/AdminUser");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const admin = await AdminUser.findOne({ email: "orolux.store1@gmail.com" });
    if (admin) {
      admin.loginAttempts = 0;
      admin.isLocked = false;
      admin.lockUntil = null;
      await admin.save();
      console.log("Admin account unlocked successfully!");
    } else {
      console.log("Admin account not found!");
    }
  } catch (error) {
    console.error("Error:", error);
  }
  mongoose.disconnect();
});
