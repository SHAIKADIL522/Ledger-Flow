import { Wallet, Brain, FileStack } from "lucide-react";

const SCREENS = [
  {
    icon: Wallet,
    title: "Financial Overview",
    items: ["Revenue", "Expenses", "Profit", "Growth"],
  },
  {
    icon: Brain,
    title: "AI Insights",
    items: ["Spending trends", "Predictions", "Recommendations"],
  },
  {
    icon: FileStack,
    title: "Invoice Manager",
    items: ["Paid", "Pending", "Overdue"],
  },
];

export default function DashboardShowcase() {
  return (
    <section className="section-pad py-28">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.35em] text-primary font-semibold">Product</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4">
            Everything in one dashboard
          </h2>
          <p className="text-slate-400 mt-4">No more switching between five different tools.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {SCREENS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-2xl border border-white/10 bg-navy-800/40 overflow-hidden hover:-translate-y-1.5 transition-transform duration-300">
                <div className="h-40 bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center border-b border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-faint bg-[size:24px_24px] opacity-40" />
                  <Icon className="size-12 text-primary relative z-10" />
                </div>
                <div className="p-6">
                  <h3 className="text-base font-semibold text-white mb-3">{s.title}</h3>
                  <ul className="space-y-2">
                    {s.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="size-1.5 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
