"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, FileText, Users, Download } from "lucide-react";
import { Card } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { useClients } from "@/lib/hooks/useClients";
import { useReports } from "@/lib/hooks/useFinance";
import { formatCurrency } from "@/lib/format";

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color = "text-primary" }) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={`size-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 ${color}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </Card>
  );
}

// ── Simple bar ───────────────────────────────────────────────────────────────
function Bar({ label, amount, max, currency }) {
  const pct = max > 0 ? Math.round((amount / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400 truncate max-w-[60%]">{label}</span>
        <span className="text-slate-300 font-medium">{formatCurrency(amount, currency)}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  // Date range — default: first of current month → today
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [from, setFrom]           = useState(firstOfMonth.toISOString().split("T")[0]);
  const [to, setTo]               = useState(today.toISOString().split("T")[0]);
  const [applied, setApplied]     = useState({ from, to });
  const [clientId, setClientId]   = useState(""); // "" = all clients

  const { data: clientsData }     = useClients();
  const clients                   = clientsData?.clients || [];

  const { data: report, isLoading, refetch } = useReports({
    from:     applied.from,
    to:       applied.to,
    clientId: clientId || undefined,
  });

  const apply = () => { setApplied({ from, to }); refetch(); };

  // CSV export
  const exportCSV = () => {
    if (!report) return;
    const rows = [
      ["Metric", "Value"],
      ["Revenue (INR)", report.revenue],
      ["Expenses (INR)", report.expenses],
      ["Profit (INR)", report.profit],
      ["Total Invoices", report.invoiceCount],
      ["Paid Invoices", report.paidCount],
      ["Overdue Invoices", report.overdueCount],
      ["Total Clients", report.totalClients],
      [],
      ["Top Clients", "Revenue (INR)"],
      ...(report.topClients || []).map((c) => [c.name, c.amount]),
      [],
      ["Expense Category", "Amount (INR)"],
      ...(report.expensesByCategory || []).map((e) => [e.category, e.amount]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `ledgerflow-report-${applied.from}-${applied.to}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const maxClientRevenue = Math.max(...(report?.topClients?.map((c) => c.amount) || [1]));
  const maxExpense       = Math.max(...(report?.expensesByCategory?.map((e) => e.amount) || [1]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-sm text-slate-400 mt-1">Financial summary for any date range.</p>
        </div>
        <Button variant="secondary" icon={Download} onClick={exportCSV} disabled={!report}>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* From date */}
          <div style={{ overflow: "visible", position: "relative" }}>
            <label className="block text-xs text-slate-400 mb-1.5">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-10 px-3 rounded-lg bg-navy-800/60 border border-white/10 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          {/* To date */}
          <div style={{ overflow: "visible", position: "relative" }}>
            <label className="block text-xs text-slate-400 mb-1.5">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-10 px-3 rounded-lg bg-navy-800/60 border border-white/10 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          {/* Client filter */}
          <div className="min-w-[200px]">
            <label className="block text-xs text-slate-400 mb-1.5">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="h-10 w-full px-3 rounded-lg bg-navy-800/60 border border-white/10 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>
          <Button onClick={apply} loading={isLoading}>Apply</Button>
        </div>
      </Card>

     {/* Stat cards */}
<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard
    label="Revenue"
    value={report ? formatCurrency(report.revenue, "INR") : "−"}
    icon={TrendingUp}
    color="text-emerald-400"
  />

  {/* ADD THIS — shows pending revenue when no paid invoices */}
  {report?.pendingRevenue > 0 && (
    <StatCard
      label="Pending"
      value={formatCurrency(report.pendingRevenue, "INR")}
      icon={TrendingUp}
      color="text-yellow-400"
    />
  )}

  <StatCard
    label="Expenses"
    value={report ? formatCurrency(report.expenses, "INR") : "−"}
    icon={TrendingDown}
    color="text-rose-400"
  />
  <StatCard
    label="Profit"
    value={report ? formatCurrency(report.profit, "INR") : "−"}
    icon={DollarSign}
    color={report?.profit >= 0 ? "text-primary" : "text-rose-400"}
  />
</div>

      {/* Invoice summary + expense by category */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Invoice summary */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-white">Invoice Summary</h2>
          </div>
          {[
            { label: "Total invoices",  value: report?.invoiceCount   },
            { label: "Paid",            value: report?.paidCount       },
            { label: "Overdue",         value: report?.overdueCount    },
            { label: "Total clients",   value: report?.totalClients    },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <span className="text-slate-400">{label}</span>
              <span className="text-white font-medium">{value ?? "—"}</span>
            </div>
          ))}
        </Card>

        {/* Expenses by category */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="size-4 text-rose-400" />
            <h2 className="text-sm font-semibold text-white">Expenses by Category</h2>
          </div>
          {!report || report.expensesByCategory?.length === 0 ? (
            <p className="text-sm text-slate-500">No expenses in this period.</p>
          ) : (
            report.expensesByCategory.map((e) => (
              <Bar
                key={e.category}
                label={e.category.charAt(0) + e.category.slice(1).toLowerCase()}
                amount={e.amount}
                max={maxExpense}
                currency="INR"
              />
            ))
          )}
        </Card>
      </div>

      {/* Top clients by revenue */}
      {report?.topClients?.length > 0 && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-white">
              {clientId ? "Client Revenue" : "Top Clients by Revenue"}
            </h2>
          </div>
          {report.topClients.map((c) => (
            <Bar
              key={c.name}
              label={c.name}
              amount={c.amount}
              max={maxClientRevenue}
              currency="INR"
            />
          ))}
        </Card>
      )}

      {/* Projects breakdown — shown when specific client selected */}
      {report?.projectBreakdown?.length > 0 && (
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">Projects</h2>
          <div className="divide-y divide-white/5">
            {report.projectBreakdown.map((p) => (
              <div key={p.name} className="flex justify-between py-2 text-sm">
                <span className="text-slate-400">{p.name}</span>
                <span className="text-white font-medium">{formatCurrency(p.revenue, "INR")}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}