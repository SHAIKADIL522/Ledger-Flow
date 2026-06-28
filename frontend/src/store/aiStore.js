"use client";

import { create } from "zustand";

export const useAIStore = create((set, get) => ({
  isOpen:    false,
  messages:  [],
  isLoading: false,

  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),
  openPanel:   () => set({ isOpen: true }),
  closePanel:  () => set({ isOpen: false }),

  addMessage:   (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setLoading:   (isLoading) => set({ isLoading }),
  clearMessages:() => set({ messages: [] }),

  // returns [{role, content}] for the API history param
  getHistory: () =>
    get().messages.map((m) => ({
      role:    m.role,
      content: m.text || m.message || m.summary || "",
    })),
}));