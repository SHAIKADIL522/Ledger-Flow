"use client";

import Link from "next/link";
import { Wallet, TrendingDown, TrendingUp, FileClock, Users, Sparkles, ArrowRight } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import { useSnapshot, useInsights } from "@/lib/hooks/useFinance";
import { formatCurrency } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";

function SnapshotCard({ icon: Icon, label, value, tone = "neutral" }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="size-4.5 text-primary" />
        </div>
        {tone === "up" && <TrendingUp className="size-4 text-primary" />}
        {tone === "down" && <TrendingDown className="size-4 text-rose-400" />}
      </div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl sm:text-2xl font-semibold text-white mt-1">{value}</p>
    </Card>
  );
}

export default function DashboardOverview() {
  const user = useAuthStore((s) => s.user);
  const { data: snapshot, isLoading } = useSnapshot();
  const { data: insightsData } = useInsights();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4 sm:p-6">
        <div className="h-8 w-48 sm:w-64 bg-white/5 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 sm:h-28 bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (snapshot?.isEmpty) {
    return (
      <div className="p-4 sm:p-6">
        <Card>
          <EmptyState
            icon={Users}
            title="Welcome to LedgerFlow"
            description="You haven't created any clients yet. Add your first client to start tracking projects, invoices, and revenue."
            actionLabel="Add Client"
            onAction={() => (window.location.href = "/dashboard/clients?new=1")}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-slate-400 mt-1">Here's today's snapshot of your business.</p>
        </div>
        <Link href="/dashboard/invoices/new" className="self-start sm:self-auto">
          <Button icon={ArrowRight} className="group">Generate Invoice</Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <SnapshotCard icon={Wallet} label="Revenue" value={formatCurrency(snapshot?.revenue)} tone="up" />
        <SnapshotCard icon={TrendingDown} label="Expenses" value={formatCurrency(snapshot?.expenses)} />
        <SnapshotCard icon={TrendingUp} label="Profit" value={formatCurrency(snapshot?.profit)} tone="up" />
        <SnapshotCard icon={FileClock} label="Pending" value={snapshot?.pendingInvoices ?? 0} />
      </div>

      {/* AI Insights */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <Sparkles className="size-4.5 text-primary" />
          <h2 className="text-base font-semibold text-white">AI Business Insights</h2>
        </div>
        {!insightsData?.insights?.length ? (
          <p className="text-sm text-slate-500">Insights will appear here once you have some activity.</p>
        ) : (
          <div className="space-y-3">
            {insightsData.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-navy-900/50 border border-white/5">
                <span
                  className={`size-2 rounded-full mt-1.5 shrink-0 ${
                    insight.type === "positive"
                      ? "bg-primary"
                      : insight.type === "warning"
                      ? "bg-rose-400"
                      : "bg-slate-400"
                  }`}
                />
                <p className="text-sm text-slate-300">{insight.title}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Link href="/dashboard/clients?new=1">
          <Card hover className="p-4 sm:p-5 cursor-pointer">
            <p className="text-sm font-semibold text-white">Add Client</p>
            <p className="text-xs text-slate-500 mt-1">Onboard a new client to start invoicing.</p>
          </Card>
        </Link>
        <Link href="/dashboard/projects?new=1">
          <Card hover className="p-4 sm:p-5 cursor-pointer">
            <p className="text-sm font-semibold text-white">Create Project</p>
            <p className="text-xs text-slate-500 mt-1">Track scope, budget, and deadlines.</p>
          </Card>
        </Link>
        <Link href="/dashboard/invoices/new">
          <Card hover className="p-4 sm:p-5 cursor-pointer">
            <p className="text-sm font-semibold text-white">Generate Invoice</p>
            <p className="text-xs text-slate-500 mt-1">Manually or with AI in seconds.</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}