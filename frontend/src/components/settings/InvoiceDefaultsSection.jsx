"use client";

import { useState, useEffect } from "react";
import { FileText, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { api } from "@/lib/api";

const DEFAULTS = {
  invoicePrefix: "INV-", startingNumber: 1001,
  defaultTax: 18, lateFee: 2, paymentTerms: 30, defaultNotes: "",
};

export default function InvoiceDefaultsSection() {
  const [form,   setForm]   = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    api.get("/settings/business")
      .then((d) => {
        if (d.business) {
          setForm((f) => ({
            ...f,
            invoicePrefix:  d.business.invoicePrefix  || f.invoicePrefix,
            startingNumber: d.business.startingNumber || f.startingNumber,
            defaultTax:     d.business.defaultTax     || f.defaultTax,
            lateFee:        d.business.lateFee        || f.lateFee,
            paymentTerms:   d.business.paymentTerms   || f.paymentTerms,
            defaultNotes:   d.business.defaultNotes   || f.defaultNotes,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const f = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === "number" ? Number(e.target.value) : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/settings/business", form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
        <FileText className="size-4.5 text-primary" />
        <h2 className="text-base font-semibold text-white">Invoice Defaults</h2>
        <p className="text-xs text-slate-500 ml-2">Applied to every new invoice automatically</p>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Invoice Prefix"  value={form.invoicePrefix}  onChange={f("invoicePrefix")} placeholder="INV-" />
          <Input label="Starting Number" type="number" value={form.startingNumber} onChange={f("startingNumber")} placeholder="1001" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Default Tax (%)" type="number" value={form.defaultTax}   onChange={f("defaultTax")}   step="0.1" />
          <Input label="Late Fee (%)"    type="number" value={form.lateFee}      onChange={f("lateFee")}      step="0.1" />
          <Input label="Due Days"        type="number" value={form.paymentTerms} onChange={f("paymentTerms")} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">Default Notes</label>
          <textarea
            value={form.defaultNotes}
            onChange={f("defaultNotes")}
            rows={3}
            placeholder="Thank you for your business!"
            className="w-full px-4 py-3 rounded-xl bg-navy-800/60 border border-white/10 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" loading={saving}>Save Defaults</Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-primary">
              <CheckCircle2 className="size-4" /> Saved
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}