const express = require("express");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { convertToINR } = require("../utils/finance");

const router = express.Router();
router.use(requireAuth);

// GET /api/reports/summary?from=&to=&clientId=
router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    const from = req.query.from
      ? new Date(String(req.query.from))
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();
    to.setHours(23, 59, 59, 999);

    const clientId = req.query.clientId ? String(req.query.clientId) : null;

    const invoiceWhere = {
      userId,
      createdAt: { gte: from, lte: to },
      ...(clientId ? { clientId } : {}),
    };
    const expenseWhere = {
      userId,
      spentAt: { gte: from, lte: to },
      ...(clientId ? { clientId } : {}),
    };

    const [invoices, expenses, clients, projects] = await Promise.all([
      prisma.invoice.findMany({
        where: invoiceWhere,
        include: {
          client:  { select: { id: true, companyName: true } },
          project: { select: { id: true, name: true } },
        },
      }),
      prisma.expense.findMany({ where: expenseWhere }),

      // FIX 2: apply clientId filter to totalClients count
      clientId
        ? prisma.client.findMany({ where: { userId, id: clientId } })
        : prisma.client.findMany({ where: { userId } }),

      clientId
        ? prisma.project.findMany({
            where: { userId, clientId },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ]);

    // FIX 1: revenue = PAID only, but also expose pendingRevenue from DRAFT+SENT
    const paidInvoices    = invoices.filter((i) => i.status === "PAID");
    const pendingInvoices = invoices.filter((i) => ["DRAFT", "SENT"].includes(i.status));
    const overdueInvoices = invoices.filter((i) => i.status === "OVERDUE");

    const revenue = paidInvoices.reduce(
      (s, i) => s + convertToINR(Number(i.total), i.currency), 0
    );
    const pendingRevenue = pendingInvoices.reduce(
      (s, i) => s + convertToINR(Number(i.total), i.currency), 0
    );
    const expenseTotal = expenses.reduce(
      (s, e) => s + convertToINR(Number(e.amount), e.currency), 0
    );

    // Revenue by client (paid only)
    const revenueByClient = {};
    for (const inv of paidInvoices) {
      const key = inv.client.companyName;
      revenueByClient[key] =
        (revenueByClient[key] || 0) + convertToINR(Number(inv.total), inv.currency);
    }

    // FIX 1b: if no paid invoices, show pending revenue by client so UI isn't empty
    if (Object.keys(revenueByClient).length === 0) {
      for (const inv of pendingInvoices) {
        const key = inv.client.companyName;
        revenueByClient[key] =
          (revenueByClient[key] || 0) + convertToINR(Number(inv.total), inv.currency);
      }
    }

    const topClients = Object.entries(revenueByClient)
      .map(([name, amount]) => ({ name, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Expenses by category
    const expensesByCategory = {};
    for (const e of expenses) {
      expensesByCategory[e.category] =
        (expensesByCategory[e.category] || 0) +
        convertToINR(Number(e.amount), e.currency);
    }

    // Project revenue breakdown
    const projectBreakdown = projects
      .map((proj) => {
        const projPaid = paidInvoices.filter((i) => i.projectId === proj.id);
        const projRevenue = projPaid.reduce(
          (s, i) => s + convertToINR(Number(i.total), i.currency), 0
        );
        return { name: proj.name, revenue: Number(projRevenue.toFixed(2)) };
      })
      .filter((p) => p.revenue > 0);

    res.json({
      period:          { from, to },
      revenue:         Number(revenue.toFixed(2)),
      pendingRevenue:  Number(pendingRevenue.toFixed(2)),  // NEW — frontend can show this
      expenses:        Number(expenseTotal.toFixed(2)),
      profit:          Number((revenue - expenseTotal).toFixed(2)),
      invoiceCount:    invoices.length,
      paidCount:       paidInvoices.length,
      overdueCount:    overdueInvoices.length,
      pendingCount:    pendingInvoices.length,              // NEW
      topClients,
      expensesByCategory: Object.entries(expensesByCategory).map(
        ([category, amount]) => ({ category, amount: Number(amount.toFixed(2)) })
      ),
      projectBreakdown,
      totalClients:    clients.length,                     // FIXED
      currency:        "INR",
    });
  })
);

module.exports = router;