const express = require("express");
const crypto = require("crypto");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const logger = require("../utils/logger");
const { sendInvoicePaidEmail } = require("../utils/email");

const router = express.Router();

// Both routes below are mounted with express.raw() in server.js — req.body
// is a Buffer here, which is required for signature verification.

async function markInvoicePaidAndNotify(invoiceId, { gateway, reference }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { client: true, user: true },
  });

  if (!invoice) {
    logger.warn({ invoiceId, gateway }, "webhook: invoice not found");
    return;
  }

  // Record the transaction even if the invoice was already flipped to PAID —
  // e.g. Razorpay sends both `payment.captured` and `order.paid` for the same
  // payment, each with a different `reference`. The @@unique([gateway,
  // reference]) constraint is what actually stops a given payment being
  // recorded twice; this early return only skips the redundant status update.
  if (invoice.status !== "PAID") {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID", paidAt: new Date() },
    });
    logger.info({ invoiceId, gateway, reference }, "invoice marked PAID via webhook");
  }

  if (reference) {
    try {
      await prisma.transaction.create({
        data: {
          userId: invoice.userId,
          invoiceId: invoice.id,
          gateway,
          reference,
          amount: invoice.total,
          currency: invoice.currency,
          status: "SUCCESS",
        },
      });
    } catch (err) {
      if (err.code === "P2002") {
        // Same gateway+reference already recorded — duplicate webhook delivery, ignore.
        logger.info({ invoiceId, gateway, reference }, "duplicate transaction ignored");
      } else {
        logger.error({ err, invoiceId, gateway, reference }, "failed to record transaction");
      }
    }
  }

  if (invoice.status !== "PAID" && invoice.client?.email) {
    sendInvoicePaidEmail({
      to: invoice.client.email,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.client.companyName,
      total: invoice.total,
      currency: invoice.currency,
      fromName: invoice.user?.businessName || invoice.user?.name || "LedgerFlow",
    }).catch((err) => logger.error({ err, invoiceId }, "failed to send invoice-paid email"));
  }
}

// ---------- RAZORPAY WEBHOOK ----------
router.post(
  "/razorpay",
  asyncHandler(async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      logger.error("RAZORPAY_WEBHOOK_SECRET not set — rejecting webhook");
      return res.status(503).send("Webhook not configured");
    }

    const signature = req.headers["x-razorpay-signature"];
    const expected = crypto.createHmac("sha256", secret).update(req.body).digest("hex");

    if (!signature || signature !== expected) {
      logger.warn("Razorpay webhook signature mismatch");
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString("utf8"));

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const order = event.payload?.order?.entity;
      const invoiceId = order?.notes?.invoiceId || payment?.notes?.invoiceId;

      if (invoiceId) {
        await markInvoicePaidAndNotify(invoiceId, {
          gateway: "razorpay",
          reference: payment?.id || order?.id,
        });
      } else {
        logger.warn({ event: event.event }, "Razorpay webhook missing invoiceId in notes");
      }
    }

    // Refund confirmation — /payments/refund already flips this synchronously,
    // so this is a no-op unless the refund was issued outside the app
    // (e.g. directly from the Razorpay dashboard).
    if (event.event === "refund.processed") {
      const payment = event.payload?.payment?.entity;
      if (payment?.id) {
        await prisma.transaction
          .updateMany({ where: { gateway: "razorpay", reference: payment.id }, data: { status: "REFUNDED" } })
          .catch((err) => logger.error({ err }, "razorpay refund webhook update failed"));
      }
    }

    // Always 200 once signature is verified — Razorpay retries on non-2xx.
    res.json({ received: true });
  })
);

// ---------- STRIPE WEBHOOK ----------
router.post(
  "/stripe",
  asyncHandler(async (req, res) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret || secret.includes("REPLACE_WITH")) {
      logger.error("STRIPE_WEBHOOK_SECRET not set — rejecting webhook");
      return res.status(503).send("Webhook not configured");
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], secret);
    } catch (err) {
      logger.warn({ err: err.message }, "Stripe webhook signature verification failed");
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const invoiceId = session.metadata?.invoiceId;

      if (invoiceId) {
        await markInvoicePaidAndNotify(invoiceId, {
          gateway: "stripe",
          reference: session.payment_intent || session.id,
        });
      } else {
        logger.warn({ sessionId: session.id }, "Stripe webhook missing invoiceId in metadata");
      }
    }

    // Refund confirmation — /payments/refund already flips this synchronously;
    // this covers refunds issued directly from the Stripe dashboard.
    if (event.type === "charge.refunded") {
      const charge = event.data.object;
      if (charge.payment_intent) {
        await prisma.transaction
          .updateMany({ where: { gateway: "stripe", reference: charge.payment_intent }, data: { status: "REFUNDED" } })
          .catch((err) => logger.error({ err }, "stripe refund webhook update failed"));
      }
    }

    res.json({ received: true });
  })
);

module.exports = router;