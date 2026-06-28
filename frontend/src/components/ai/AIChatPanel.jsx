"use client";

import { useEffect, useRef } from "react";
import { X, Bot, Trash2 } from "lucide-react";
import { useAIStore } from "@/store/aiStore";
import { useAI } from "@/lib/hooks/useAI";
import { useAuthStore } from "@/store/authStore";
import AIMessage from "./AIMessage";
import AISuggestions from "./AISuggestions";
import AIInput from "./AIInput";

export default function AIChatPanel() {
  const { isOpen, closePanel, messages, isLoading, clearMessages } = useAIStore();
  const { sendMessage } = useAI();
  const { user } = useAuthStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const firstName = user?.name?.split(" ")[0] || "there";
  const showWelcome = messages.length === 0;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/60 z-40 lg:hidden"
        onClick={closePanel}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside className="fixed right-0 top-0 h-full w-80 z-50 bg-navy-900 border-l border-white/10 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bot className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">AI Assistant</p>
              <p className="text-xs text-emerald-400">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
            <button
              onClick={closePanel}
              className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
              aria-label="Close AI panel"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {showWelcome ? (
            <div>
              <div className="text-center py-6">
                <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                  <Bot className="size-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-white mb-1">
                  Hello {firstName} 👋
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ask me anything about your business — revenue, invoices, expenses, clients.
                </p>
              </div>
              <AISuggestions onSelect={sendMessage} />
            </div>
          ) : (
            messages.map((msg) => <AIMessage key={msg.id} msg={msg} />)
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm bg-navy-800 border border-white/10 w-fit">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-2 rounded-full bg-primary/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <AIInput onSend={sendMessage} disabled={isLoading} />
      </aside>
    </>
  );
}