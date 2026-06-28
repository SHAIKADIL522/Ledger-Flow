"use client";

const SUGGESTIONS = [
  "Summarize this month",
  "Who hasn't paid?",
  "Show overdue invoices",
  "Compare with last month",
  "Where am I spending money?",
  "Summarize my projects",
  "Tell me about my clients",
  "Show recent invoices",
];

export default function AISuggestions({ onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          {s}
        </button>
      ))}
    </div>
  );
}