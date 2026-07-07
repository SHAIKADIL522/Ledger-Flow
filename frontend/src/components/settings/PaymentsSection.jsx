"use client";

import { useState, useEffect } from "react";
import { Landmark, QrCode, CheckCircle2, Zap, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { api } from "@/lib/api";

const DEFAULTS = {
  upiId: "",
  bankName: "",
  bankAccountHolder: "",
  bankAccountNumber: "",
  bankIfsc: "",
};

function GatewayBadge({ configured }) {
  return configured ? (
    <span className="flex items-center gap-1.5 text-sm text-primary">
      <CheckCircle2 className="size-4" /> Configured
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-sm text-slate-500">
      <XCircle className="size-4" /> Not configured
    </span>
  );
}

export default function PaymentsSection() {
  const [form,   setForm]   = useState(DEFAULTS);
  const [status, setStatus] = useState(null); // { razorpay, stripe }
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => {
    api.get("/settings/business")
      .then((d) => {
        if (!d.business) return;
        const clean = Object.fromEntries(
          Object.entries(DEFAULTS).map(([k]) => [k, d.business[k] ?? ""])
        );
        setForm(clean);
      })
      .catch(() => {});

    api.get("/payments/status")
      .then(setStatus)
      .catch(() => setStatus({ razorpay: false, stripe: false }));
  }, []);

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.put("/settings/business", form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bank details */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
          <Landmark className="size-4.5 text-primary" />
          <h2 className="text-base font-semibold text-white">Bank Account</h2>
        </div>
        <p className="text-sm text-slate-400 -mt-2 mb-4">
          Shown on invoice PDFs so clients know where to send bank transfers.
        </p>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Bank Name" value={form.bankName} onChange={f("bankName")} />
            <Input label="Account Holder" value={form.bankAccountHolder} onChange={f("bankAccountHolder")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Account Number" value={form.bankAccountNumber} onChange={f("bankAccountNumber")} />
            <Input label="IFSC Code" value={form.bankIfsc} onChange={f("bankIfsc")} />
          </div>

          {/* UPI lives in the same form/save call — one endpoint, one button */}
          <div className="pt-2 border-t border-white/10">
            <Input
              label="UPI ID"
              value={form.upiId}
              onChange={f("upiId")}
              placeholder="yourname@okaxis"
              helperText="Used to generate the dynamic UPI QR code on invoices"
            />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={saving}>Save Payment Details</Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-primary">
                <CheckCircle2 className="size-4" /> Saved
              </span>
            )}
          </div>
        </form>
      </Card>

      {/* Gateway status — read-only for now, platform-level keys set in .env */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
          <Zap className="size-4.5 text-primary" />
          <h2 className="text-base font-semibold text-white">Payment Gateways</h2>
        </div>
        <p className="text-sm text-slate-400 -mt-2 mb-4">
          Online payment buttons on invoices use these. Ask your admin to configure gateway
          keys on the server to enable a provider.
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-navy-800/60 border border-white/10">
            <span className="text-sm text-slate-200">Razorpay</span>
            {status ? <GatewayBadge configured={status.razorpay} /> : <span className="text-sm text-slate-500">Checking…</span>}
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-navy-800/60 border border-white/10">
            <span className="text-sm text-slate-200">Stripe</span>
            {status ? <GatewayBadge configured={status.stripe} /> : <span className="text-sm text-slate-500">Checking…</span>}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="size-4.5 text-primary" />
          <h2 className="text-base font-semibold text-white">Transaction History</h2>
        </div>
        <p className="text-sm text-slate-400">
          View all verified payments received across every gateway on the{" "}
          <a href="/dashboard/payments" className="text-primary underline underline-offset-2">
            Payments page
          </a>.
        </p>
      </Card>
    </div>
  );
}