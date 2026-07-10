"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_URL } from "@/lib/api";

// ── Expenses ──────────────────────────────────────────────────────────────────

export function useExpenses(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return useQuery({
    queryKey: ["expenses", filters],
    queryFn:  () => api.get(`/expenses${params ? `?${params}` : ""}`),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data)    => api.post("/expenses", data),
    onSuccess:  ()        => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/expenses/${id}`, data),
    onSuccess:  ()             => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id)  => api.delete(`/expenses/${id}`),
    onSuccess:  ()    => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ── Reports ───────────────────────────────────────────────────────────────────

export function useReports({ from, to, clientId } = {}) {
  const params = new URLSearchParams();
  if (from)     params.set("from",     from);
  if (to)       params.set("to",       to);
  if (clientId) params.set("clientId", clientId);

  return useQuery({
    queryKey: ["reports", { from, to, clientId }],
    queryFn:  () => api.get(`/reports/summary?${params.toString()}`),
    enabled:  !!(from && to),
  });
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn:  () => api.get("/notifications"),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function useSnapshot() {
  return useQuery({
    queryKey: ["dashboard", "snapshot"],
    queryFn:  () => api.get("/dashboard/snapshot"),
  });
}

export function useInsights() {
  return useQuery({
    queryKey: ["dashboard", "insights"],
    queryFn:  () => api.get("/dashboard/insights"),
  });
}

// ── Payments ──────────────────────────────────────────────────────────────────

export function useTransactions(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return useQuery({
    queryKey: ["payments", "transactions", filters],
    queryFn:  () => api.get(`/payments/transactions${params ? `?${params}` : ""}`),
  });
}

export function transactionsExportUrl(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return `${API_URL}/payments/transactions/export${params ? `?${params}` : ""}`;
}

export function useRefundTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (transactionId) => api.post("/payments/refund", { transactionId }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ["payments", "transactions"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}