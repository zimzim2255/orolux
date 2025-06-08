const mongoose = require("mongoose");
const AdminUser = require("./models/AdminUser");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI || "YOUR_MONGO_URI_HERE").then(async () => {
  const admin = new AdminUser({
    email: "orolux.store1@gmail.com",
    password: "Q!7v9z$Lp2@eR4wX" // Strong password
  });
  await admin.save();
  console.log("Admin user created: orolux.store1@gmail.com / Q!7v9z$Lp2@eR4wX");
  mongoose.disconnect();
});