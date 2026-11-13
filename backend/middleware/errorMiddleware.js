"use strict";

function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

function errorHandler(error, _req, res, _next) {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists."
    });
  }

  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map(({ path, message }) => ({ field: path, message }));
    return res.status(400).json({ success: false, message: "Data validation failed.", errors });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request body is too large." });
  }

  if (error.status === 403 && error.message === "Origin is not allowed by the CORS policy.") {
    return res.status(403).json({ success: false, message: error.message });
  }

  if (error.status === 400 && error.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Request body must contain valid JSON." });
  }

  console.error(error);
  return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
}

module.exports = { notFound, errorHandler };
