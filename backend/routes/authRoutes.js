"use strict";

const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const requireAuth = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();
const passwordRules = body("password")
  .isString()
  .withMessage("Password must be text.")
  .bail()
  .custom((value) => Buffer.byteLength(value, "utf8") <= 72)
  .withMessage("Password cannot exceed 72 UTF-8 bytes.")
  .bail()
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters.");

router.post("/register",
  body("name").isString().withMessage("Name must be text.").bail().trim()
    .isLength({ min: 2, max: 80 }).withMessage("Name must be between 2 and 80 characters."),
  body("email").isEmail().withMessage("Enter a valid email address.").bail().normalizeEmail()
    .isLength({ max: 254 }).withMessage("Email cannot exceed 254 characters."),
  passwordRules,
  validateRequest,
  authController.register
);

router.post("/login",
  body("email").isEmail().withMessage("Enter a valid email address.").bail().normalizeEmail()
    .isLength({ max: 254 }).withMessage("Email cannot exceed 254 characters."),
  body("password").isString().withMessage("Password must be text.").bail()
    .custom((value) => value.length > 0 && Buffer.byteLength(value, "utf8") <= 72)
    .withMessage("Password is required and cannot exceed 72 UTF-8 bytes."),
  validateRequest,
  authController.login
);

router.get("/me", requireAuth, authController.getCurrentUser);

module.exports = router;
