const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  isLocked: { 
    type: Boolean,
    default: false
  }
});

adminSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model("AdminUser", adminSchema);