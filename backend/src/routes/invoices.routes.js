const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { generateInvoiceItems } = require("../utils/ai");
const { generateInvoiceNumber, calcInvoiceTotals } = require("../utils/finance");
const { streamInvoicePdf } = require("../utils/pdf");
const { sendInvoiceEmail } = require("../utils/email");
const { createAuditLog } = require("../utils/audit");

const router = express.Router();
router.use(requireAuth);

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative(),
});

const invoiceSchema = z.object({
  clientId: z.string().uuid(),
  projectId: z.string().uuid().optional().nullable(),
  items: z.array(itemSchema).min(1, "Add at least one line item"),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AED", "CAD"]).default("INR"),
  taxPercent: z.number().min(0).max(100).default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE"]).default("DRAFT"),
  generatedByAI: z.boolean().optional(),
});

// ---------- LIST ----------
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, clientId } = req.query;
    const invoices = await prisma.invoice.findMany({
      where: {
        userId: req.userId,
        ...(status ? { status: String(status) } : {}),
        ...(clientId ? { clientId: String(clientId) } : {}),
      },
      include: { client: { select: { companyName: true } }, items: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ invoices });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { client: true, project: true, items: true },
    });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json({ invoice });
  })
);

// ---------- AI-ASSISTED DRAFT ----------
const aiDraftSchema = z.object({
  prompt: z.string().min(5, "Describe the invoice you want to create"),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AED", "CAD"]).default("INR"),
});

router.post(
  "/ai-draft",
  asyncHandler(async (req, res) => {
    const { prompt, currency } = aiDraftSchema.parse(req.body);
    const { items, suggestedClientName, notes } = await generateInvoiceItems({ prompt, currency });

    if (!items.length) {
      return res.status(422).json({ error: "Couldn't generate line items from that description. Try being more specific." });
    }

    const enriched = items.map((i) => ({
      description: i.description,
      quantity: i.quantity || 1,
      unitPrice: i.unitPrice || 0,
      amount: Number(((i.quantity || 1) * (i.unitPrice || 0)).toFixed(2)),
    }));

    const { subtotal, total } = calcInvoiceTotals(enriched);
    res.json({ items: enriched, subtotal, total, suggestedClientName, notes, currency });
  })
);

// ---------- CREATE ----------
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = invoiceSchema.parse(req.body);

    const client = await prisma.client.findFirst({ where: { id: data.clientId, userId: req.userId } });
    if (!client) return res.status(404).json({ error: "Client not found" });

    const { subtotal, total } = calcInvoiceTotals(data.items, data.taxPercent, data.discountPercent);
    const invoiceNumber = await generateInvoiceNumber(prisma, req.userId);

    const invoice = await prisma.invoice.create({
      data: {
        userId: req.userId,
        clientId: data.clientId,
        projectId: data.projectId || null,
        invoiceNumber,
        status: data.status,
        currency: data.currency,
        taxPercent: data.taxPercent,
        discountPercent: data.discountPercent,
        subtotal,
        total,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes,
        generatedByAI: !!data.generatedByAI,
        items: {
          create: data.items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            amount: Number((i.quantity * i.unitPrice).toFixed(2)),
          })),
        },
      },
      include: { items: true, client: true },
    });

    await createAuditLog({
      userId: req.userId,
      action: "INVOICE_CREATED",
      entity: "Invoice",
      entityId: invoice.id,
    });

    res.status(201).json({ invoice });
  })
);

// ---------- UPDATE STATUS ----------
const statusSchema = z.object({ status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE"]) });
router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const { status } = statusSchema.parse(req.body);
    const existing = await prisma.invoice.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Invoice not found" });

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status, paidAt: status === "PAID" ? new Date() : existing.paidAt },
    });

    await createAuditLog({
      userId: req.userId,
      action: "INVOICE_UPDATED",
      entity: "Invoice",
      entityId: invoice.id,
    });

    res.json({ invoice });
  })
);

// ---------- DELETE ----------
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.invoice.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Invoice not found" });

    await prisma.invoice.delete({ where: { id: req.params.id } });

    await createAuditLog({
      userId: req.userId,
      action: "INVOICE_DELETED",
      entity: "Invoice",
      entityId: req.params.id,
    });

    res.json({ ok: true });
  })
);

// ---------- PDF DOWNLOAD ----------
const PDF_SIZES = ["A4", "A5", "A6", "LETTER", "LEGAL"];
router.get(
  "/:id/pdf",
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { items: true, client: true },
    });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const requested = String(req.query.size || "A4").toUpperCase();
    const size = PDF_SIZES.includes(requested) ? requested : "A4";

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    streamInvoicePdf(res, { invoice, user, client: invoice.client }, size);
  })
);

// ---------- SEND EMAIL ----------
router.post(
  "/:id/send-email",
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { client: true, items: true },
    });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    if (!invoice.client.email) return res.status(400).json({ error: "Client has no email address" });

    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    await sendInvoiceEmail({
      to: invoice.client.email,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.client.companyName,
      total: invoice.total,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      fromName: user.name || user.email,
    });

    if (invoice.status === "DRAFT") {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "SENT" },
      });
    }

    await createAuditLog({
      userId: req.userId,
      action: "INVOICE_SENT",
      entity: "Invoice",
      entityId: invoice.id,
    });

    res.json({ ok: true, message: "Invoice email sent successfully" });
  })
);

module.exports = router;