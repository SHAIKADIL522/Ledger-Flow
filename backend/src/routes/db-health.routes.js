const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const logger = require("../utils/logger");

// GET /db-health
router.get("/", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ database: "connected", status: "ok" });
  } catch (err) {
    logger.error({ err: err.message }, "DB health check failed");
    res.status(503).json({ database: "disconnected", status: "error", message: err.message });
  }
});

module.exports = router;