"use client";

import { useState } from "react";
import { Plus, Receipt, Trash2, Pencil } from "lucide-react";
import { Card, EmptyState, Modal } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/lib/hooks/useFinance";
import { useClients } from "@/lib/hooks/useClients";
import { formatCurrency, formatDate, CURRENCIES } from "@/lib/format";

const CATEGORIES = ["SOFTWARE", "MARKETING", "TRAVEL", "OFFICE", "CONTRACTORS", "UTILITIES", "OTHER"];

function labelCategory(cat) {
  return cat.charAt(0) + cat.slice(1).toLowerCase();
}

function toDateInput(iso) {
  if (!iso) return "";
  return new Date(iso).toISOString().split("T")[0];
}

const emptyForm = {
  title: "", amount: "", currency: "INR",
  category: "OTHER", otherCategory: "",
  clientId: "", notes: "", spentAt: "",
};

// ── Expense form (shared by create + edit) ────────────────────────────────────
function ExpenseForm({ form, setForm, clients, onSubmit, loading, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Title"
        required
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Adobe Subscription"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Amount"
          type="number"
          min="0"
          required
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <Select
          label="Currency"
          value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value })}
          options={CURRENCIES.map((c) => ({ value: c, label: c }))}
        />
      </div>

      {/* Category */}
      <Select
        label="Category"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value, otherCategory: "" })}
        options={CATEGORIES.map((c) => ({ value: c, label: labelCategory(c) }))}
      />
      {/* "Other" sub-input — only shown when OTHER selected */}
      {form.category === "OTHER" && (
        <Input
          label="Specify category"
          required
          placeholder="e.g. Equipment, Training, Legal..."
          value={form.otherCategory}
          onChange={(e) => setForm({ ...form, otherCategory: e.target.value })}
        />
      )}

      {/* Client selector */}
      <Select
        label="Related Client (optional)"
        placeholder="— None —"
        value={form.clientId}
        onChange={(e) => setForm({ ...form, clientId: e.target.value })}
        options={[
          { value: "", label: "— None —" },
          ...clients.map((c) => ({ value: c.id, label: c.companyName })),
        ]}
      />

      {/* Date */}
      <div style={{ overflow: "visible", position: "relative" }}>
        <Input
          label="Date"
          type="date"
          value={form.spentAt}
          onChange={(e) => setForm({ ...form, spentAt: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [clientFilter, setClientFilter] = useState(""); // filter expenses by client

  const { data, isLoading }         = useExpenses();
  const { data: clientsData }       = useClients();
  const createExpense               = useCreateExpense();
  const updateExpense               = useUpdateExpense();
  const deleteExpense               = useDeleteExpense();

  const allExpenses = data?.expenses || [];
  const clients     = clientsData?.clients || [];

  // Client-filtered view
  const expenses = clientFilter
    ? allExpenses.filter((e) => e.clientId === clientFilter)
    : allExpenses;

  // ── helpers ─────────────────────────────────────────────────────────────
  function buildPayload(f) {
    // Store "OTHER - Equipment" in notes, pass category as OTHER
    const notes = f.category === "OTHER" && f.otherCategory
      ? `OTHER:${f.otherCategory}`
      : f.notes || "";
    return {
      title:    f.title,
      amount:   Number(f.amount),
      currency: f.currency,
      category: f.category,
      clientId: f.clientId || undefined,
      notes,
      spentAt:  f.spentAt  ? new Date(f.spentAt).toISOString() : undefined,
    };
  }

  function parseNotes(exp) {
    // Decode the "OTHER:label" convention back for display
    if (exp.category === "OTHER" && exp.notes?.startsWith("OTHER:")) {
      return exp.notes.replace("OTHER:", "");
    }
    return null;
  }

  // ── Create ───────────────────────────────────────────────────────────────
  const openCreate = () => { setForm(emptyForm); setCreateOpen(true); };
  const handleCreate = async (e) => {
    e.preventDefault();
    await createExpense.mutateAsync(buildPayload(form));
    setCreateOpen(false);
    setForm(emptyForm);
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const openEdit = (exp) => {
    const otherLabel = parseNotes(exp) || "";
    setEditTarget(exp);
    setForm({
      title:         exp.title    || "",
      amount:        String(Number(exp.amount)),
      currency:      exp.currency || "INR",
      category:      exp.category || "OTHER",
      otherCategory: otherLabel,
      clientId:      exp.clientId || "",
      notes:         (!otherLabel && exp.notes) ? exp.notes : "",
      spentAt:       toDateInput(exp.spentAt),
    });
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    await updateExpense.mutateAsync({ id: editTarget.id, data: buildPayload(form) });
    setEditOpen(false);
    setEditTarget(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-sm text-slate-400 mt-1">Track spending and keep your profit numbers accurate.</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>Add Expense</Button>
      </div>

      {/* Client filter */}
      {clients.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Filter by client:</span>
          <button
            onClick={() => setClientFilter("")}
            className={`px-3 h-8 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              !clientFilter ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-slate-400 hover:border-white/20"
            }`}
          >
            All
          </button>
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => setClientFilter(clientFilter === c.id ? "" : c.id)}
              className={`px-3 h-8 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                clientFilter === c.id ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-slate-400 hover:border-white/20"
              }`}
            >
              {c.companyName}
            </button>
          ))}
        </div>
      )}

      {!isLoading && expenses.length === 0 ? (
        <Card>
          <EmptyState
            icon={Receipt}
            title="No expenses logged yet"
            description="Add your first expense to see it reflected in your profit calculation."
            actionLabel="Add Expense"
            onAction={openCreate}
          />
        </Card>
      ) : (
        <Card className="divide-y divide-white/5">
          {expenses.map((exp) => {
            const otherLabel = parseNotes(exp);
            const catDisplay = exp.category === "OTHER" && otherLabel
              ? `Other (${otherLabel})`
              : labelCategory(exp.category);
            const clientName = clients.find((c) => c.id === exp.clientId)?.companyName;

            return (
              <div key={exp.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{exp.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {catDisplay}
                    {clientName && <span className="text-primary/70"> · {clientName}</span>}
                    {" · "}{formatDate(exp.spentAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-sm font-semibold text-white">{formatCurrency(exp.amount, exp.currency)}</p>
                  <button
                    onClick={() => openEdit(exp)}
                    className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-white/5 cursor-pointer"
                    aria-label="Edit expense"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => confirm(`Delete "${exp.title}"?`) && deleteExpense.mutate(exp.id)}
                    className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 cursor-pointer"
                    aria-label="Delete expense"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ── CREATE MODAL ── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Expense">
        <ExpenseForm
          form={form} setForm={setForm} clients={clients}
          onSubmit={handleCreate} loading={createExpense.isPending}
          submitLabel="Add Expense"
        />
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Expense">
        <ExpenseForm
          form={form} setForm={setForm} clients={clients}
          onSubmit={handleEdit} loading={updateExpense.isPending}
          submitLabel="Save Changes"
        />
      </Modal>
    </div>
  );
}