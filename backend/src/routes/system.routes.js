const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { getMetrics } = require("../monitoring/metrics");
const logger = require("../utils/logger");
const pkg = require("../../package.json");

// GET /health
router.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// GET /db-health
router.get("/db-health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ database: "connected", status: "ok" });
  } catch (err) {
    logger.error({ err: err.message }, "DB health check failed");
    res.status(503).json({ database: "disconnected", status: "error", message: err.message });
  }
});

// GET /metrics
router.get("/metrics", (req, res) => {
  res.json(getMetrics());
});

// GET /version
router.get("/version", (req, res) => {
  res.json({
    name: pkg.name,
    version: pkg.version,
    node: process.version,
    env: process.env.NODE_ENV || "development",
  });
});

module.exports = router;