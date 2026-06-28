"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function AIInput({ onSend, disabled }) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div className="flex items-center gap-2 p-3 border-t border-white/10 bg-navy-900 shrink-0">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Ask anything about your business..."
        disabled={disabled}
        className="flex-1 h-10 px-4 rounded-xl bg-navy-800/80 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="size-10 flex items-center justify-center rounded-xl bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <Send className="size-4" />
      </button>
    </div>
  );
}