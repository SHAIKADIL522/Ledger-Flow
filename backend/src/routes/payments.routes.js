const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

function keysConfigured(...keys) {
  return keys.every((k) => k && !k.includes("REPLACE_WITH"));
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
    // Once keys are added: const Razorpay = require("razorpay"); create instance & order here.
    res.status(501).json({ error: "Razorpay order creation not yet wired — install the 'razorpay' package and implement this handler." });
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
    // Once keys are added: const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); create a checkout session here.
    res.status(501).json({ error: "Stripe checkout not yet wired — install the 'stripe' package and implement this handler." });
  })
);

module.exports = router;
