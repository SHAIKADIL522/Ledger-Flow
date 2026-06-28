import { Receipt, BarChart3, FileText } from "lucide-react";

const FEATURES = [
  {
    icon: Receipt,
    color: "cyan",
    title: "Smart Bookkeeping",
    text: "Automatically categorize transactions, receipts, and expenses as they happen — no manual entry.",
  },
  {
    icon: BarChart3,
    color: "indigo",
    title: "AI Financial Insights",
    text: "Get AI-powered recommendations to improve cash flow, cut waste, and grow profitability.",
  },
  {
    icon: FileText,
    color: "pink",
    title: "Invoice Automation",
    text: "Create, send, and track professional invoices — manually or with one AI-generated prompt.",
  },
];

const COLOR_MAP = {
  cyan: { glow: "bg-cyan-500/10 group-hover:bg-cyan-500/20", icon: "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]" },
  indigo: { glow: "bg-indigo-500/10 group-hover:bg-indigo-500/20", icon: "text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]" },
  pink: { glow: "bg-pink-500/10 group-hover:bg-pink-500/20", icon: "text-pink-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.6)]" },
};

export default function Features() {
  return (
    <section id="features" className="section-pad py-28 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.35em] text-primary font-semibold">Features</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4">
            Everything your finances need
          </h2>
          <p className="text-slate-400 mt-4">
            One intelligent platform replaces spreadsheets, invoicing tools, and manual bookkeeping.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            const c = COLOR_MAP[f.color];
            return (
              <div
                key={f.title}
                className="group relative rounded-[1.75rem] border border-white/10 bg-navy-800/40 p-8 overflow-hidden transition-transform duration-300 hover:-translate-y-1.5 hover:border-primary/20"
              >
                <div className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-[70px] pointer-events-none transition-colors duration-500 ${c.glow}`} />
                <div className="relative z-10 size-14 rounded-2xl bg-navy-900 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <Icon className={`size-6 ${c.icon}`} />
                </div>
                <h3 className="relative z-10 text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="relative z-10 text-sm text-slate-400 leading-relaxed">{f.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
