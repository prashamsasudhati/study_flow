"use strict";

const jwt = require("jsonwebtoken");
const User = require("../models/User");

function createToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters.");
  return jwt.sign({ userId: userId.toString() }, secret, {
    subject: userId.toString(),
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  });
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const user = await User.create({ name, email: email.toLowerCase(), password });
    const token = createToken(user._id);
    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: { user, token }
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Email or password is incorrect." });
    }

    const token = createToken(user._id);
    return res.status(200).json({
      success: true,
      message: "Signed in successfully.",
      data: { user, token }
    });
  } catch (error) {
    return next(error);
  }
}

function getCurrentUser(req, res) {
  return res.status(200).json({
    success: true,
    data: { user: req.user }
  });
}

module.exports = { register, login, getCurrentUser };
