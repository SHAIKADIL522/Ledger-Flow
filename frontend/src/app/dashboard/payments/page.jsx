"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CreditCard, Landmark, Download, RotateCcw } from "lucide-react";
import { Card, EmptyState, Badge } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import {
  useTransactions,
  useRefundTransaction,
  transactionsExportUrl,
} from "@/lib/hooks/useFinance";
import { formatCurrency, formatDate } from "@/lib/format";

const GATEWAY_LABEL = { razorpay: "Razorpay", stripe: "Stripe" };

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "SUCCESS", label: "Success" },
  { value: "REFUNDED", label: "Refunded" },
];

const GATEWAY_OPTIONS = [
  { value: "", label: "All gateways" },
  { value: "razorpay", label: "Razorpay" },
  { value: "stripe", label: "Stripe" },
];

function GatewayPill({ gateway }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
      {GATEWAY_LABEL[gateway] || gateway}
    </span>
  );
}

// Debounces the search box so every keystroke doesn't fire a request —
// matches the pattern used on the Expenses page.
function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [gateway, setGateway] = useState("");
  const [refundingId, setRefundingId] = useState(null);

  const debouncedSearch = useDebounced(search);
  const filters = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(status && { status }),
    ...(gateway && { gateway }),
  };

  const { data, isLoading } = useTransactions(filters);
  const refund = useRefundTransaction();
  const transactions = data?.transactions || [];

  async function handleRefund(txn) {
    if (!confirm(`Refund ${formatCurrency(txn.amount, txn.currency)} for invoice #${txn.invoice?.invoiceNumber}? This can't be undone.`)) {
      return;
    }
    setRefundingId(txn.id);
    try {
      await refund.mutateAsync(txn.id);
    } catch (err) {
      alert(err.message || "Refund failed.");
    } finally {
      setRefundingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-sm text-slate-400 mt-1">
            Every payment verified by a gateway webhook — bank transfers you mark paid manually
            don't appear here.
          </p>
        </div>
        <a href={transactionsExportUrl(filters)} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" icon={Download}>
            Export CSV
          </Button>
        </a>
      </div>

      <Card className="p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[220px]">
          <Input
            placeholder="Search invoice #, client, or reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-44">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} />
        </div>
        <div className="w-44">
          <Select value={gateway} onChange={(e) => setGateway(e.target.value)} options={GATEWAY_OPTIONS} />
        </div>
      </Card>

      {!isLoading && transactions.length === 0 ? (
        <Card>
          <EmptyState
            icon={CreditCard}
            title="No payments found"
            description={
              search || status || gateway
                ? "No transactions match these filters — try clearing them."
                : "Once a client pays an invoice through Razorpay or Stripe, the confirmed transaction shows up here automatically."
            }
          />
        </Card>
      ) : (
        <Card className="divide-y divide-white/5">
          {transactions.map((txn) => (
            <div key={txn.id} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
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
                  {txn.status === "REFUNDED" && <Badge status="REFUNDED">Refunded</Badge>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {txn.invoice?.client?.companyName && <span>{txn.invoice.client.companyName} · </span>}
                  {formatDate(txn.createdAt)}
                  {" · "}
                  <span className="font-mono">{txn.reference}</span>
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm font-semibold text-white">
                  {formatCurrency(txn.amount, txn.currency)}
                </p>
                {txn.status !== "REFUNDED" && (
                  <Button
                    variant="ghost"
                    icon={RotateCcw}
                    onClick={() => handleRefund(txn)}
                    disabled={refundingId === txn.id}
                    title="Refund this payment"
                  >
                    {refundingId === txn.id ? "Refunding…" : "Refund"}
                  </Button>
                )}
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