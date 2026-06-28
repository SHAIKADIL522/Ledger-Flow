const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
  logger.error(
    { err: err.message, stack: err.stack, method: req.method, url: req.originalUrl },
    "Unhandled error"
  );

  // Sentry — report if initialized
  try {
    const Sentry = require("../config/sentry");
    if (Sentry?.captureException) Sentry.captureException(err);
  } catch {
    // Sentry not configured — skip silently
  }

  if (err.name === "ZodError") {
    return res.status(400).json({
      error: "Validation failed",
      details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
  }

  if (err.code === "P2002") {
    return res.status(409).json({ error: "A record with this value already exists." });
  }

  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found." });
  }

  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? err.publicMessage || "Something went wrong. Please try again."
      : err.message || "Internal server error";

  res.status(status).json({ error: message });
}

function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
}

module.exports = { errorHandler, notFound };