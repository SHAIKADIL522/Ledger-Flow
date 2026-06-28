const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const expenseSchema = z.object({
  title:      z.string().min(1, "Title is required"),
  amount:     z.number().positive("Amount must be greater than 0"),
  currency:   z.enum(["INR", "USD", "EUR", "GBP", "AED", "CAD"]).default("INR"),
  category:   z.enum(["SOFTWARE","MARKETING","TRAVEL","OFFICE","CONTRACTORS","UTILITIES","OTHER"]).default("OTHER"),
  clientId:   z.string().uuid().optional().nullable(),
  receiptUrl: z.string().optional(),
  notes:      z.string().optional(),
  spentAt:    z.string().optional(),
});

// LIST — supports ?clientId= filter
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { category, clientId } = req.query;
    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.userId,
        ...(category ? { category: String(category) } : {}),
        ...(clientId ? { clientId: String(clientId) } : {}),
      },
      orderBy: { spentAt: "desc" },
    });
    res.json({ expenses });
  })
);

// CREATE
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = expenseSchema.parse(req.body);
    const expense = await prisma.expense.create({
      data: {
        ...data,
        clientId: data.clientId || null,
        spentAt:  data.spentAt ? new Date(data.spentAt) : new Date(),
        userId:   req.userId,
      },
    });
    res.status(201).json({ expense });
  })
);

// UPDATE
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = expenseSchema.partial().parse(req.body);
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Expense not found" });

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        ...data,
        clientId: data.clientId ?? existing.clientId,
        spentAt:  data.spentAt ? new Date(data.spentAt) : undefined,
      },
    });
    res.json({ expense });
  })
);

// DELETE
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Expense not found" });
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

module.exports = router;