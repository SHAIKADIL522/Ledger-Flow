const prisma = require("../lib/prisma");

/**
 * Fetches compact, intent-specific context from DB.
 * The LLM never touches the DB directly — this layer does it.
 */
async function fetchContext(intent, userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, defaultCurrency: true, businessName: true },
  });

  const base = {
    currency: user?.defaultCurrency || "INR",
    userName: user?.name,
    businessName: user?.businessName,
  };

  // ── DASHBOARD SUMMARY ──────────────────────────────────
  if (intent === "dashboard_summary") {
    const [invoices, expenses, clientCount] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId, createdAt: { gte: startOfMonth } },
        select: {
          total: true,
          status: true,
          client: { select: { companyName: true } },
        },
      }),
      prisma.expense.findMany({
        where: { userId, spentAt: { gte: startOfMonth } },
        select: { amount: true, category: true },
      }),
      prisma.client.count({ where: { userId } }),
    ]);

    const revenue = invoices
      .filter((i) => i.status === "PAID")
      .reduce((s, i) => s + Number(i.total), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const pending = invoices.filter((i) => i.status === "SENT").length;
    const overdue = invoices.filter((i) => i.status === "OVERDUE").length;

    const clientTotals = {};
    invoices
      .filter((i) => i.status === "PAID")
      .forEach((i) => {
        const n = i.client?.companyName || "Unknown";
        clientTotals[n] = (clientTotals[n] || 0) + Number(i.total);
      });
    const bestClient =
      Object.entries(clientTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      null;

    return {
      ...base,
      intent,
      revenue,
      totalExpenses,
      profit: revenue - totalExpenses,
      totalInvoices: invoices.length,
      pending,
      overdue,
      totalClients: clientCount,
      bestClient,
    };
  }

  // ── OVERDUE INVOICES ───────────────────────────────────
  if (intent === "overdue_invoices") {
    const invoices = await prisma.invoice.findMany({
      where: { userId, status: { in: ["OVERDUE", "SENT"] } },
      include: { client: { select: { companyName: true } } },
      orderBy: { dueDate: "asc" },
      take: 10,
    });
    return {
      ...base,
      intent,
      overdueInvoices: invoices.map((i) => ({
        number: i.invoiceNumber,
        client: i.client?.companyName,
        amount: Number(i.total),
        status: i.status,
        daysOverdue: i.dueDate
          ? Math.max(
              0,
              Math.floor((now - new Date(i.dueDate)) / 86400000)
            )
          : null,
        dueDate: i.dueDate,
      })),
    };
  }

  // ── EXPENSE ANALYSIS ───────────────────────────────────
  if (intent === "expense_analysis") {
    const expenses = await prisma.expense.findMany({
      where: { userId, spentAt: { gte: startOfMonth } },
      select: { amount: true, category: true },
    });
    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const byCategory = {};
    expenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
    });
    const breakdown = Object.entries(byCategory)
      .map(([cat, amt]) => ({
        category: cat,
        amount: amt,
        percent: total > 0 ? Math.round((amt / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
    return { ...base, intent, totalExpenses: total, breakdown };
  }

  // ── REVENUE COMPARE ────────────────────────────────────
  if (intent === "revenue_compare") {
    const [thisMonthInv, lastMonthInv, thisExp, lastExp] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId, status: "PAID", paidAt: { gte: startOfMonth } },
        select: { total: true },
      }),
      prisma.invoice.findMany({
        where: {
          userId,
          status: "PAID",
          paidAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        select: { total: true },
      }),
      prisma.expense.findMany({
        where: { userId, spentAt: { gte: startOfMonth } },
        select: { amount: true },
      }),
      prisma.expense.findMany({
        where: {
          userId,
          spentAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        select: { amount: true },
      }),
    ]);

    const tm = thisMonthInv.reduce((s, i) => s + Number(i.total), 0);
    const lm = lastMonthInv.reduce((s, i) => s + Number(i.total), 0);
    const te = thisExp.reduce((s, e) => s + Number(e.amount), 0);
    const le = lastExp.reduce((s, e) => s + Number(e.amount), 0);
    const pct = (curr, prev) =>
      prev === 0 ? null : Math.round(((curr - prev) / prev) * 100);

    return {
      ...base,
      intent,
      thisMonthRevenue: tm,
      lastMonthRevenue: lm,
      revenueChange: pct(tm, lm),
      thisMonthExpenses: te,
      lastMonthExpenses: le,
      expensesChange: pct(te, le),
      profitChange: pct(tm - te, lm - le),
    };
  }

  // ── INVOICE LIST ───────────────────────────────────────
  if (intent === "invoice_list") {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: { client: { select: { companyName: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return {
      ...base,
      intent,
      invoices: invoices.map((i) => ({
        number: i.invoiceNumber,
        client: i.client?.companyName,
        amount: Number(i.total),
        status: i.status,
        dueDate: i.dueDate,
        createdAt: i.createdAt,
      })),
    };
  }

  // ── PROJECT SUMMARY ────────────────────────────────────
  if (intent === "project_summary") {
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        client: { select: { companyName: true } },
        invoices: { select: { total: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    return {
      ...base,
      intent,
      projects: projects.map((p) => ({
        name: p.name,
        client: p.client?.companyName,
        status: p.status,
        budget: Number(p.budget || 0),
        invoiceCount: p.invoices.length,
        billed: p.invoices.reduce((s, i) => s + Number(i.total), 0),
        paid: p.invoices
          .filter((i) => i.status === "PAID")
          .reduce((s, i) => s + Number(i.total), 0),
      })),
    };
  }

  // ── CLIENT INTEL ───────────────────────────────────────
  if (intent === "client_intel") {
    const clients = await prisma.client.findMany({
      where: { userId },
      include: {
        projects: { select: { id: true } },
        invoices: { select: { total: true, status: true, paidAt: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return {
      ...base,
      intent,
      clients: clients.map((c) => ({
        name: c.companyName,
        projectCount: c.projects.length,
        invoiceCount: c.invoices.length,
        totalBilled: c.invoices.reduce((s, i) => s + Number(i.total), 0),
        totalPaid: c.invoices
          .filter((i) => i.status === "PAID")
          .reduce((s, i) => s + Number(i.total), 0),
        outstanding: c.invoices
          .filter((i) => ["SENT", "OVERDUE"].includes(i.status))
          .reduce((s, i) => s + Number(i.total), 0),
        lastPayment:
          c.invoices
            .filter((i) => i.paidAt)
            .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))[0]
            ?.paidAt || null,
      })),
    };
  }

  // ── GENERAL / SEARCH / CREATE ──────────────────────────
  const [invoiceCount, clientCount, expenseCount] = await Promise.all([
    prisma.invoice.count({ where: { userId } }),
    prisma.client.count({ where: { userId } }),
    prisma.expense.count({ where: { userId } }),
  ]);
  return { ...base, intent, invoiceCount, clientCount, expenseCount };
}

module.exports = { fetchContext };