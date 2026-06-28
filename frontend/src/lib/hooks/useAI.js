"use client";

import { useCallback } from "react";
import { api } from "@/lib/api";
import { useAIStore } from "@/store/aiStore";

export function useAI() {
  const { addMessage, setLoading, isLoading, getHistory } = useAIStore();

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isLoading) return;

      // optimistic user message
      addMessage({ id: Date.now(), role: "user", text });
      setLoading(true);

      try {
        const history = getHistory();
        const result = await api.post("/ai/chat", {
          message: text,
          history: history.slice(-6),
        });
        addMessage({ id: Date.now() + 1, role: "assistant", ...result });
      } catch (err) {
        addMessage({
          id:       Date.now() + 1,
          role:     "assistant",
          type:     "error",
          message:  err.message || "AI assistant is temporarily unavailable.",
          metrics:  [],
          insights: [],
          actions:  [],
        });
      } finally {
        setLoading(false);
      }
    },
    [isLoading, addMessage, setLoading, getHistory]
  );

  return { sendMessage };
}