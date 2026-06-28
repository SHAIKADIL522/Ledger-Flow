"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Printer, Mail, ArrowLeft, Sparkles, Trash2 } from "lucide-react";
import { Card, Badge } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import { useInvoice, useUpdateInvoiceStatus, useDeleteInvoice, invoicePdfUrl } from "@/lib/hooks/useInvoices";
import { formatCurrency, formatDate } from "@/lib/format";

const STATUS_OPTIONS = ["DRAFT", "SENT", "PAID", "OVERDUE"];

// ── Delete confirm modal ───────────────────────────────────────────────────
function DeleteModal({ invoiceNumber, onConfirm, onCancel, isLoading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm bg-navy-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-center size-12 rounded-full bg-red-500/10 border border-red-500/20 mx-auto mb-4">
          <Trash2 className="size-5 text-red-400" />
        </div>
        <h2 className="text-base font-bold text-white text-center mb-1">Delete Invoice</h2>
        <p className="text-sm text-slate-400 text-center mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-white">{invoiceNumber}</span>?
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

// ── Main detail page ───────────────────────────────────────────────────────
export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);

  const { data, isLoading } = useInvoice(id);
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();

  if (isLoading) return <div className="h-96 animate-pulse bg-white/5 rounded-2xl" />;
  const invoice = data?.invoice;
  if (!invoice) return null;

  function handleConfirmDelete() {
    deleteInvoice.mutate(invoice.id, {
      onSuccess: () => {
        setShowDelete(false);
        router.push("/dashboard/invoices");
      },
      onError: () => setShowDelete(false),
    });
  }

  // Recalculate for display (matches PDF calc)
  const discountPercent = Number(invoice.discountPercent) || 0;
  const taxPercent = Number(invoice.taxPercent) || 0;
  const subtotal = Number(invoice.subtotal);
  const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
  const taxableAmount = Number((subtotal - discountAmount).toFixed(2));
  const cgst = Number(((taxableAmount * taxPercent) / 2 / 100).toFixed(2));
  const sgst = cgst;
  const total = Number(invoice.total);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {showDelete && (
        <DeleteModal
          invoiceNumber={invoice.invoiceNumber}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDelete(false)}
          isLoading={deleteInvoice.isPending}
        />
      )}

      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white cursor-pointer"
      >
        <ArrowLeft className="size-4" /> Back to Invoices
      </button>

      <div className="flex items-center justify-between flex-wrap gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{invoice.invoiceNumber}</h1>
          <Badge status={invoice.status} />
          {invoice.generatedByAI && (
            <span className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="size-3" /> AI Generated
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={invoice.status}
            onChange={(e) => updateStatus.mutate({ id: invoice.id, status: e.target.value })}
            className="h-10 px-3 rounded-lg bg-navy-800/60 border border-white/10 text-sm text-slate-200"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
            Print
          </Button>
          <a href={invoicePdfUrl(invoice.id)} target="_blank" rel="noopener noreferrer">
            <Button icon={Download}>Download PDF</Button>
          </a>
          <Button
            variant="ghost"
            icon={Mail}
            onClick={() =>
              alert("Email sending requires RESEND_API_KEY to be configured on the backend.")
            }
          >
            Send Email
          </Button>
          {/* Delete button */}
          <button
            onClick={() => setShowDelete(true)}
            className="h-10 px-4 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="size-4" />
            Delete
          </button>
        </div>
      </div>

      <Card className="p-8 md:p-12">
        <div className="flex justify-between items-start mb-10 flex-wrap gap-6">
          <div>
            <h2 className="text-xl font-bold text-white">INVOICE</h2>
            <p className="text-sm text-slate-500 mt-1">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right text-sm text-slate-400">
            <p>Issue Date: {formatDate(invoice.issueDate)}</p>
            <p>Due Date: {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</p>
          </div>
        </div>

        <div className="mb-10">
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Bill To</p>
          <p className="text-base font-semibold text-white">{invoice.client?.companyName}</p>
          <p className="text-sm text-slate-400">{invoice.client?.contactName}</p>
          <p className="text-sm text-slate-400">{invoice.client?.email}</p>
        </div>

        {/* Items table */}
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-900 text-left text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium text-right">Qty</th>
                <th className="px-4 py-3 font-medium text-right">Unit Price</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-t border-white/5">
                  <td className="px-4 py-3 text-slate-200">{item.description}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{Number(item.quantity)}</td>
                  <td className="px-4 py-3 text-right text-slate-400">
                    {formatCurrency(item.unitPrice, invoice.currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-200">
                    {formatCurrency(item.amount, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals — now shows full GST breakdown */}
        <div className="flex justify-end mt-6">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, invoice.currency)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-sm text-red-400">
                <span>Discount ({discountPercent}%)</span>
                <span>- {formatCurrency(discountAmount, invoice.currency)}</span>
              </div>
            )}
            {taxPercent > 0 && (
              <>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Taxable Amount</span>
                  <span>{formatCurrency(taxableAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>CGST ({taxPercent / 2}%)</span>
                  <span>{formatCurrency(cgst, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>SGST ({taxPercent / 2}%)</span>
                  <span>{formatCurrency(sgst, invoice.currency)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
              <span>Total</span>
              <span>{formatCurrency(total, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Notes</p>
            <p className="text-sm text-slate-400">{invoice.notes}</p>
          </div>
        )}
      </Card>
    </div>
  );
}