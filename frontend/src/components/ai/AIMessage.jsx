"use client";

import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useRouter } from "next/navigation";

function TrendIcon({ trend }) {
  if (trend === "up")   return <TrendingUp   className="size-3.5 text-emerald-400" />;
  if (trend === "down") return <TrendingDown  className="size-3.5 text-rose-400" />;
  return                       <Minus         className="size-3.5 text-slate-400" />;
}

function InsightIcon({ type }) {
  if (type === "positive") return <CheckCircle2   className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />;
  if (type === "warning")  return <AlertTriangle  className="size-3.5 text-amber-400  shrink-0 mt-0.5" />;
  return                          <Info           className="size-3.5 text-slate-400  shrink-0 mt-0.5" />;
}

export default function AIMessage({ msg }) {
  const router = useRouter();

  // ── USER BUBBLE ──
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-primary/20 border border-primary/30 text-sm text-white leading-relaxed">
          {msg.text}
        </div>
      </div>
    );
  }

  // ── AI BUBBLE ──
  const hasStructured =
    (msg.metrics  && msg.metrics.length  > 0) ||
    (msg.insights && msg.insights.length > 0) ||
    (msg.actions  && msg.actions.length  > 0);

  return (
    <div className="flex flex-col gap-2 max-w-[95%]">
      {/* Summary / message text */}
      {(msg.summary || msg.message) && (
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-navy-800 border border-white/10 text-sm text-slate-200 leading-relaxed">
          {msg.summary || msg.message}
        </div>
      )}

      {/* Metrics grid */}
      {msg.metrics?.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {msg.metrics.map((m, i) => (
            <div key={i} className="px-3 py-2.5 rounded-xl bg-navy-800/80 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendIcon trend={m.trend} />
                <span className="text-xs text-slate-400 truncate">{m.label}</span>
              </div>
              <p className="text-sm font-semibold text-white">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {msg.insights?.length > 0 && (
        <div className="px-3 py-2.5 rounded-xl bg-navy-800/60 border border-white/10 space-y-2">
          {msg.insights.map((ins, i) => (
            <div key={i} className="flex items-start gap-2">
              <InsightIcon type={ins.type} />
              <span className="text-xs text-slate-300 leading-relaxed">{ins.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {msg.actions?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {msg.actions.map((a, i) => (
            <button
              key={i}
              onClick={() => router.push(a.route)}
              className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary hover:bg-primary/20 transition-colors cursor-pointer"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}