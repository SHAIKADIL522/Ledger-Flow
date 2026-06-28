const { incrementRequests, incrementErrors } = require("../monitoring/metrics");

/**
 * Middleware: track request count + error count per response.
 * Mount BEFORE routes in server.js.
 */
function requestTracker(req, res, next) {
  incrementRequests();
  res.on("finish", () => {
    if (res.statusCode >= 500) incrementErrors();
  });
  next();
}

module.exports = requestTracker;