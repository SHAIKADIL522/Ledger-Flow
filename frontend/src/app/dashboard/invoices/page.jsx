"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText, Download, Trash2 } from "lucide-react";
import { Card, EmptyState, Badge } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import { useInvoices, useDeleteInvoice, invoicePdfUrl } from "@/lib/hooks/useInvoices";
import { formatCurrency, formatDate } from "@/lib/format";

const FILTERS = ["ALL", "DRAFT", "SENT", "PAID", "OVERDUE"];

// ── Delete confirmation modal ──────────────────────────────────────────────
function DeleteModal({ invoice, onConfirm, onCancel, isLoading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm bg-navy-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-center size-12 rounded-full bg-red-500/10 border border-red-500/20 mx-auto mb-4">
          <Trash2 className="size-5 text-red-400" />
        </div>
        <h2 className="text-base font-bold text-white text-center mb-1">Delete Invoice</h2>
        <p className="text-sm text-slate-400 text-center mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-white">{invoice?.invoiceNumber}</span>?
          <br />
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 h-10 rounded-lg border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const [filter, setFilter] = useState("ALL");
  const [deleteTarget, setDeleteTarget] = useState(null); // invoice object to delete

  const { data, isLoading } = useInvoices(filter !== "ALL" ? { status: filter } : {});
  const deleteInvoice = useDeleteInvoice();
  const invoices = data?.invoices || [];

  function handleDeleteClick(e, inv) {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget(inv);
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteInvoice.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: () => setDeleteTarget(null),
    });
  }

  return (
    <div className="space-y-6">
      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal
          invoice={deleteTarget}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deleteInvoice.isPending}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-sm text-slate-400 mt-1">
            Create, send, and track every invoice in one place.
          </p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button icon={Plus}>Generate Invoice</Button>
        </Link>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 h-9 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
              filter === f
                ? "border-primary bg-primary/10 text-primary"
                : "border-white/10 text-slate-400 hover:border-white/20"
            }`}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {!isLoading && invoices.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            description="Generate your first invoice manually or let AI draft it from a plain-English description."
            actionLabel="Generate Invoice"
            onAction={() => (window.location.href = "/dashboard/invoices/new")}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Invoice</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Issue Date</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                  <th className="px-5 py-3 font-medium text-right">PDF</th>
                  <th className="px-5 py-3 font-medium text-right">Delete</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="font-medium text-white hover:text-primary"
                      >
                        {inv.invoiceNumber}
                      </Link>
                      {inv.generatedByAI && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          AI
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-300">{inv.client?.companyName}</td>
                    <td className="px-5 py-4 text-slate-400">{formatDate(inv.issueDate)}</td>
                    <td className="px-5 py-4">
                      <Badge status={inv.status} />
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-white">
                      {formatCurrency(inv.total, inv.currency)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <a
                        href={invoicePdfUrl(inv.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center size-8 rounded-lg text-slate-400 hover:text-primary hover:bg-white/5"
                        aria-label="Download PDF"
                      >
                        <Download className="size-4" />
                      </a>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(e) => handleDeleteClick(e, inv)}
                        className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        aria-label="Delete invoice"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}