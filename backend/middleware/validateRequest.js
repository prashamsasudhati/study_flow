"use strict";

const { validationResult } = require("express-validator");

function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  return res.status(400).json({
    success: false,
    message: "Request validation failed.",
    errors: result.array().map(({ path, msg }) => ({ field: path, message: msg }))
  });
}

module.exports = validateRequest;
