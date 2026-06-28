const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const onboardingSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  industry: z.string().min(1, "Industry is required"),
  country: z.string().min(1, "Country is required"),
  businessType: z.enum(["FREELANCER", "AGENCY", "CONSULTANT", "SMALL_BUSINESS"]),
  defaultCurrency: z.enum(["INR", "USD", "EUR", "GBP", "AED", "CAD"]),
  firstAction: z.enum(["ADD_CLIENT", "CREATE_PROJECT", "GENERATE_INVOICE"]).optional(),
});

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = onboardingSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        businessName: data.businessName,
        industry: data.industry,
        country: data.country,
        businessType: data.businessType,
        defaultCurrency: data.defaultCurrency,
        onboardingComplete: true,
      },
    });

    res.json({ user, nextAction: data.firstAction || "ADD_CLIENT" });
  })
);

module.exports = router;
