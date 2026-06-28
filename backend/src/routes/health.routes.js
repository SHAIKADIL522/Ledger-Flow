const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: "ok", db: "ok", service: "ledgerflow-backend" });
  } catch {
    return res.status(503).json({ status: "error", db: "unreachable" });
  }
});

module.exports = router;