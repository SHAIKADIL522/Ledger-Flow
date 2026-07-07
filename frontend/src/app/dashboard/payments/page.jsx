"use client";

import Link from "next/link";
import { CreditCard, Landmark } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/Primitives";
import { useTransactions } from "@/lib/hooks/useFinance";
import { formatCurrency, formatDate } from "@/lib/format";

const GATEWAY_LABEL = {
  razorpay: "Razorpay",
  stripe: "Stripe",
};

function GatewayPill({ gateway }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
      {GATEWAY_LABEL[gateway] || gateway}
    </span>
  );
}

export default function PaymentsPage() {
  const { data, isLoading } = useTransactions();
  const transactions = data?.transactions || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-sm text-slate-400 mt-1">
          Every payment verified by a gateway webhook — bank transfers you mark paid manually
          don't appear here.
        </p>
      </div>

      {!isLoading && transactions.length === 0 ? (
        <Card>
          <EmptyState
            icon={CreditCard}
            title="No payments received yet"
            description="Once a client pays an invoice through Razorpay or Stripe, the confirmed transaction shows up here automatically."
          />
        </Card>
      ) : (
        <Card className="divide-y divide-white/5">
          {transactions.map((txn) => (
            <div key={txn.id} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">
                    {txn.invoice ? (
                      <Link
                        href={`/dashboard/invoices/${txn.invoice.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        Invoice #{txn.invoice.invoiceNumber}
                      </Link>
                    ) : (
                      "Invoice deleted"
                    )}
                  </p>
                  <GatewayPill gateway={txn.gateway} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {txn.invoice?.client?.companyName && <span>{txn.invoice.client.companyName} · </span>}
                  {formatDate(txn.createdAt)}
                  {" · "}
                  <span className="font-mono">{txn.reference}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-sm font-semibold text-white">
                  {formatCurrency(txn.amount, txn.currency)}
                </p>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card className="p-5 flex items-start gap-3">
        <Landmark className="size-4.5 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          Manage bank details, UPI ID, and gateway configuration in{" "}
          <Link href="/dashboard/settings" className="text-primary underline underline-offset-2">
            Settings → Payments
          </Link>.
        </p>
      </Card>
    </div>
  );
}