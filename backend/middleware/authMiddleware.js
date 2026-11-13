"use strict";

const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  const authorization = req.get("authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authentication token required." });
  }

  const token = authorization.slice(7).trim();
  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication token required." });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not configured.");
    const payload = jwt.verify(token, secret);
    if (typeof payload !== "object" || typeof payload.userId !== "string") {
      return res.status(401).json({ success: false, message: "Invalid authentication token." });
    }

    const user = await User.findById(payload.userId).select("_id name email");
    if (!user) {
      return res.status(401).json({ success: false, message: "Account for this token no longer exists." });
    }
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError" || error.name === "CastError") {
      return res.status(401).json({ success: false, message: "Invalid or expired authentication token." });
    }
    return next(error);
  }
}

module.exports = requireAuth;
