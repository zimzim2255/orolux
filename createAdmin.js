const mongoose = require("mongoose");
const AdminUser = require("./models/AdminUser");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI || "YOUR_MONGO_URI_HERE").then(async () => {  const admin = new AdminUser({
    email: "orolux.store1@gmail.com",
    password: "$9fP@zT3uL#xBw1vRm7QdE!jKs" // Secure password
  });
  await admin.save();
  console.log("Admin user created: admin@example.com / admin123");
  mongoose.disconnect();
});