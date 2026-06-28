"use client";

import { useState } from "react";
import { Database, Download } from "lucide-react";
import { Card } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import { API_URL } from "@/lib/api";

const ENTITIES = [
  { key: "clients",  label: "Clients",  desc: "All client records" },
  { key: "invoices", label: "Invoices", desc: "Invoices with line items" },
  { key: "expenses", label: "Expenses", desc: "All expense records" },
  { key: "projects", label: "Projects", desc: "All project records" },
];

export default function DataSection() {
  const [loading, setLoading] = useState(null);

  const exportData = async (entity, format) => {
    const key = `${entity}-${format}`;
    setLoading(key);
    try {
      const res = await fetch(
        `${API_URL}/settings/export/${entity}?format=${format}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `ledgerflow_${entity}_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
        <Database className="size-4.5 text-primary" />
        <h2 className="text-base font-semibold text-white">Data Management</h2>
      </div>

      <p className="text-sm text-slate-400 mb-5">
        Export your data at any time in CSV or JSON format.
      </p>

      <div className="space-y-1">
        {ENTITIES.map((entity, idx) => (
          <div
            key={entity.key}
            className={`flex items-center justify-between py-3.5 ${
              idx < ENTITIES.length - 1 ? "border-b border-white/5" : ""
            }`}
          >
            <div>
              <p className="text-sm font-medium text-white">{entity.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{entity.desc}</p>
            </div>
            <div className="flex gap-2">
              {["csv", "json"].map((fmt) => (
                <Button
                  key={fmt}
                  size="sm"
                  variant="secondary"
                  icon={Download}
                  loading={loading === `${entity.key}-${fmt}`}
                  onClick={() => exportData(entity.key, fmt)}
                >
                  {fmt.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}