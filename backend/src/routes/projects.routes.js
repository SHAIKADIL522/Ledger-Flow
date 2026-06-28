const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const projectSchema = z.object({
  clientId: z.string().uuid("Select a valid client"),
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  budget: z.number().nonnegative().optional(),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AED", "CAD"]).default("INR"),
  deadline: z.string().datetime().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).default("ACTIVE"),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, clientId } = req.query;
    const projects = await prisma.project.findMany({
      where: {
        userId: req.userId,
        ...(status ? { status: String(status) } : {}),
        ...(clientId ? { clientId: String(clientId) } : {}),
      },
      include: { client: { select: { companyName: true } }, _count: { select: { invoices: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ projects });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { client: true, invoices: true },
    });
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ project });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = projectSchema.parse(req.body);
    const client = await prisma.client.findFirst({ where: { id: data.clientId, userId: req.userId } });
    if (!client) return res.status(404).json({ error: "Client not found" });

    const project = await prisma.project.create({
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : null,
        userId: req.userId,
      },
    });
    res.status(201).json({ project });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = projectSchema.partial().parse(req.body);
    const existing = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Project not found" });

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { ...data, deadline: data.deadline ? new Date(data.deadline) : undefined },
    });
    res.json({ project });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Project not found" });

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

module.exports = router;
