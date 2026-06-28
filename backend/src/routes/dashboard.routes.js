const express = require("express");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { generateInsights } = require("../utils/ai");
const { convertToINR } = require("../utils/finance");

const router = express.Router();
router.use(requireAuth);

// ---------- SNAPSHOT (Today's revenue / expenses / profit / pending invoices) ----------
router.get(
  "/snapshot",
  asyncHandler(async (req, res) => {
    const userId = req.userId;

    const [paidInvoices, expenses, pendingCount, clientCount, projectCount, overdueCount] = await Promise.all([
      prisma.invoice.findMany({ where: { userId, status: "PAID" }, select: { total: true, currency: true } }),
      prisma.expense.findMany({ where: { userId }, select: { amount: true, currency: true } }),
      prisma.invoice.count({ where: { userId, status: { in: ["SENT", "DRAFT"] } } }),
      prisma.client.count({ where: { userId } }),
      prisma.project.count({ where: { userId, status: "ACTIVE" } }),
      prisma.invoice.count({ where: { userId, status: "OVERDUE" } }),
    ]);

    const revenueINR = paidInvoices.reduce((sum, inv) => sum + convertToINR(inv.total, inv.currency), 0);
    const expensesINR = expenses.reduce((sum, e) => sum + convertToINR(e.amount, e.currency), 0);

    res.json({
      revenue: Number(revenueINR.toFixed(2)),
      expenses: Number(expensesINR.toFixed(2)),
      profit: Number((revenueINR - expensesINR).toFixed(2)),
      pendingInvoices: pendingCount,
      overdueInvoices: overdueCount,
      totalClients: clientCount,
      activeProjects: projectCount,
      currency: "INR",
      isEmpty: clientCount === 0,
    });
  })
);

// ---------- MULTI-CURRENCY REVENUE BREAKDOWN ----------
router.get(
  "/revenue-by-currency",
  asyncHandler(async (req, res) => {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.userId, status: "PAID" },
      select: { total: true, currency: true },
    });

    const byCurrency = {};
    let convertedTotal = 0;
    for (const inv of invoices) {
      byCurrency[inv.currency] = (byCurrency[inv.currency] || 0) + Number(inv.total);
      convertedTotal += convertToINR(inv.total, inv.currency);
    }

    res.json({
      breakdown: Object.entries(byCurrency).map(([currency, amount]) => ({
        currency,
        amount: Number(amount.toFixed(2)),
      })),
      convertedTotal: Number(convertedTotal.toFixed(2)),
      convertedCurrency: "INR",
    });
  })
);

// ---------- AI BUSINESS INSIGHTS ----------
router.get(
  "/insights",
  asyncHandler(async (req, res) => {
    const userId = req.userId;

    const [invoices, expenses, clients] = await Promise.all([
      prisma.invoice.findMany({ where: { userId }, select: { total: true, status: true, clientId: true, currency: true, createdAt: true } }),
      prisma.expense.findMany({ where: { userId }, select: { amount: true, category: true, currency: true } }),
      prisma.client.findMany({ where: { userId }, select: { id: true, companyName: true } }),
    ]);

    if (invoices.length === 0 && expenses.length === 0) {
      return res.json({ insights: [] });
    }

    const revenueByClient = {};
    let totalRevenue = 0;
    for (const inv of invoices.filter((i) => i.status === "PAID")) {
      const amt = convertToINR(inv.total, inv.currency);
      totalRevenue += amt;
      revenueByClient[inv.clientId] = (revenueByClient[inv.clientId] || 0) + amt;
    }

    const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;
    const topClientId = Object.entries(revenueByClient).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topClient = clients.find((c) => c.id === topClientId);
    const topClientShare = topClientId && totalRevenue > 0 ? (revenueByClient[topClientId] / totalRevenue) * 100 : 0;

    const snapshot = {
      totalRevenueINR: Math.round(totalRevenue),
      overdueInvoices: overdueCount,
      topClient: topClient ? { name: topClient.companyName, sharePercent: Math.round(topClientShare) } : null,
      totalExpenseEntries: expenses.length,
      totalClients: clients.length,
    };

    try {
      const insights = await generateInsights(snapshot);
      res.json({ insights });
    } catch (err) {
      // Graceful fallback if AI is not configured — still useful, deterministic insights
      const fallback = [];
      if (overdueCount > 0) fallback.push({ title: `You have ${overdueCount} overdue invoice${overdueCount > 1 ? "s" : ""}.`, type: "warning" });
      if (topClient) fallback.push({ title: `${topClient.companyName} contributes ${Math.round(topClientShare)}% of your revenue.`, type: "neutral" });
      if (totalRevenue > 0) fallback.push({ title: `Total revenue so far: Rs. ${Math.round(totalRevenue).toLocaleString("en-IN")}.`, type: "positive" });
      res.json({ insights: fallback, aiUnavailable: true });
    }
  })
);

module.exports = router;
