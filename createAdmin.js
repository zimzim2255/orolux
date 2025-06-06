const mongoose = require("mongoose");
const AdminUser = require("./models/AdminUser");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI || "YOUR_MONGO_URI_HERE").then(async () => {  const admin = new AdminUser({
    email: "orolux.store1@gmail.com",
    password: "B07YQm5UA8Iib-wq8RAh0IX_ds0" // Secure password
  });  await admin.save();
  console.log("Admin user created: orolux.store1@gmail.com");
  mongoose.disconnect();
});