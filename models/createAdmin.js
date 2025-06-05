const mongoose = require("mongoose");
const AdminUser = require("./models/AdminUser");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI || "YOUR_MONGO_URI_HERE").then(async () => {
  const admin = new AdminUser({
    email: "admin@example.com",
    password: "admin123" // You can change this password
  });
  await admin.save();
  console.log("Admin user created: admin@example.com / admin123");
  mongoose.disconnect();
});