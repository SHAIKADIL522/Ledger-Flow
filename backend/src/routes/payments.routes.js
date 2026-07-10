const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const prisma = require("../lib/prisma");
const logger = require("../utils/logger");

const router = express.Router();
router.use(requireAuth);

function keysConfigured(...keys) {
  return keys.every((k) => k && !k.includes("REPLACE_WITH"));
}

// Smallest-unit conversion. Every gateway we support today is 2-decimal-place,
// so *100 is correct for INR/USD/EUR/GBP/AED/CAD. If a zero-decimal currency
// (e.g. JPY) is ever added to the invoice currency enum, this needs a lookup.
function toSmallestUnit(decimalAmount) {
  return Math.round(Number(decimalAmount) * 100);
}

async function loadPayableInvoice(userId, invoiceId) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { client: true },
  });
  if (!invoice) {
    const err = new Error("Invoice not found");
    err.status = 404;
    throw err;
  }
  if (invoice.status === "PAID") {
    const err = new Error("This invoice is already marked as paid");
    err.status = 409;
    throw err;
  }
  return invoice;
}

// ---------- RAZORPAY (domestic payments) ----------
router.post(
  "/razorpay/order",
  asyncHandler(async (req, res) => {
    if (!keysConfigured(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET)) {
      return res.status(503).json({
        error: "Razorpay isn't configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env to enable payments.",
      });
    }
    const { invoiceId } = req.body || {};
    if (!invoiceId) return res.status(400).json({ error: "invoiceId is required" });

    const invoice = await loadPayableInvoice(req.userId, invoiceId);

    const Razorpay = require("razorpay");
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // invoiceId + userId travel in `notes` so the webhook (which has no
    // session/cookie) can look the order back up without a schema change.
    const order = await razorpay.orders.create({
      amount: toSmallestUnit(invoice.total),
      currency: invoice.currency,
      receipt: invoice.id,
      notes: { invoiceId: invoice.id, userId: req.userId, invoiceNumber: invoice.invoiceNumber },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // safe to expose — this is the publishable key
      invoice: { id: invoice.id, invoiceNumber: invoice.invoiceNumber },
    });
  })
);

// ---------- STRIPE (international payments) ----------
router.post(
  "/stripe/checkout-session",
  asyncHandler(async (req, res) => {
    if (!keysConfigured(process.env.STRIPE_SECRET_KEY)) {
      return res.status(503).json({
        error: "Stripe isn't configured yet. Add STRIPE_SECRET_KEY to your .env to enable international payments.",
      });
    }
    const { invoiceId } = req.body || {};
    if (!invoiceId) return res.status(400).json({ error: "invoiceId is required" });

    const invoice = await loadPayableInvoice(req.userId, invoiceId);

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: invoice.currency.toLowerCase(),
            unit_amount: toSmallestUnit(invoice.total),
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              description: invoice.client?.companyName
                ? `Billed to ${invoice.client.companyName}`
                : undefined,
            },
          },
          quantity: 1,
        },
      ],
      // invoiceId + userId travel in metadata so the webhook can find the
      // invoice without needing a session/cookie.
      metadata: { invoiceId: invoice.id, userId: req.userId, invoiceNumber: invoice.invoiceNumber },
      success_url: `${clientUrl}/invoices/${invoice.id}?payment=success`,
      cancel_url: `${clientUrl}/invoices/${invoice.id}?payment=cancelled`,
    });

    res.json({ url: session.url, sessionId: session.id });
  })
);

// ---------- STATUS (for the Settings → Payments cards) ----------
router.get(
  "/status",
  asyncHandler(async (req, res) => {
    res.json({
      razorpay: keysConfigured(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET),
      stripe: keysConfigured(process.env.STRIPE_SECRET_KEY),
    });
  })
);

// ---------- TRANSACTION HISTORY ----------
// Supports ?status=SUCCESS|REFUNDED, ?gateway=razorpay|stripe, and
// ?search= (matches invoice number or client company name) so the
// frontend can filter without pulling the whole history each time.
router.get(
  "/transactions",
  asyncHandler(async (req, res) => {
    const take = Math.min(Number(req.query.limit) || 100, 200);
    const { status, gateway, search } = req.query;

    const where = { userId: req.userId };
    if (status) where.status = status;
    if (gateway) where.gateway = gateway;
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { invoice: { invoiceNumber: { contains: search, mode: "insensitive" } } },
        { invoice: { client: { companyName: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        invoice: { select: { id: true, invoiceNumber: true, client: { select: { companyName: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take,
    });
    res.json({ transactions });
  })
);

// ---------- EXPORT CSV ----------
// Same filters as /transactions, streamed back as a CSV instead of JSON.
router.get(
  "/transactions/export",
  asyncHandler(async (req, res) => {
    const { status, gateway, search } = req.query;
    const where = { userId: req.userId };
    if (status) where.status = status;
    if (gateway) where.gateway = gateway;
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { invoice: { invoiceNumber: { contains: search, mode: "insensitive" } } },
        { invoice: { client: { companyName: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        invoice: { select: { invoiceNumber: true, client: { select: { companyName: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Date", "Invoice", "Client", "Gateway", "Reference", "Amount", "Currency", "Status"];
    const rows = transactions.map((t) =>
      [
        t.createdAt.toISOString(),
        t.invoice?.invoiceNumber || "",
        t.invoice?.client?.companyName || "",
        t.gateway,
        t.reference,
        t.amount,
        t.currency,
        t.status,
      ]
        .map(escape)
        .join(",")
    );
    const csv = [header.map(escape).join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="transactions-${Date.now()}.csv"`);
    res.send(csv);
  })
);

// ---------- RECEIPT (JSON — printable from the frontend, no new PDF work) ----------
router.get(
  "/transactions/:id/receipt",
  asyncHandler(async (req, res) => {
    const txn = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            total: true,
            currency: true,
            client: { select: { companyName: true, email: true } },
          },
        },
      },
    });
    if (!txn) return res.status(404).json({ error: "Transaction not found" });
    res.json({
      receipt: {
        transactionId: txn.id,
        gateway: txn.gateway,
        reference: txn.reference,
        amount: txn.amount,
        currency: txn.currency,
        status: txn.status,
        paidAt: txn.createdAt,
        invoiceNumber: txn.invoice.invoiceNumber,
        billedTo: txn.invoice.client?.companyName,
      },
    });
  })
);

// ---------- REFUND ----------
// Only ever full-amount refunds against a recorded Transaction — partial
// refunds would desync invoice.status from what actually happened and are
// intentionally out of scope here.
router.post(
  "/refund",
  asyncHandler(async (req, res) => {
    const { transactionId } = req.body || {};
    if (!transactionId) return res.status(400).json({ error: "transactionId is required" });

    const txn = await prisma.transaction.findFirst({
      where: { id: transactionId, userId: req.userId },
      include: { invoice: true },
    });
    if (!txn) return res.status(404).json({ error: "Transaction not found" });
    if (txn.status === "REFUNDED") return res.status(409).json({ error: "Already refunded" });

    if (txn.gateway === "razorpay") {
      if (!keysConfigured(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET)) {
        return res.status(503).json({ error: "Razorpay isn't configured." });
      }
      const Razorpay = require("razorpay");
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      await razorpay.payments.refund(txn.reference, {
        amount: toSmallestUnit(txn.amount),
      });
    } else if (txn.gateway === "stripe") {
      if (!keysConfigured(process.env.STRIPE_SECRET_KEY)) {
        return res.status(503).json({ error: "Stripe isn't configured." });
      }
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
      await stripe.refunds.create({ payment_intent: txn.reference });
    } else {
      return res.status(400).json({ error: `Unknown gateway: ${txn.gateway}` });
    }

    // Refund confirmation normally also arrives via webhook (refund.processed /
    // charge.refunded) — this is the synchronous, user-visible mark so the
    // dashboard reflects it immediately instead of waiting on a retry-prone webhook.
    await prisma.$transaction([
      prisma.transaction.update({ where: { id: txn.id }, data: { status: "REFUNDED" } }),
      prisma.invoice.update({ where: { id: txn.invoiceId }, data: { status: "SENT", paidAt: null } }),
    ]);

    logger.info({ transactionId: txn.id, gateway: txn.gateway }, "refund issued");
    res.json({ ok: true });
  })
);

// Friendly error shape for the two custom throws above.
router.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  logger.error({ err }, "payments route error");
  next(err);
});

module.exports = router;