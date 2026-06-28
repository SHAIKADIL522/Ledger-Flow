"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";

const NOTIF_ITEMS = [
  { key: "invoicePaid",     label: "Invoice Paid",          desc: "When a client pays an invoice" },
  { key: "invoiceOverdue",  label: "Invoice Overdue",       desc: "When an invoice becomes overdue" },
  { key: "newClient",       label: "New Client",            desc: "When a new client is added" },
  { key: "weeklySummary",   label: "Weekly Summary",        desc: "Every Monday morning" },
  { key: "monthlyReport",   label: "Monthly Report",        desc: "First day of each month" },
  { key: "marketingEmails", label: "Marketing Emails",      desc: "Product updates and tips" },
  { key: "browserNotifs",   label: "Browser Notifications", desc: "Push alerts in your browser" },
];

const DEFAULTS = {
  invoicePaid: true, invoiceOverdue: true, newClient: true,
  weeklySummary: true, monthlyReport: false, marketingEmails: false, browserNotifs: false,
};

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`relative w-10 h-[22px] rounded-full transition-colors cursor-pointer shrink-0 ${
        checked ? "bg-primary" : "bg-white/10"
      }`}
    >
      <span
        className={`absolute top-[3px] size-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

export default function NotificationsSection() {
  const [prefs,  setPrefs]  = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    api.get("/settings/notifications")
      .then((d) => { if (d.prefs) setPrefs(d.prefs); })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/settings/notifications", prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
        <Bell className="size-4.5 text-primary" />
        <h2 className="text-base font-semibold text-white">Notifications</h2>
      </div>

      <div className="space-y-1">
        {NOTIF_ITEMS.map((item, idx) => (
          <div
            key={item.key}
            className={`flex items-center justify-between py-3.5 ${
              idx < NOTIF_ITEMS.length - 1 ? "border-b border-white/5" : ""
            }`}
          >
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-medium text-white">{item.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </div>
            <Toggle
              checked={!!prefs[item.key]}
              onChange={(v) => setPrefs({ ...prefs, [item.key]: v })}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/10">
        <Button size="sm" loading={saving} onClick={save}>
          Save Preferences
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-primary">
            <CheckCircle2 className="size-4" /> Saved
          </span>
        )}
      </div>
    </Card>
  );
}