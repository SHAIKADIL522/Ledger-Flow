const { verifyAccessToken } = require("../utils/jwt");
const logger = require("../utils/logger");

function requireAuth(req, res, next) {
  const cookieName = process.env.COOKIE_NAME || "ledgerflow-token";
  const token =
    req.cookies?.[cookieName] ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const decoded = verifyAccessToken(token);

    // Token version check — invalidates old tokens after logout-all
    if (
      decoded.tokenVersion !== undefined &&
      req.dbUser &&
      decoded.tokenVersion !== req.dbUser.tokenVersion
    ) {
      return res.status(401).json({ error: "Session revoked. Please log in again." });
    }

    req.userId = decoded.userId;
    next();
  } catch (err) {
    logger.warn({ err: err.message, url: req.originalUrl }, "Auth token verification failed");
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
}

module.exports = { requireAuth };