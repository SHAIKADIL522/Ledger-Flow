"use client";

import { useState, useEffect } from "react";
import { Building2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { api } from "@/lib/api";
import { CURRENCIES } from "@/lib/format";

const DEFAULTS = {
  businessName: "", ownerName: "", businessEmail: "", businessPhone: "",
  website: "", gstNumber: "", panNumber: "", country: "", state: "",
  city: "", postalCode: "", address: "", defaultCurrency: "INR",
  logoUrl: "",
};

export default function BusinessSection() {
  const [form,   setForm]   = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => {
    api.get("/settings/business")
      .then((d) => { if (d.business) setForm((f) => ({ ...f, ...d.business })); })
      .catch(() => {});
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
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
        <Building2 className="size-4.5 text-primary" />
        <h2 className="text-base font-semibold text-white">Business</h2>
      </div>

      <form onSubmit={save} className="space-y-4">
        <Input
          label="Company Logo URL"
          value={form.logoUrl}
          onChange={f("logoUrl")}
          helperText="Appears automatically on all invoices"
        />
        {form.logoUrl && (
          <img
            src={form.logoUrl}
            alt="Logo preview"
            className="h-12 object-contain rounded border border-white/10 bg-white/5 px-2"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input label="Business Name" value={form.businessName} onChange={f("businessName")} />
          <Input label="Owner Name"    value={form.ownerName}    onChange={f("ownerName")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Business Email" type="email" value={form.businessEmail} onChange={f("businessEmail")} />
          <Input label="Business Phone" value={form.businessPhone} onChange={f("businessPhone")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Website" value={form.website} onChange={f("website")} />
          <Select
            label="Currency"
            value={form.defaultCurrency}
            onChange={f("defaultCurrency")}
            options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="GST Number" value={form.gstNumber} onChange={f("gstNumber")} />
          <Input label="PAN Number" value={form.panNumber} onChange={f("panNumber")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Country" value={form.country} onChange={f("country")} />
          <Input label="State"   value={form.state}   onChange={f("state")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="City"        value={form.city}       onChange={f("city")} />
          <Input label="Postal Code" value={form.postalCode} onChange={f("postalCode")} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">Address</label>
          <textarea
            value={form.address}
            onChange={f("address")}
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-navy-800/60 border border-white/10 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" loading={saving}>Save Business</Button>
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