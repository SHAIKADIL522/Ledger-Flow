const express = require("express");
const router = express.Router();
const { getMetrics } = require("../monitoring/metrics");

// GET /metrics
router.get("/", (req, res) => {
  res.json(getMetrics());
});

module.exports = router;