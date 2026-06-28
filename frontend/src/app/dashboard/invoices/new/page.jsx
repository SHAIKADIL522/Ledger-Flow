"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, PenLine, Plus, Trash2, Wand2 } from "lucide-react";
import { Card } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useClients } from "@/lib/hooks/useClients";
import { useAiInvoiceDraft, useCreateInvoice } from "@/lib/hooks/useInvoices";
import { formatCurrency, CURRENCIES } from "@/lib/format";

const emptyItem = () => ({ description: "", quantity: 1, unitPrice: "" });

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetClientId = searchParams.get("clientId") || "";
  const presetProjectId = searchParams.get("projectId") || "";

  const [mode, setMode] = useState("manual");
  const { data: clientsData } = useClients();
  const clients = clientsData?.clients || [];

  // ---------- Manual state ----------
  const [clientId, setClientId] = useState(presetClientId);
  const [currency, setCurrency] = useState("INR");
  const [items, setItems] = useState([emptyItem()]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [generatedByAI, setGeneratedByAI] = useState(false);

  // ---------- AI state ----------
  const [prompt, setPrompt] = useState("");
  const aiDraft = useAiInvoiceDraft();
  const [aiError, setAiError] = useState("");

  const createInvoice = useCreateInvoice();
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (presetClientId) setClientId(presetClientId);
  }, [presetClientId]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0),
    [items]
  );
  const total = useMemo(() => {
    const afterDiscount = subtotal - (subtotal * Number(discountPercent || 0)) / 100;
    return afterDiscount + (afterDiscount * Number(taxPercent || 0)) / 100;
  }, [subtotal, taxPercent, discountPercent]);

  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleGenerateAI = async () => {
    setAiError("");
    try {
      const result = await aiDraft.mutateAsync({ prompt, currency });
      setItems(result.items.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })));
      if (result.notes) setNotes(result.notes);
      setGeneratedByAI(true);
      setMode("manual"); // drop into review/edit view with prefilled items
    } catch (err) {
      setAiError(err.message || "Couldn't generate invoice items. Try rephrasing your request.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    const cleanItems = items
      .filter((i) => i.description && i.unitPrice !== "")
      .map((i) => ({ description: i.description, quantity: Number(i.quantity) || 1, unitPrice: Number(i.unitPrice) }));

    if (!clientId) return setSubmitError("Select a client.");
    if (!cleanItems.length) return setSubmitError("Add at least one line item.");

    try {
      const data = await createInvoice.mutateAsync({
        clientId,
        projectId: presetProjectId || undefined,
        items: cleanItems,
        currency,
        taxPercent: Number(taxPercent) || 0,
        discountPercent: Number(discountPercent) || 0,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes,
        generatedByAI,
      });
      router.push(`/dashboard/invoices/${data.invoice.id}`);
    } catch (err) {
      setSubmitError(err.message || "Couldn't create the invoice.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Generate Invoice</h1>
        <p className="text-sm text-slate-400 mt-1">Create manually, or describe it in plain English and let AI draft it.</p>
      </div>

      <div className="inline-flex p-1 rounded-full border border-white/10 bg-navy-800/60">
        <button
          onClick={() => setMode("manual")}
          className={`px-5 h-9 rounded-full text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            mode === "manual" ? "bg-primary/10 text-primary border border-primary/20" : "text-slate-400"
          }`}
        >
          <PenLine className="size-3.5" /> Manual
        </button>
        <button
          onClick={() => setMode("ai")}
          className={`px-5 h-9 rounded-full text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            mode === "ai" ? "bg-primary/10 text-primary border border-primary/20" : "text-slate-400"
          }`}
        >
          <Sparkles className="size-3.5" /> AI Assisted
        </button>
      </div>

      {mode === "ai" && (
        <Card className="p-6 space-y-4">
          <label className="block text-sm font-medium text-slate-300">Describe the invoice</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Create invoice for website redesign worth ₹50,000 for ABC Technologies"
            className="w-full px-4 py-3 rounded-xl bg-navy-800/60 border border-white/10 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-400/60 resize-none"
          />
          {aiError && <p className="text-sm text-rose-400">{aiError}</p>}
          <Button icon={Wand2} loading={aiDraft.isPending} onClick={handleGenerateAI} disabled={!prompt.trim()}>
            Generate with AI
          </Button>
        </Card>
      )}

      {mode === "manual" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                label="Client"
                required
                placeholder="Select a client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                options={clients.map((c) => ({ value: c.id, label: c.companyName }))}
              />
              <Select
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={CURRENCIES.map((c) => ({ value: c, label: c }))}
              />
            </div>

            {generatedByAI && (
              <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                <Sparkles className="size-3.5" /> These line items were generated by AI — review before sending.
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">Line Items</label>
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    placeholder="Description"
                    className="col-span-6 h-11 px-3 rounded-lg bg-navy-800/60 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-400/60"
                  />
                  <input
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    placeholder="Qty"
                    className="col-span-2 h-11 px-3 rounded-lg bg-navy-800/60 border border-white/10 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-400/60"
                  />
                  <input
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                    placeholder="Unit price"
                    className="col-span-3 h-11 px-3 rounded-lg bg-navy-800/60 border border-white/10 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-400/60"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="col-span-1 h-11 flex items-center justify-center text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                    aria-label="Remove line item"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={addItem}>
                Add Item
              </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <Input label="Tax %" type="number" min="0" max="100" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} />
              <Input label="Discount %" type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
              <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-navy-800/60 border border-white/10 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-400/60 resize-none"
              />
            </div>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-white pt-2 border-t border-white/10">
              <span>Total</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
          </Card>

          {submitError && <p className="text-sm text-rose-400">{submitError}</p>}

          <Button type="submit" size="lg" className="w-full" loading={createInvoice.isPending}>
            Generate Invoice
          </Button>
        </form>
      )}
    </div>
  );
}
