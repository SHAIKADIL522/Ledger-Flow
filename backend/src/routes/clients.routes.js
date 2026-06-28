const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { createAuditLog } = require("../utils/audit");

const router = express.Router();
router.use(requireAuth);

const clientSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  country: z.string().optional(),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AED", "CAD"]).default("INR"),
  notes: z.string().optional(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search } = req.query;
    const clients = await prisma.client.findMany({
      where: {
        userId: req.userId,
        ...(search
          ? {
              OR: [
                { companyName: { contains: String(search), mode: "insensitive" } },
                { contactName: { contains: String(search), mode: "insensitive" } },
                { email: { contains: String(search), mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { projects: true, invoices: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ clients });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        projects: { orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json({ client });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = clientSchema.parse(req.body);
    const client = await prisma.client.create({
      data: { ...data, email: data.email || null, userId: req.userId },
    });

    await createAuditLog({
      userId: req.userId,
      action: "CLIENT_CREATED",
      entity: "Client",
      entityId: client.id,
    });

    res.status(201).json({ client });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = clientSchema.partial().parse(req.body);
    const existing = await prisma.client.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Client not found" });

    const client = await prisma.client.update({ where: { id: req.params.id }, data });

    await createAuditLog({
      userId: req.userId,
      action: "CLIENT_UPDATED",
      entity: "Client",
      entityId: client.id,
    });

    res.json({ client });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.client.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Client not found" });

    await prisma.client.delete({ where: { id: req.params.id } });

    await createAuditLog({
      userId: req.userId,
      action: "CLIENT_DELETED",
      entity: "Client",
      entityId: req.params.id,
    });

    res.json({ ok: true });
  })
);

module.exports = router;