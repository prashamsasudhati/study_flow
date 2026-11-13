"use strict";

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required."],
    trim: true,
    minlength: [2, "Name must be at least 2 characters."],
    maxlength: [80, "Name cannot exceed 80 characters."]
  },
  email: {
    type: String,
    required: [true, "Email is required."],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [254, "Email cannot exceed 254 characters."]
  },
  password: {
    type: String,
    required: [true, "Password is required."],
    minlength: [8, "Password must be at least 8 characters."],
    select: false
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: {
    transform(_document, result) {
      delete result.password;
      delete result.__v;
      return result;
    }
  }
});

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
