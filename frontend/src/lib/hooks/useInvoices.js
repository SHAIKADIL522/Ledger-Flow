"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_URL } from "@/lib/api";

export function useInvoices(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: () => api.get(`/invoices${params ? `?${params}` : ""}`),
  });
}

export function useInvoice(id) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => api.get(`/invoices/${id}`),
    enabled: !!id,
  });
}

export function useAiInvoiceDraft() {
  return useMutation({
    mutationFn: (data) => api.post("/invoices/ai-draft", data),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/invoices", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.patch(`/invoices/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/invoices/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function invoicePdfUrl(id) {
  return `${API_URL}/invoices/${id}/pdf`;
}
