const express = require("express");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    res.json({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
  })
);

router.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const existing = await prisma.notification.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Notification not found" });
    const notification = await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
    res.json({ notification });
  })
);

router.patch(
  "/read-all",
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: req.userId, read: false }, data: { read: true } });
    res.json({ ok: true });
  })
);

module.exports = router;
